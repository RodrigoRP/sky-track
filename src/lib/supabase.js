import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase client — null when env vars are not configured.
 * All callers must guard with `if (!supabase) return …`
 * so the app works as a local prototype without a backend.
 */
export const supabase = url && key ? createClient(url, key) : null

/** true when Supabase is configured and the app can use the backend */
export const isSupabaseEnabled = Boolean(supabase)
