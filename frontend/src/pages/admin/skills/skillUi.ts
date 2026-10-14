import type { BadgeTone } from '../../../components/ui/Badge'
import type { LevelBand } from '../../../services/admin/skillCatalog.service'

export function fmt(n: number): string {
  return n.toLocaleString('en-IN')
}

export const LEVEL_OPTIONS: { value: LevelBand; label: string }[] = [
  { value: '', label: 'All levels' },
  { value: 'HIGH', label: 'High (8–10)' },
  { value: 'MEDIUM', label: 'Medium (5–7)' },
  { value: 'LOW', label: 'Low (1–4)' },
]

/** Tone for a proficiency score: high is green, medium blue, low grey. */
export function levelTone(level: number): BadgeTone {
  return level >= 8 ? 'green' : level >= 5 ? 'sky' : 'slate'
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? parts[0]?.[1] ?? '')).toUpperCase() || '?'
}
