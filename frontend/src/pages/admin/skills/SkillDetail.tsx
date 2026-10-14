import { motion } from 'motion/react'
import { Pencil, RotateCcw, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/form'
import { PanelError, Skeleton } from '../../../components/dashboard/Panel'
import { useQuery } from '../../../hooks/useQuery'
import { useToast } from '../../../hooks/useToast'
import { adminSkillCatalogService, type LevelBand, type SkillDTO } from '../../../services/admin/skillCatalog.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { avatarGradient, formatDay } from '../employees/employeeUi'
import { fmt, initials, LEVEL_OPTIONS, levelTone } from './skillUi'

/** People shown per "Show more" press. */
const PAGE = 10

/**
 * Right column for one skill: the numbers, a level filter, and the associates who hold it, a page at a time.
 * Each level / page combination is kept in the store, so going back to it is instant.
 */
export default function SkillDetail({
  skill,
  onEdit,
  onChanged,
}: {
  skill: SkillDTO
  onEdit: () => void
  onChanged: () => void
}) {
  const toast = useToast()
  const [level, setLevel] = useState<LevelBand>('')
  const [size, setSize] = useState(PAGE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data, loading, error: loadError } = useQuery('skillHolders', { skillId: skill.id, level, page: 0, size })

  const remaining = data ? Math.max(0, data.totalElements - data.content.length) : 0

  async function toggleActive() {
    setSaving(true)
    setError(null)
    try {
      if (skill.isActive) await adminSkillCatalogService.retireSkill(skill.id)
      else await adminSkillCatalogService.restoreSkill(skill.id)
      toast.success(skill.isActive ? 'Skill retired' : 'Skill restored', skill.skillName)
      onChanged()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not change this skill.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="flex min-h-[560px] flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/6">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-500">{skill.category ?? 'No category'}</p>
          <h2 className="mt-1 flex flex-wrap items-center gap-2.5 text-xl font-bold tracking-tight text-ink-900 dark:text-white">
            {skill.skillName}
            <Badge tone={skill.isActive ? 'green' : 'slate'} dot>
              {skill.isActive ? 'Active' : 'Retired'}
            </Badge>
          </h2>
          {skill.description && <p className="mt-1.5 max-w-prose text-sm text-ink-500 dark:text-slate-400">{skill.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" icon={<Pencil className="h-4 w-4" />} onClick={onEdit}>
            Edit
          </Button>
          <Button
            variant={skill.isActive ? 'danger' : 'secondary'}
            loading={saving}
            icon={skill.isActive ? <XCircle className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
            onClick={() => void toggleActive()}
          >
            {skill.isActive ? 'Retire' : 'Restore'}
          </Button>
        </div>
      </header>

      <div className="space-y-5 px-6 py-5">
        {!skill.isActive && (
          <p className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-ink-500 dark:border-white/8 dark:bg-white/3 dark:text-slate-400">
            Retired: no one can pick this skill for their profile any more. The people who already hold it keep it.
          </p>
        )}
        {error && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}

        {/* Numbers */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="associates hold it" value={data?.activeHolders} />
          <Stat label="at level 7 or higher" value={data ? pct(data.atLevelSevenOrAbove, data.activeHolders) : undefined} suffix={data && data.activeHolders ? '%' : ''} />
          <Stat label="open requirements ask for it" value={data?.openRequirements} hint="Matched on the skill name in the requirement text" />
        </div>

        {/* Level filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Filter by level" className="inline-flex flex-wrap rounded-xl border border-slate-200/80 bg-white p-1 dark:border-white/8 dark:bg-white/4">
            {LEVEL_OPTIONS.map((o) => (
              <button
                key={o.label}
                type="button"
                aria-pressed={level === o.value}
                onClick={() => {
                  setLevel(o.value)
                  setSize(PAGE)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  level === o.value ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900' : 'text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          {data && (
            <span className="text-xs text-ink-500 tabular-nums dark:text-slate-400">
              {data.totalElements === 0 ? 'Nobody' : `${fmt(data.content.length)} of ${fmt(data.totalElements)}`} · sorted by level
            </span>
          )}
        </div>

        {/* Holders */}
        {loadError && !data ? (
          <PanelError message={loadError} status={null} onRetry={onChanged} />
        ) : !data ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : data.content.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-5 py-10 text-center dark:border-white/10">
            <p className="text-sm font-semibold text-ink-900 dark:text-white">No associates at this level</p>
            <p className="mt-1 text-xs text-ink-500 dark:text-slate-400">
              {level ? 'Try another level, or show everyone.' : 'Nobody has picked this skill on their profile yet.'}
            </p>
          </div>
        ) : (
          <ul className={`space-y-2 transition-opacity ${loading ? 'opacity-60' : ''}`}>
            {data.content.map((h, i) => (
              <motion.li
                key={h.employeeId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.25 }}
                className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-4 py-3 dark:border-white/8 dark:bg-white/3"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${avatarGradient(h.id)} text-[11px] font-bold text-white`}>
                  {initials(h.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{h.name}</p>
                  <p className="truncate text-xs text-ink-500 dark:text-slate-400">
                    {h.employeeId}
                    {h.designation ? ` · ${h.designation}` : ''}
                  </p>
                </div>
                <div className="hidden text-right text-xs text-ink-500 sm:block dark:text-slate-400">
                  <p className="tabular-nums">{h.yearsOfExperience != null ? `${h.yearsOfExperience} yrs` : '—'}</p>
                  <p>{h.lastUsedDate ? `used ${formatDay(h.lastUsedDate)}` : 'last use not set'}</p>
                </div>
                <Badge tone={levelTone(h.proficiencyLevel)}>{h.proficiencyLevel} / 10</Badge>
              </motion.li>
            ))}
          </ul>
        )}

        {data && remaining > 0 && (
          <div className="flex justify-center">
            <Button variant="secondary" onClick={() => setSize((s) => s + PAGE)}>
              Show {Math.min(PAGE, remaining)} more
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function pct(part: number, whole: number): number | undefined {
  if (!whole) return 0
  return Math.round((part / whole) * 100)
}

function Stat({ label, value, suffix = '', hint }: { label: string; value?: number; suffix?: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 dark:border-white/8 dark:bg-white/3" title={hint}>
      <div className="text-2xl font-extrabold tracking-tight text-ink-900 tabular-nums dark:text-white">
        {value === undefined ? <Skeleton className="inline-block h-6 w-14 align-middle" /> : `${fmt(value)}${suffix}`}
      </div>
      <div className="mt-0.5 text-xs text-ink-500 dark:text-slate-400">{label}</div>
    </div>
  )
}
