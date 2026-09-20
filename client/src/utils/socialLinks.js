export function isValidSocialLink(item) {
  if (!item?.url || item.active === false || item.meta?.enabled === false) return false
  try {
    const url = new URL(item.url)
    if (url.protocol === 'mailto:') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url.pathname)
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) return false
    if (item.title?.toLowerCase() === 'whatsapp') {
      return (url.hostname === 'wa.me' && /^\/\d{7,15}\/?$/.test(url.pathname)) || (url.hostname === 'api.whatsapp.com' && /^\d{7,15}$/.test(url.searchParams.get('phone') || ''))
    }
    return true
  } catch { return false }
}
