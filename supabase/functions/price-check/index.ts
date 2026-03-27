/**
 * price-check Edge Function
 *
 * Fetches the current best price for a given alert from the Kiwi Tequila API,
 * stores a snapshot, updates the alert row, and returns the new state.
 *
 * Invoked:
 *  - On-demand: POST /functions/v1/price-check  { alertId: number }
 *  - On a schedule via pg_cron (every 6 hours) for all active alerts
 *
 * Required secrets (set via: supabase secrets set KEY=value):
 *   TEQUILA_API_KEY   → from https://tequila.kiwi.com
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// ── Kiwi Tequila helpers ──────────────────────────────────────────────────────

/** Convert YYYY-MM-DD → DD/MM/YYYY (Tequila date format) */
function toTequilaDate(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-')
  return `${d}/${m}/${y}`
}

/** Last day of a YYYY-MM month as YYYY-MM-DD */
function lastDayOfMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

/**
 * Returns a [dateFrom, dateTo] window for the Tequila API search.
 *
 * Priority:
 * 1. `departure_month` (YYYY-MM) — search the full calendar month.
 * 2. Free-text `dates` — use parsed date ±7 days as window.
 */
function getDepartureDateRange(alert: {
  departure_month?: string | null
  dates: string
}): [string, string] {
  if (alert.departure_month) {
    const yyyyMm = alert.departure_month
    const [yearStr, month] = yyyyMm.split('-')
    const year = parseInt(yearStr, 10)
    const firstDay = `${year}-${month}-01`
    // Advance to next year if the month has already passed
    if (new Date(firstDay) < new Date()) {
      const nextYear = `${year + 1}-${month}-01`
      return [nextYear, lastDayOfMonth(`${year + 1}-${month}`)]
    }
    return [firstDay, lastDayOfMonth(yyyyMm)]
  }
  const mid = parseDepartureDateFromText(alert.dates)
  const from = new Date(mid)
  const to = new Date(mid)
  from.setDate(from.getDate() - 7)
  to.setDate(to.getDate() + 7)
  return [from.toISOString().split('T')[0], to.toISOString().split('T')[0]]
}

/**
 * Fallback: parse free-text dates like "Oct 12", "Nov 1–15" → YYYY-MM-DD.
 *
 * Uses a word-boundary-aware regex to avoid capturing digits embedded inside
 * larger numbers (e.g. "20" from "2026").
 */
function parseDepartureDateFromText(dates: string): string {
  const months: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  }
  const lower = dates.toLowerCase()
  for (const [mon, num] of Object.entries(months)) {
    if (lower.includes(mon)) {
      // Match a standalone 1-2 digit number — negative lookahead/behind prevents
      // matching digits that are part of a larger number (e.g. "20" inside "2026").
      const dayMatch = lower.match(/(?<!\d)\d{1,2}(?!\d)/)
      const day = dayMatch ? dayMatch[0].padStart(2, '0') : '15'
      const year = new Date().getFullYear()
      const candidate = `${year}-${num}-${day}`
      if (new Date(candidate) < new Date()) return `${year + 1}-${num}-${day}`
      return candidate
    }
  }
  // Fallback: 30 days from now
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

async function fetchBestPrice(
  origin: string,
  destination: string,
  dateFrom: string,   // YYYY-MM-DD
  dateTo: string,     // YYYY-MM-DD
  apiKey: string
): Promise<number | null> {
  const url = new URL('https://api.tequila.kiwi.com/v2/search')
  url.searchParams.set('fly_from', origin)
  url.searchParams.set('fly_to', destination)
  url.searchParams.set('date_from', toTequilaDate(dateFrom))
  url.searchParams.set('date_to', toTequilaDate(dateTo))
  url.searchParams.set('adults', '1')
  url.searchParams.set('limit', '5')
  url.searchParams.set('curr', 'USD')
  url.searchParams.set('sort', 'price')
  url.searchParams.set('asc_or_desc', 'asc')

  const res = await fetch(url.toString(), {
    headers: { apikey: apiKey },
  })
  if (!res.ok) return null

  const json = await res.json()
  const flights: Array<{ price: number }> = json.data ?? []
  if (!flights.length) return null

  return Math.min(...flights.map((f) => f.price))
}

// ── Trend calculation ─────────────────────────────────────────────────────────

function calcTrend(history: Array<{ price: number }>, newPrice: number) {
  if (history.length < 3) return { trend: 'flat', change: 0, trendLabel: 'Monitoring started' }
  const prevPrice = history[history.length - 1].price
  const change = newPrice - prevPrice
  const pct = Math.abs(change / prevPrice) * 100

  if (pct < 1) return { trend: 'flat', change, trendLabel: 'Prices stable — monitoring for opportunities' }
  if (change < 0) return { trend: 'down', change, trendLabel: `Prices dropping — down $${Math.abs(change).toFixed(0)}` }
  return { trend: 'up', change, trendLabel: `Prices rising — up $${change.toFixed(0)}` }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  try {
    const { alertId } = await req.json()

    // Validate caller identity and alert ownership
    const authHeader = req.headers.get('Authorization')
    let callerId: string | null = null
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user } } = await userClient.auth.getUser()
      callerId = user?.id ?? null
    }

    // Fetch the alert
    const { data: alert, error: alertErr } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single()
    if (alertErr || !alert) {
      return new Response(JSON.stringify({ error: 'Alert not found' }), { status: 404 })
    }

    // Enforce ownership when request comes from a user (not from another function)
    if (callerId && alert.user_id !== callerId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    // Get last 30 price snapshots
    const { data: snapshots } = await supabase
      .from('price_snapshots')
      .select('price, checked_at')
      .eq('alert_id', alertId)
      .order('checked_at', { ascending: false })
      .limit(30)

    const history = (snapshots ?? []).reverse().map((s) => ({
      price: s.price,
      date: new Date(s.checked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))

    // Determine departure date range for Tequila search
    const [dateFrom, dateTo] = getDepartureDateRange(alert)

    // Fetch live price from Kiwi Tequila (falls back to simulated if API not configured)
    let currentPrice: number
    const tequilaKey = Deno.env.get('TEQUILA_API_KEY')

    if (tequilaKey) {
      const livePrice = await fetchBestPrice(alert.origin, alert.destination, dateFrom, dateTo, tequilaKey)
      currentPrice = livePrice ?? alert.current_price ?? alert.target_price + 50
    } else {
      // Simulated price movement (±5%) for development
      const prev = alert.current_price ?? alert.target_price + 50
      const delta = prev * (Math.random() * 0.10 - 0.05)
      currentPrice = Math.round(prev + delta)
    }

    const { trend, change, trendLabel } = calcTrend(history, currentPrice)

    // Append new snapshot
    await supabase.from('price_snapshots').insert({
      alert_id: alertId,
      price: currentPrice,
    })

    // Update alert row
    const updatedHistory = [
      ...history,
      { price: currentPrice, date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
    ].slice(-30)

    await supabase.from('alerts').update({
      current_price: currentPrice,
      trend,
      change,
      trend_label: trendLabel,
      price_history: updatedHistory,
      last_checked_at: new Date().toISOString(),
    }).eq('id', alertId)

    // Trigger push if price dropped below target (throttle: 1 per alert per 4h)
    if (currentPrice <= alert.target_price) {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      const { data: recentPush } = await supabase
        .from('push_sent_log')
        .select('sent_at')
        .eq('alert_id', alertId)
        .single()

      const shouldPush = !recentPush || new Date(recentPush.sent_at) < new Date(fourHoursAgo)

      if (shouldPush) {
        await supabase.functions.invoke('send-push', {
          body: {
            userId: alert.user_id,
            alertId,
            title: '🎉 Target Price Reached!',
            body: `${alert.origin} → ${alert.destination} is now $${currentPrice} — below your $${alert.target_price} target!`,
            url: `/alert/${alertId}`,
          },
        })
        await supabase.from('push_sent_log').upsert({ alert_id: alertId, sent_at: new Date().toISOString() })
      }
    }

    return new Response(JSON.stringify({
      currentPrice,
      currentBest: currentPrice,
      trend,
      change,
      trendLabel,
      priceHistory: updatedHistory,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
