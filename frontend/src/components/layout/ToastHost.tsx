import { AnimatePresence, motion } from 'motion/react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../store'
import { dismissToast, type Toast } from '../../store/toastSlice'

const TONES = {
  success: { icon: CheckCircle2, ring: 'text-brand-600 bg-brand-500/12 dark:text-brand-400' },
  error: { icon: TriangleAlert, ring: 'text-rose-600 bg-rose-500/12 dark:text-rose-400' },
  info: { icon: Info, ring: 'text-sky-600 bg-sky-500/12 dark:text-sky-400' },
}

const AUTO_DISMISS_MS = 5000

function ToastCard({ toast }: { toast: Toast }) {
  const dispatch = useAppDispatch()
  const { icon: Icon, ring } = TONES[toast.tone]

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [dispatch, toast.id])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      role="status"
      className="pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-ink-925 dark:shadow-black/50"
    >
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${ring}`}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-semibold text-ink-900 dark:text-white">{toast.title}</p>
        {toast.message && <p className="mt-0.5 text-xs text-ink-500 dark:text-slate-400">{toast.message}</p>}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dispatch(dismissToast(toast.id))}
        className="rounded-lg p-1 text-ink-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

export default function ToastHost() {
  const toasts = useAppSelector((s) => s.toasts)
  return (
    // Top centre: never covers a drawer's or dialog's action buttons.
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}
