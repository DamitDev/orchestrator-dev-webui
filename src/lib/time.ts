export function formatTimestamp(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZoneName: 'short'
    }).format(d)
  } catch {
    return dateStr
  }
}


