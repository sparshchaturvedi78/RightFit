import { parseServerDate } from '../../utils/format'

/** A date or date-time from the server as a short day, for example 16 Oct 2026. */
export function shortDate(value?: string): string | undefined {
  if (!value) return undefined
  return parseServerDate(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
