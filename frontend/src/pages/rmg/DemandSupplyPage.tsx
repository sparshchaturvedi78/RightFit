import { ClipboardList } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Dropdown } from '../../components/ui/Dropdown'
import RefreshButton from '../../components/ui/RefreshButton'
import { SearchInput } from '../../components/ui/SearchInput'
import { useQuery } from '../../hooks/useQuery'
import type { SkillDemandSupplyDTO } from '../../services/rmg/demandSupply.service'
import PageHeader from '../associate/PageHeader'
import { Bar, Card, Row, Strip, Tag } from './rmgUi'

/** For each skill: how many open requirements need it, and how many available people have it. */
export default function DemandSupplyPage() {
  const data = useQuery('rmgDemandSupply', {})
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')

  const skills = useMemo(() => data.data?.bySkill ?? [], [data.data])
  const categories = useMemo(() => [...new Set(skills.map((s) => s.category).filter(Boolean) as string[])].sort(), [skills])
  const list = skills
    .filter((s) => !category || s.category === category)
    .filter((s) => !q || s.skillName.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.gap - a.gap)
  const shortages = skills.filter((s) => s.shortage).sort((a, b) => b.gap - a.gap)
  const largest = shortages[0]

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Hiring · Demand and supply"
        title="Demand and supply"
        sub="For each skill: how many open requirements need it, and how many available people have it. Shortages show where to train or hire."
        actions={<RefreshButton onClick={data.refresh} loading={data.loading} />}
      />

      {data.error && !data.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={data.error} status={data.status} onRetry={data.refresh} />
        </div>
      ) : !data.data ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : skills.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<ClipboardList className="h-5 w-5" />}>No skills have demand or supply yet.</EmptyState>
        </div>
      ) : (
        <>
          <Strip
            cells={[
              { label: 'Open requirements', value: data.data.openRequirements, sub: 'Published and waiting' },
              { label: 'Available people', value: data.data.availableEmployees, sub: 'In pool or on bench' },
              { label: 'Skills in shortage', value: shortages.length, sub: 'Demand above supply' },
              { label: 'Largest gap', value: largest?.skillName ?? '—', sub: largest ? `Short by ${largest.gap}` : 'No shortage' },
            ]}
          />

          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-64 flex-1">
              <SearchInput value={q} onSearch={setQ} placeholder="Search skill…" />
            </div>
            <div className="w-48">
              <Dropdown ariaLabel="Category" value={category} onChange={setCategory} options={[{ value: '', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]} />
            </div>
          </div>

          <section className={`${TILE_SURFACE} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-175 border-collapse text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-400">
                    <th className="px-4 py-3">Skill</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Demand against supply</th>
                    <th className="px-4 py-3">Demand</th>
                    <th className="px-4 py-3">Supply</th>
                    <th className="px-4 py-3">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((s) => (
                    <SkillRow key={s.skillName} skill={s} />
                  ))}
                </tbody>
              </table>
            </div>
            {list.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-500 dark:text-slate-400">No skill matches these filters.</p>}
          </section>

          {shortages.length > 0 && (
            <Card title="Ways to close a gap" note="Largest shortages first">
              {shortages.slice(0, 3).map((s) => (
                <Row
                  key={s.skillName}
                  title={`${s.skillName} · short by ${s.gap}`}
                  detail={`${s.demand} needed · ${s.supply} available`}
                  aside={
                    <div className="flex gap-2">
                      <Link to="/rmg/training" className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:border-brand-500/40 dark:border-white/10 dark:text-white">
                        Open training
                      </Link>
                      <Link to="/rmg/bench" className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink-900 hover:border-brand-500/40 dark:border-white/10 dark:text-white">
                        Open bench
                      </Link>
                    </div>
                  }
                />
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  )
}

function SkillRow({ skill: s }: { skill: SkillDemandSupplyDTO }) {
  const cover = s.demand > 0 ? (s.supply / s.demand) * 100 : 100
  const cell = 'border-b border-slate-100 px-4 py-3 align-middle dark:border-white/6'
  return (
    <tr>
      <td className={`${cell} font-semibold text-ink-900 dark:text-white`}>{s.skillName}</td>
      <td className={`${cell} text-ink-700 dark:text-slate-300`}>{s.category ?? '—'}</td>
      <td className={`${cell} min-w-56`}>
        <Bar value={cover} tone={s.shortage ? (cover < 50 ? 'danger' : 'warn') : 'ok'} />
      </td>
      <td className={cell}>{s.demand}</td>
      <td className={cell}>{s.supply}</td>
      <td className={cell}>
        {s.shortage ? <Tag tone="danger">{`Short ${s.gap}`}</Tag> : s.supply > s.demand ? <Tag tone="ok">{`Spare ${s.supply - s.demand}`}</Tag> : <Tag tone="ok">Balanced</Tag>}
      </td>
    </tr>
  )
}
