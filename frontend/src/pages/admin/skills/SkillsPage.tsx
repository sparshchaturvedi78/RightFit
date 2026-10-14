import { motion } from 'motion/react'
import { FolderPlus, Plus, RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PanelError, Skeleton, TILE_SURFACE } from '../../../components/dashboard/Panel'
import { Button } from '../../../components/ui/form'
import { useResource } from '../../../hooks/useResource'
import type { SkillCategoryDTO, SkillDTO } from '../../../services/admin/skillCatalog.service'
import { useAppDispatch } from '../../../store'
import { invalidateQueries } from '../../../store/queriesSlice'
import type { ResourceKey } from '../../../store/resourceRegistry'
import { loadResource } from '../../../store/resourcesSlice'
import { CategoryDialog, SkillDialog, type Dialog } from './SkillDialogs'
import SkillDetail from './SkillDetail'
import SkillTree from './SkillTree'

/** Lists that change when a category or skill is added, edited, retired or restored. */
const STALE_AFTER_CHANGE: ResourceKey[] = ['admin/skills', 'admin/skill-categories']

export default function SkillsPage() {
  const dispatch = useAppDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [dialog, setDialog] = useState<Dialog | null>(null)

  const skills = useResource('admin/skills')
  const categories = useResource('admin/skill-categories')

  // The selected skill lives in the URL, so a link or a refresh keeps the same skill open.
  const selectedId = Number(searchParams.get('skill')) || null
  const selectSkill = useCallback(
    (id: number | null) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (id === null) next.delete('skill')
          else next.set('skill', String(id))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const selected: SkillDTO | null = useMemo(
    () => (skills.data ?? []).find((s) => s.id === selectedId) ?? null,
    [skills.data, selectedId],
  )

  const counts = useMemo(() => {
    const all = skills.data ?? []
    const active = all.filter((s) => s.isActive).length
    const retiredCats = (categories.data ?? []).filter((c) => !c.isActive).length
    return { skills: all.length, active, retired: all.length - active, categories: categories.data?.length ?? 0, retiredCats }
  }, [skills.data, categories.data])

  /** Called after any save: reload the lists and the open skill's associates. */
  const afterChange = useCallback(
    (createdSkillId?: number) => {
      STALE_AFTER_CHANGE.forEach((key) => void dispatch(loadResource({ key, force: true })))
      dispatch(invalidateQueries('skillHolders'))
      setDialog(null)
      if (createdSkillId) selectSkill(createdSkillId)
    },
    [dispatch, selectSkill],
  )

  const error = skills.error ?? categories.error
  const loading = skills.loading || categories.loading

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-wrap items-end justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-3xl dark:text-white">Skills</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500 dark:text-slate-400">
            Create the categories, then the skills inside them. Associates and managers pick from this list. Open a skill
            to see who holds it.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Stat label="skills" value={counts.skills} />
            <Stat label="active" value={counts.active} tone="text-brand-600 dark:text-brand-400" />
            <Stat label="retired" value={counts.retired} />
            <Stat label="categories" value={counts.categories} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            aria-label="Refresh skills"
            disabled={loading}
            onClick={() => afterChange()}
            icon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button variant="primary" icon={<FolderPlus className="h-4 w-4" />} onClick={() => setDialog({ kind: 'category', category: null })}>
            New category
          </Button>
        </div>
      </motion.header>

      {error && !skills.data && !categories.data ? (
        <PanelError message={error} status={null} onRetry={() => afterChange()} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"
        >
          <section className={`${TILE_SURFACE} flex min-h-[560px] flex-col overflow-hidden`} aria-label="Categories and skills">
            {skills.data && categories.data ? (
              <SkillTree
                categories={categories.data}
                skills={skills.data}
                selectedId={selectedId}
                onSelect={selectSkill}
                onAddSkill={(cat: SkillCategoryDTO) => setDialog({ kind: 'skill', skill: null, categoryId: cat.id })}
                onEditCategory={(cat: SkillCategoryDTO) => setDialog({ kind: 'category', category: cat })}
                onAddCategory={() => setDialog({ kind: 'category', category: null })}
                onChanged={() => afterChange()}
              />
            ) : (
              <div className="space-y-3 p-5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 rounded-xl" />
                ))}
              </div>
            )}
          </section>

          <section className={`${TILE_SURFACE} min-w-0 overflow-hidden`} aria-label="Selected skill">
            {selected ? (
              <SkillDetail
                key={selected.id}
                skill={selected}
                onEdit={() => setDialog({ kind: 'skill', skill: selected, categoryId: selected.categoryId ?? null })}
                onChanged={() => afterChange()}
              />
            ) : (
              <div className="flex min-h-[560px] flex-col items-center justify-center gap-3 px-6 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <Plus className="h-5 w-5" />
                </span>
                <p className="text-base font-semibold text-ink-900 dark:text-white">Choose a skill</p>
                <p className="max-w-sm text-sm text-ink-500 dark:text-slate-400">
                  Pick a skill on the left to see the associates who hold it, how many are at a high level, and how many open
                  requirements ask for it.
                </p>
              </div>
            )}
          </section>
        </motion.div>
      )}

      <CategoryDialog
        dialog={dialog?.kind === 'category' ? dialog : null}
        onClose={() => setDialog(null)}
        onSaved={() => afterChange()}
      />
      <SkillDialog
        dialog={dialog?.kind === 'skill' ? dialog : null}
        categories={categories.data ?? []}
        onClose={() => setDialog(null)}
        onSaved={(id) => afterChange(id)}
      />
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value?: number; tone?: string }) {
  return (
    <div className="flex items-baseline gap-1.5 rounded-full border border-slate-200/80 bg-white px-3.5 py-1.5 shadow-sm dark:border-white/8 dark:bg-white/4 dark:shadow-none">
      <span className={`text-sm font-bold tabular-nums ${tone ?? 'text-ink-900 dark:text-white'}`}>{value ?? '–'}</span>
      <span className="text-ink-500 dark:text-slate-400">{label}</span>
    </div>
  )
}
