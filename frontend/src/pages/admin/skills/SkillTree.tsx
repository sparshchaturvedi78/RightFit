import { ChevronDown, ChevronRight, Pencil, Plus, RotateCcw, Search, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { useToast } from '../../../hooks/useToast'
import { getApiErrorMessage } from '../../../services/httpClient'
import { adminSkillCatalogService, type SkillCategoryDTO, type SkillDTO } from '../../../services/admin/skillCatalog.service'
import { fmt } from './skillUi'

/**
 * Left column: categories as groups, each with its skills underneath. Retired categories and skills stay visible,
 * dimmed, so they can be restored. Selecting a skill opens its associates on the right.
 */
export default function SkillTree({
  categories,
  skills,
  selectedId,
  onSelect,
  onAddSkill,
  onEditCategory,
  onAddCategory,
  onChanged,
}: {
  categories: SkillCategoryDTO[]
  skills: SkillDTO[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  onAddSkill: (category: SkillCategoryDTO) => void
  onEditCategory: (category: SkillCategoryDTO) => void
  onAddCategory: () => void
  onChanged: () => void
}) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const [showRetired, setShowRetired] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  // Categories start closed. Opened ones are remembered here; the selected skill's category and any category
  // that matches a search open by themselves.
  const [openIds, setOpenIds] = useState<Set<number>>(new Set())
  const selectedCategoryId = skills.find((s) => s.id === selectedId)?.categoryId ?? null

  function toggleOpen(id: number) {
    setOpenIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    return categories
      .filter((c) => showRetired || c.isActive)
      .map((c) => {
        const inCat = skills.filter((s) => s.categoryId === c.id)
        const categoryMatches = !!q && c.name.toLowerCase().includes(q)
        const rows = inCat
          .filter((s) => showRetired || s.isActive)
          .filter((s) => !q || categoryMatches || s.skillName.toLowerCase().includes(q))
        return { category: c, rows, total: inCat.length, categoryMatches }
      })
      .filter((g) => !q || g.rows.length > 0 || g.categoryMatches)
  }, [categories, skills, query, showRetired])

  async function toggleCategory(c: SkillCategoryDTO) {
    setBusy(c.id)
    try {
      if (c.isActive) await adminSkillCatalogService.retireCategory(c.id)
      else await adminSkillCatalogService.restoreCategory(c.id)
      toast.success(c.isActive ? 'Category retired' : 'Category restored', c.name)
      onChanged()
    } catch (err) {
      toast.error('Could not change the category', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  async function toggleSkill(s: SkillDTO) {
    setBusy(-s.id)
    try {
      if (s.isActive) await adminSkillCatalogService.retireSkill(s.id)
      else await adminSkillCatalogService.restoreSkill(s.id)
      toast.success(s.isActive ? 'Skill retired' : 'Skill restored', s.skillName)
      onChanged()
    } catch (err) {
      toast.error('Could not change the skill', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b border-slate-100 p-4 dark:border-white/6">
        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-white/5">
          <Search className="h-4 w-4 shrink-0 text-ink-500 dark:text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a category or skill"
            aria-label="Find a category or skill"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink-900 outline-none placeholder:text-ink-500/70 dark:text-white dark:placeholder:text-slate-500"
          />
        </label>
        <div className="flex items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-500 dark:text-slate-400">
            <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} className="accent-brand-600" />
            Show retired
          </label>
          <button
            type="button"
            onClick={onAddCategory}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
          >
            <Plus className="h-3.5 w-3.5" />
            New category
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3 [scrollbar-width:thin]">
        {groups.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-ink-500 dark:text-slate-400">
            {query ? `Nothing matches “${query}”.` : 'No categories yet. Create the first one.'}
          </p>
        )}

        {groups.map(({ category: c, rows, total, categoryMatches }) => {
          const expanded =
            openIds.has(c.id) || c.id === selectedCategoryId || (!!query.trim() && (categoryMatches || rows.length > 0))
          return (
          <section key={c.id} aria-label={c.name} className={c.isActive ? '' : 'opacity-60'}>
            <header className="group flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/4">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => toggleOpen(c.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20"
              >
                <ChevronDown className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200 dark:text-slate-400 ${expanded ? '' : '-rotate-90'}`} />
                <span className="min-w-0 flex-1 truncate text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">
                  {c.name}
                  {!c.isActive && <span className="ml-2 normal-case tracking-normal text-ink-500">· retired</span>}
                </span>
              </button>
              <span className="text-[11px] text-ink-500 tabular-nums dark:text-slate-500">{total}</span>
              <button
                type="button"
                aria-label={`Edit ${c.name}`}
                title="Edit category"
                onClick={() => onEditCategory(c)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label={c.isActive ? `Retire ${c.name}` : `Restore ${c.name}`}
                title={c.isActive ? 'Retire category' : 'Restore category'}
                disabled={busy === c.id}
                onClick={() => void toggleCategory(c)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                {c.isActive ? <XCircle className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
              </button>
            </header>

            {expanded && (
            <ul className="space-y-1">
              {rows.map((s) => {
                const on = s.id === selectedId
                return (
                  <li key={s.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-current={on || undefined}
                      onClick={() => onSelect(s.id)}
                      className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20 ${
                        on ? 'bg-brand-500/10 ring-1 ring-brand-500/25' : 'hover:bg-slate-50 dark:hover:bg-white/4'
                      } ${s.isActive ? '' : 'opacity-60'}`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-semibold ${s.isActive ? 'text-ink-900 dark:text-white' : 'text-ink-500 line-through dark:text-slate-500'}`}>
                          {s.skillName}
                        </span>
                        <span className="block text-[11px] text-ink-500 tabular-nums dark:text-slate-400">
                          {fmt(s.holderCount ?? 0)} {(s.holderCount ?? 0) === 1 ? 'associate' : 'associates'}
                        </span>
                      </span>
                      {!s.isActive && <Badge tone="slate">Retired</Badge>}
                      <ChevronRight className={`h-4 w-4 shrink-0 ${on ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500/40'}`} />
                    </button>
                    <button
                      type="button"
                      aria-label={s.isActive ? `Retire ${s.skillName}` : `Restore ${s.skillName}`}
                      title={s.isActive ? 'Retire skill' : 'Restore skill'}
                      disabled={busy === -s.id}
                      onClick={() => void toggleSkill(s)}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      {s.isActive ? <XCircle className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    </button>
                  </li>
                )
              })}
            </ul>
            )}

            {expanded && c.isActive && (
              <button
                type="button"
                onClick={() => onAddSkill(c)}
                className="mt-1.5 flex w-full items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-semibold text-ink-500 transition-colors hover:border-brand-500/40 hover:text-brand-700 dark:border-white/12 dark:text-slate-400 dark:hover:text-brand-400"
              >
                <Plus className="h-3.5 w-3.5" />
                Add a skill to {c.name}
              </button>
            )}
          </section>
          )
        })}
      </div>
    </div>
  )
}
