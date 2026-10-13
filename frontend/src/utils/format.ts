/** Backend timestamps are LocalDateTime in UTC with no zone suffix — parse them as UTC. */
export function parseServerDate(value: string): Date {
  // Postgres sends microseconds; trim to the milliseconds every JS engine accepts.
  const trimmed = value.replace(/(\.\d{3})\d+/, '$1')
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed)
  return new Date(hasZone ? trimmed : `${trimmed}Z`)
}

export function timeAgo(value: string, now: Date = new Date()): string {
  const seconds = Math.round((now.getTime() - parseServerDate(value).getTime()) / 1000)
  if (Number.isNaN(seconds)) return ''
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return parseServerDate(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

export function initialsOf(firstName?: string, lastName?: string): string {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?'
}

/** SCREAMING_SNAKE_CASE (or any separator soup) to "Title Case". */
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function percent(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0
}

/** Counts events per hour over the 24 hours ending at `now`. */
export function bucketByHour(timestamps: Date[], now: Date): number[] {
  const buckets = new Array<number>(24).fill(0)
  const end = now.getTime()
  for (const t of timestamps) {
    const hoursAgo = Math.floor((end - t.getTime()) / 3_600_000)
    if (hoursAgo >= 0 && hoursAgo < 24) buckets[23 - hoursAgo] += 1
  }
  return buckets
}

/** "Today, 10:00 AM" / "Tomorrow, 2:00 PM" / "Thu 16 Oct, 11:00 AM" for an upcoming server timestamp. */
export function formatUpcoming(value: string, now: Date = new Date()): { day: string; time: string } {
  const date = parseServerDate(value)
  const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOf(date) - startOf(now)) / 86_400_000)
  const day =
    days === 0
      ? 'Today'
      : days === 1
        ? 'Tomorrow'
        : date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
  return { day, time }
}
