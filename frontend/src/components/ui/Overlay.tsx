import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'
import { useEffect, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [active])
}

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active, onClose])
}

interface OverlayProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

const BACKDROP = 'fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm dark:bg-black/60'
const PANEL_SURFACE =
  'border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 dark:border-white/10 dark:bg-ink-925 dark:shadow-black/60'

function Header({ id, title, subtitle, onClose }: { id: string; title: string; subtitle?: string; onClose: () => void }) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-white/6">
      <div className="min-w-0">
        <h2 id={id} className="truncate text-lg font-semibold tracking-tight text-ink-900 dark:text-white">
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 truncate text-sm text-ink-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  )
}

/** Right-hand slide-over for forms and detail views. */
export function Drawer({ open, onClose, title, subtitle, children, footer }: OverlayProps) {
  const titleId = useId()
  useLockBodyScroll(open)
  useEscape(open, onClose)

  // Portaled to <body> so `fixed inset-0` always means the whole viewport, whatever the page's own layout does.
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            className={BACKDROP}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 36 }}
            className={`fixed inset-y-0 right-0 z-[61] flex w-full max-w-xl flex-col sm:inset-y-3 sm:right-3 sm:rounded-3xl ${PANEL_SURFACE}`}
          >
            <Header id={titleId} title={title} subtitle={subtitle} onClose={onClose} />
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-white/6">
                {footer}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Centered dialog for short confirmations and single-purpose forms. */
export function Modal({ open, onClose, title, subtitle, children, footer }: OverlayProps) {
  const titleId = useId()
  useLockBodyScroll(open)
  useEscape(open, onClose)

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            key="backdrop"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className={`relative flex max-h-[90vh] w-full max-w-md flex-col rounded-3xl ${PANEL_SURFACE}`}
          >
            <Header id={titleId} title={title} subtitle={subtitle} onClose={onClose} />
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && (
              <footer className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-white/6">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
