import { supabase } from './supabase'

// ── Shape converters ──────────────────────────────────────────────────────────

export function rowToAlert(row) {
  return {
    id: row.id,
    origin: row.origin,
    destination: row.destination,
    dates: row.dates,
    targetPrice: row.target_price,
    currentPrice: row.current_price ?? row.target_price + 50,
    currentBest: row.current_price ?? row.target_price + 50,
    status: row.status ?? 'active',
    trend: row.trend ?? 'flat',
    change: row.change ?? 0,
    trendLabel: row.trend_label ?? 'Monitoring started',
    peakPrice: row.peak_price ?? Math.round(row.target_price * 1.45),
    lowPrice: row.low_price ?? Math.round(row.target_price * 0.88),
    image: row.image ?? 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80',
    destinationFull: row.destination_full ?? row.destination,
    alternatives: row.alternatives ?? [],
    priceHistory: row.price_history ?? [],
    departureMonth: row.departure_month ?? null,
    returnMonth: row.return_month ?? null,
    lastCheckedAt: row.last_checked_at ?? null,
  }
}

function alertToRow(alert) {
  return {
    origin: alert.origin,
    destination: alert.destination,
    dates: alert.dates,
    target_price: alert.targetPrice,
    current_price: alert.currentPrice,
    status: alert.status,
    trend: alert.trend,
    change: alert.change,
    trend_label: alert.trendLabel,
    peak_price: alert.peakPrice,
    low_price: alert.lowPrice,
    image: alert.image,
    destination_full: alert.destinationFull,
    alternatives: alert.alternatives ?? [],
    price_history: alert.priceHistory ?? [],
    departure_month: alert.departureMonth ?? null,
    return_month: alert.returnMonth ?? null,
  }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function fetchAlerts() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(rowToAlert)
}

export async function insertAlert(alert) {
  if (!supabase) return null
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('alerts')
    .insert({ ...alertToRow(alert), user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return rowToAlert(data)
}

export async function updateAlert(id, changes) {
  if (!supabase) return
  const row = {}
  if (changes.targetPrice !== undefined) row.target_price = changes.targetPrice
  if (changes.currentPrice !== undefined) row.current_price = changes.currentPrice
  if (changes.currentBest !== undefined) row.current_price = changes.currentBest
  if (changes.status !== undefined) row.status = changes.status
  if (changes.trend !== undefined) row.trend = changes.trend
  if (changes.change !== undefined) row.change = changes.change
  if (changes.trendLabel !== undefined) row.trend_label = changes.trendLabel
  if (changes.priceHistory !== undefined) row.price_history = changes.priceHistory
  if (changes.dates !== undefined) row.dates = changes.dates
  if (changes.departureMonth !== undefined) row.departure_month = changes.departureMonth
  if (changes.returnMonth !== undefined) row.return_month = changes.returnMonth
  const { error } = await supabase.from('alerts').update(row).eq('id', id)
  if (error) throw error
}

export async function deleteAlert(id) {
  if (!supabase) return
  const { error } = await supabase.from('alerts').delete().eq('id', id)
  if (error) throw error
}

/**
 * Migrate local (localStorage) alerts into Supabase.
 * Called once after first login if local alerts exist.
 * Returns the server-assigned alerts (with new numeric IDs).
 */
export async function migrateLocalAlerts(localAlerts) {
  if (!supabase || !localAlerts.length) return []
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const rows = localAlerts.map((a) => ({ ...alertToRow(a), user_id: user.id }))
  const { data, error } = await supabase.from('alerts').insert(rows).select()
  if (error) throw error
  return data.map(rowToAlert)
}

/**
 * Invoke the price-check Edge Function for a single alert.
 * Returns { currentPrice, trend, change, trendLabel, priceHistory }
 */
export async function refreshAlertPrice(alertId) {
  if (!supabase) return null
  const { data, error } = await supabase.functions.invoke('price-check', {
    body: { alertId },
  })
  if (error) throw error
  return data
}
