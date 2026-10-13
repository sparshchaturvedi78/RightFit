import { AnimatePresence, motion } from 'motion/react'
import { Bell, CheckCheck, Inbox, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDismiss } from '../../hooks/useDismiss'
import { store, useAppDispatch, useAppSelector } from '../../store'
import { markAllNotificationsRead, markNotificationRead, syncNotifications } from '../../store/notificationsSlice'
import { timeAgo } from '../../utils/format'
import { PanelError, Skeleton } from '../dashboard/Panel'

/** How often the bell quietly checks for new notifications. */
const AUTO_REFRESH_MS = 30_000

function useNotificationAutoRefresh() {
  const dispatch = useAppDispatch()

  useEffect(() => {
    const sync = () => {
      if (document.hidden) return
      // Coming back to a page that just checked (e.g. Home -> Dashboard) needs no new request.
      if (Date.now() - store.getState().notifications.syncedAt < AUTO_REFRESH_MS - 1000) return
      void dispatch(syncNotifications())
    }
    sync()
    const timer = setInterval(sync, AUTO_REFRESH_MS)
    document.addEventListener('visibilitychange', sync) // catch up as soon as the tab is visible again
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', sync)
    }
  }, [dispatch])
}

function NotificationList() {
  const dispatch = useAppDispatch()
  const { items, syncing, error, status } = useAppSelector((s) => s.notifications)

  const refresh = () => void dispatch(syncNotifications({ manual: true }))

  if (items === null && syncing) {
    return (
      <div className="space-y-3 p-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    )
  }

  if (items === null) return <PanelError message={error ?? "Couldn't load notifications."} status={status} onRetry={refresh} />

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Inbox className="h-5 w-5" />
        </span>
        <p className="text-sm text-ink-500 dark:text-slate-400">You're all caught up.</p>
      </div>
    )
  }

  return (
    <>
      <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-white/5">
        {items.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => !n.isRead && void dispatch(markNotificationRead(n.id))}
              className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-slate-300 dark:bg-white/15' : 'bg-brand-500'}`}
              />
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-sm ${n.isRead ? 'text-ink-500 dark:text-slate-400' : 'font-semibold text-ink-900 dark:text-white'}`}
                >
                  {n.title}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-ink-500 dark:text-slate-400">{n.message}</span>
                <span className="mt-1 block text-[11px] text-ink-500/70 dark:text-slate-500">{timeAgo(n.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-slate-100 p-2 dark:border-white/5">
        <button
          type="button"
          onClick={() => void dispatch(markAllNotificationsRead())}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
        >
          <CheckCheck className="h-3.5 w-3.5" />
          Mark all as read
        </button>
      </div>
    </>
  )
}

export default function NotificationBell() {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const count = useAppSelector((s) => s.notifications.unread)
  const syncing = useAppSelector((s) => s.notifications.syncing)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(ref, open, close)
  useNotificationAutoRefresh()

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={count > 0 ? `${count} unread notifications` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/60 text-ink-700 backdrop-blur-md transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-ink-950">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-3 w-88 max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-ink-900 dark:shadow-black/50"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-white/5">
              <p className="text-sm font-semibold text-ink-900 dark:text-white">Notifications</p>
              <button
                type="button"
                aria-label="Refresh notifications"
                title="Refresh"
                disabled={syncing}
                onClick={() => void dispatch(syncNotifications({ manual: true }))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 transition-colors hover:bg-slate-100 hover:text-ink-900 disabled:cursor-wait dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <NotificationList />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
