import { CalendarClock, CheckCircle2, ClipboardList, FileText, GraduationCap, Mail } from 'lucide-react'
import { Skeleton } from '../../../components/dashboard/Panel'
import { useQuery } from '../../../hooks/useQuery'
import { timeAgo } from '../../../utils/format'
import { Act, Empty, TILE, TileHead } from './ui'

/** What changed for the associate lately: their newest notifications, with an icon for the kind of change. */
export default function RecentActivity() {
  const latest = useQuery('latestNotifications', {})
  const items = latest.data?.content ?? []

  return (
    <section className={TILE} aria-label="Recent activity">
      <TileHead icon={FileText} title="Recent activity" sub="What changed for you" />
      {!latest.data ? (
        <Skeleton className="h-40 rounded-2xl" />
      ) : items.length === 0 ? (
        <Empty>Nothing has changed for you yet.</Empty>
      ) : (
        <div className="grid gap-3">
          {items.map((n) => {
            const t = n.type.toUpperCase()
            const icon = t.includes('INVIT') ? Mail : t.includes('INTERVIEW') ? CalendarClock : t.includes('TRAINING') ? GraduationCap : t.includes('DUTY') ? ClipboardList : CheckCircle2
            const tone = t.includes('INTERVIEW') ? 'sky' : t.includes('TRAINING') || t.includes('DUTY') ? 'violet' : 'brand'
            return <Act key={n.id} icon={icon} tone={tone} title={n.title} sub={`${n.message ? `${n.message} · ` : ''}${timeAgo(n.createdAt)}`} />
          })}
        </div>
      )}
    </section>
  )
}
