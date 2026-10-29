import { motion } from 'motion/react'
import type { ReactNode } from 'react'

/** The same page heading the manager pages use: small eyebrow, title, one line of context, and actions on the right. */
export default function PageHeader({ eyebrow, title, sub, actions }: { eyebrow: string; title: string; sub?: string; actions?: ReactNode }) {
  return (
    <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold tracking-[0.14em] text-ink-500 uppercase dark:text-slate-400">{eyebrow}</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">{title}</h1>
        {sub && <p className="mt-1 max-w-[62ch] text-sm text-ink-500 dark:text-slate-400">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </motion.header>
  )
}
