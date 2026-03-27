/**
 * send-push Edge Function
 *
 * Sends a Web Push notification to all subscriptions for a given user.
 * Falls back to email via Resend when push is unavailable (e.g. iOS Safari < 16.4).
 *
 * Required secrets:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
 *   RESEND_API_KEY  (optional — email fallback)
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

webpush.setVapidDetails(
  Deno.env.get('VAPID_EMAIL')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

interface PushPayload {
  userId: string
  alertId?: number
  title: string
  body: string
  url?: string
  tag?: string
}

serve(async (req) => {
  try {
    const payload: PushPayload = await req.json()
    const { userId, alertId, title, body, url = alertId ? `/alert/${alertId}` : '/notifications', tag = 'skytrack-alert' } = payload

    // Validate caller: when invoked by a user (not by price-check function-to-function),
    // ensure the JWT subject matches the target userId
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )
      const { data: { user } } = await userClient.auth.getUser()
      if (!user || user.id !== userId) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
      }
    }

    // Fetch all subscriptions for this user
    const { data: rows, error } = await supabase
      .from('push_subscriptions')
      .select('id, subscription')
      .eq('user_id', userId)

    if (error) throw error

    const message = JSON.stringify({ title, body, url, tag })
    let pushed = 0
    let expired = 0
    const expiredIds: number[] = []

    const results = await Promise.allSettled(
      (rows ?? []).map(({ subscription }) =>
        webpush.sendNotification(subscription, message)
      )
    )

    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        pushed++
      } else {
        // 410 = subscription expired/unsubscribed — remove it so we never retry
        if ((r.reason as { statusCode?: number })?.statusCode === 410) {
          expired++
          expiredIds.push((rows ?? [])[idx].id)
        }
      }
    })

    // Delete expired subscriptions in bulk
    if (expiredIds.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredIds)
    }

    const emailFallback = pushed === 0

    // Email fallback via Resend when no valid push subscription
    if (emailFallback && Deno.env.get('RESEND_API_KEY')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', userId)
        .single()

      const { data: authUser } = await supabase.auth.admin.getUserById(userId)
      const email = authUser?.user?.email
      const name = profile?.name ?? 'Traveller'

      if (email) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `SkyTrack <noreply@${Deno.env.get('VAPID_EMAIL')?.replace('mailto:', '')}>`,
            to: [email],
            subject: title,
            html: `<p>Hi ${name},</p><p>${body}</p><p><a href="${url}">View in SkyTrack →</a></p>`,
          }),
        })
      }
    }

    return new Response(JSON.stringify({ pushed, expired }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
