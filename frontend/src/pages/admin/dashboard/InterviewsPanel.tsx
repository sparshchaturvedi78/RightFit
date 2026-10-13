import { motion } from 'motion/react'
import { CalendarClock, Video } from 'lucide-react'
import { AsyncBody, EmptyState, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { AdminDashboardDTO } from '../../../services/admin/dashboard.service'
import { formatUpcoming, initialsOf } from '../../../utils/format'

const AVATAR_GRADIENTS = [
  'from-rose-400 to-orange-400',
  'from-violet-400 to-fuchsia-500',
  'from-sky-400 to-indigo-500',
  'from-amber-400 to-pink-500',
  'from-brand-400 to-emerald-600',
]

export default function InterviewsPanel({ state, now }: { state: AsyncResult<AdminDashboardDTO>; now: Date }) {
  return (
    <Panel
      title="Upcoming interviews"
      subtitle="Across all projects"
      icon={<CalendarClock className="h-4 w-4" />}
      className="h-full"
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="space-y-2.5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        }
      >
        {(d) => {
          const interviews = d.upcomingInterviews ?? []
          if (interviews.length === 0) {
            return <EmptyState icon={<CalendarClock className="h-5 w-5" />}>No interviews scheduled yet.</EmptyState>
          }
          return (
            <ul className="space-y-2.5">
              {interviews.map((iv, i) => {
                const [first, ...rest] = (iv.candidateName ?? '?').split(' ')
                const when = formatUpcoming(iv.scheduledAt, now)
                return (
                  <motion.li
                    key={iv.interviewId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 px-3 py-2.5 dark:border-white/6 dark:bg-white/2"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} text-[11px] font-bold text-white`}
                    >
                      {initialsOf(first, rest.join(' '))}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                        {iv.candidateName ?? 'Candidate'}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-ink-500 dark:text-slate-400">
                        {iv.mode === 'ONLINE' && <Video className="h-3 w-3 shrink-0" />}
                        {iv.positionTitle ?? 'Interview'}
                        {iv.roundNumber && iv.roundNumber > 1 ? ` · Round ${iv.roundNumber}` : ''}
                        {iv.projectName ? ` · ${iv.projectName}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-ink-900 tabular-nums dark:text-white">{when.time}</p>
                      <p
                        className={`text-[11px] ${when.day === 'Today' ? 'font-semibold text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'}`}
                      >
                        {when.day}
                      </p>
                    </div>
                  </motion.li>
                )
              })}
            </ul>
          )
        }}
      </AsyncBody>
    </Panel>
  )
}
