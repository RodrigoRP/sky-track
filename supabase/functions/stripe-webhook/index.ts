/**
 * stripe-webhook Edge Function
 *
 * Handles Stripe events to keep profiles.tier in sync.
 * Required secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 *
 * Events handled:
 *   checkout.session.completed       → tier = 'premium'
 *   customer.subscription.updated    → tier = 'premium' | 'free' (based on status)
 *   customer.subscription.deleted    → tier = 'free'
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'npm:stripe@14'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function setTierByCustomer(
  stripeCustomerId: string,
  tier: 'free' | 'premium',
  currentPeriodEnd?: number,
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single()

  if (profile) {
    const update: Record<string, unknown> = { tier }
    if (currentPeriodEnd !== undefined) {
      update.current_period_end = new Date(currentPeriodEnd * 1000).toISOString()
    }
    await supabase.from('profiles').update(update).eq('id', profile.id)
  }
}

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

serve(async (req) => {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return new Response('Missing signature', { status: 400 })

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.customer) {
        await setTierByCustomer(String(session.customer), 'premium')
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      if (sub.customer) {
        const tier = ACTIVE_STATUSES.has(sub.status) ? 'premium' : 'free'
        await setTierByCustomer(String(sub.customer), tier, sub.current_period_end)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      if (sub.customer) {
        await setTierByCustomer(String(sub.customer), 'free')
      }
    }
  } catch (err) {
    console.error('[stripe-webhook]', err)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
