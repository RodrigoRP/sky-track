/**
 * price-check-all Edge Function
 *
 * Orchestrates price checks for all active alerts.
 * Invoked by pg_cron every 6 hours — no user JWT required.
 *
 * Flow:
 *   pg_cron → net.http_post → price-check-all → price-check (per alert, batched)
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const BATCH_SIZE = 5   // conservative — respects Amadeus sandbox rate limit
const BATCH_DELAY_MS = 2000  // 2s between batches

serve(async () => {
  try {
    // Fetch all active alert IDs
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('id')
      .eq('status', 'active')

    if (error) throw error

    const ids = (alerts ?? []).map((a: { id: number }) => a.id)

    if (ids.length === 0) {
      return new Response(JSON.stringify({ total: 0, checked: 0, failed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let checked = 0
    let failed = 0
    const alertsFailed: number[] = []

    // Process in small batches sequentially to avoid hitting Amadeus rate limits
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE)

      const results = await Promise.allSettled(
        batch.map((alertId: number) =>
          supabase.functions.invoke('price-check', { body: { alertId } })
        )
      )

      results.forEach((r, idx) => {
        const alertId = batch[idx]
        if (r.status === 'fulfilled' && !r.value.error) {
          checked++
        } else {
          failed++
          alertsFailed.push(alertId)
          const reason = r.status === 'rejected' ? r.reason : r.value.error
          console.error(`price-check failed for alertId=${alertId}:`, reason)
        }
      })

      // Delay between batches (skip after last batch)
      if (i + BATCH_SIZE < ids.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    return new Response(
      JSON.stringify({ total: ids.length, checked, failed, alertsFailed }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
