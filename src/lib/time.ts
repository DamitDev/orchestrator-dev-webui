function hasTimeZoneInfo(s: string): boolean {
  return /Z|[+-]\d{2}:?\d{2}$/.test(s)
}

function parseServerDate(dateStr: string): Date {
  // Treat timestamps without explicit TZ as UTC to avoid DST/offset drift
  const normalized = hasTimeZoneInfo(dateStr) ? dateStr : `${dateStr}Z`
  return new Date(normalized)
}

export function formatTimestamp(dateStr: string): string {
  try {
    const d = parseServerDate(dateStr)
    // General-purpose compact timestamp
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const time = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(d)
    return `${date} ${time}`
  } catch {
    return dateStr
  }
}

export function formatMessageTimestamp(dateStr: string): string {
  try {
    const d = parseServerDate(dateStr)
    const now = new Date()
    const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const time = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(d)
    if (msgDate.getTime() === today.getTime()) return time
    if (msgDate.getTime() === yesterday.getTime()) return `yesterday ${time}`
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return `${date} ${time}`
  } catch {
    return 'Invalid time'
  }
}


