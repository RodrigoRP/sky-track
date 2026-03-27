/**
 * price-check Edge Function
 *
 * Fetches the current best price for a given alert from the Amadeus API,
 * stores a snapshot, updates the alert row, and returns the new state.
 *
 * Invoked:
 *  - On-demand: POST /functions/v1/price-check  { alertId: number }
 *  - On a schedule via pg_cron (every 6 hours) for all active alerts
 *
 * Required secrets (set via: supabase secrets set KEY=value):
 *   AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// ── Amadeus helpers ──────────────────────────────────────────────────────────

async function getAmadeusToken(): Promise<string> {
  const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: Deno.env.get('AMADEUS_CLIENT_ID')!,
      client_secret: Deno.env.get('AMADEUS_CLIENT_SECRET')!,
    }),
  })
  const json = await res.json()
  return json.access_token
}

/**
 * Derives a YYYY-MM-DD departure date from the alert row.
 *
 * Priority:
 * 1. `departure_month` (canonical YYYY-MM stored by CreateAlert) — most reliable.
 * 2. Free-text `dates` string — fallback for legacy alerts created before departure_month existed.
 */
function getDepartureDate(alert: {
  departure_month?: string | null
  dates: string
}): string {
  if (alert.departure_month) {
    return departureDateFromMonth(alert.departure_month)
  }
  return parseDepartureDateFromText(alert.dates)
}

/** Convert YYYY-MM → YYYY-MM-15 (mid-month representative date). Advances to next year if past. */
function departureDateFromMonth(yyyyMm: string): string {
  const [yearStr, month] = yyyyMm.split('-')
  const year = parseInt(yearStr, 10)
  const candidate = `${year}-${month}-15`
  if (new Date(candidate) < new Date()) return `${year + 1}-${month}-15`
  return candidate
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
  departureDate: string,
  token: string
): Promise<number | null> {
  const url = new URL('https://test.api.amadeus.com/v2/shopping/flight-offers')
  url.searchParams.set('originLocationCode', origin)
  url.searchParams.set('destinationLocationCode', destination)
  url.searchParams.set('departureDate', departureDate)
  url.searchParams.set('adults', '1')
  url.searchParams.set('max', '5')
  url.searchParams.set('currencyCode', 'USD')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null

  const json = await res.json()
  const offers: Array<{ price: { grandTotal: string } }> = json.data ?? []
  if (!offers.length) return null

  const prices = offers.map((o) => parseFloat(o.price.grandTotal))
  return Math.min(...prices)
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

    // Determine departure date — prefer canonical departure_month over free-text dates
    const departureDate = getDepartureDate(alert)

    // Fetch live price from Amadeus (falls back to simulated if API not configured)
    let currentPrice: number
    const clientId = Deno.env.get('AMADEUS_CLIENT_ID')

    if (clientId) {
      const token = await getAmadeusToken()
      const livePrice = await fetchBestPrice(alert.origin, alert.destination, departureDate, token)
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
