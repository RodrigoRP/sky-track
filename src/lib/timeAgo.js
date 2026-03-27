/**
 * Returns a locale-aware relative time string for a given ISO timestamp.
 * Uses Intl.RelativeTimeFormat so EN/PT output is automatic.
 *
 * Returns null when isoString is falsy (new alert, no Supabase).
 */
export function timeAgo(isoString, locale = 'en') {
  if (!isoString) return null
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return locale.startsWith('pt') ? 'agora' : 'just now'
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (minutes < 60) return rtf.format(-minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return rtf.format(-hours, 'hour')
  return rtf.format(-Math.floor(hours / 24), 'day')
}
