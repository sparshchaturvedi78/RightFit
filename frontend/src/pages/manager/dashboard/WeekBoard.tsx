import { CalendarDays } from 'lucide-react'
import { AsyncBody, Panel, Skeleton } from '../../../components/dashboard/Panel'
import type { AsyncResult } from '../../../hooks/useAsyncData'
import type { InterviewDTO } from '../../../services/interview.service'
import { parseServerDate } from '../../../utils/format'
import ManagerLink from '../ManagerLink'
import { interviewTone, isoDay, TONE_DOT, TONE_LABEL, TONE_STRIPE, timeOf, workWeek, type InterviewTone } from '../managerUi'

const LEGEND: InterviewTone[] = ['ok', 'wait', 'need', 'done']

/** Interviews of the week as five day columns; each chip opens that interview (or its feedback form when one is due). */
export default function WeekBoard({ state, now }: { state: AsyncResult<InterviewDTO[]>; now: Date }) {
  const days = workWeek(now)
  const today = isoDay(now)

  return (
    <Panel
      title="This week's interviews"
      subtitle="Your interviews, Monday to Friday"
      icon={<CalendarDays className="h-4 w-4" />}
      className="h-full"
    >
      <AsyncBody
        state={state}
        skeleton={
          <div className="grid gap-2.5 sm:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        }
      >
        {(interviews) => {
          const byDay = new Map<string, InterviewDTO[]>()
          for (const i of interviews) {
            const key = isoDay(parseServerDate(i.scheduledAt))
            byDay.set(key, [...(byDay.get(key) ?? []), i])
          }
          for (const list of byDay.values()) list.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))

          return (
            <div className="flex h-full flex-col gap-3">
              <div className="grid flex-1 grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))] [&>*]:min-w-0">
                {days.map((d) => {
                  const key = isoDay(d)
                  const list = byDay.get(key) ?? []
                  const isToday = key === today
                  return (
                    <div
                      key={key}
                      className={`grid min-h-52 content-start gap-2 rounded-2xl bg-slate-100/70 p-2.5 dark:bg-white/4 ${
                        isToday ? 'ring-1 ring-brand-500/40' : ''
                      }`}
                    >
                      <ManagerLink
                        to={`/manager/interviews?date=${key}`}
                        className="flex items-baseline justify-between gap-1 rounded-lg px-1 py-0.5 text-xs font-bold text-ink-700 dark:text-slate-300"
                        hoverClassName="hover:text-brand-600 dark:hover:text-brand-400"
                      >
                        <span className={isToday ? 'text-brand-600 dark:text-brand-400' : ''}>
                          {isToday ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                        <span className="font-medium text-ink-500 tabular-nums dark:text-slate-400">
                          {d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </span>
                      </ManagerLink>
                      {list.length === 0 && <p className="px-1 py-2 text-[11px] text-ink-500 dark:text-slate-400">Nothing booked</p>}
                      {list.map((i) => {
                        const tone = interviewTone(i, now)
                        const target = tone === 'need' ? `/manager/interviews/${i.interviewId}/feedback` : `/manager/interviews/${i.interviewId}`
                        return (
                          <ManagerLink
                            key={i.interviewId}
                            to={target}
                            aria-label={`${timeOf(i.scheduledAt)} ${i.employeeName ?? i.employeeId}, ${TONE_LABEL[tone]}`}
                            className={`block rounded-xl border-l-[3px] bg-white px-2.5 py-2 shadow-sm dark:bg-white/5 dark:shadow-none ${TONE_STRIPE[tone]} ${
                              tone === 'off' ? 'opacity-60' : ''
                            }`}
                            hoverClassName="hover:-translate-y-px hover:shadow-md"
                          >
                            <b className="block text-xs leading-snug font-bold break-words text-ink-900 tabular-nums dark:text-white">
                              {timeOf(i.scheduledAt)} · {i.employeeName ?? i.employeeId}
                            </b>
                            <span className="block truncate text-[11px] text-ink-500 dark:text-slate-400">
                              {[i.requirementId, i.roundNumber ? `Round ${i.roundNumber}` : null].filter(Boolean).join(' · ')}
                            </span>
                          </ManagerLink>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500 dark:text-slate-400">
                {LEGEND.map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <i className={`inline-block h-2.5 w-2.5 rounded-[3px] ${TONE_DOT[t]}`} />
                    {TONE_LABEL[t]}
                  </span>
                ))}
              </div>
            </div>
          )
        }}
      </AsyncBody>
    </Panel>
  )
}
