import { RefreshCw } from 'lucide-react'

/** "Refresh": reloads what the page shows. Spins while that is happening. */
export default function RefreshButton({ onClick, loading = false }: { onClick: () => void; loading?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-ink-700 transition-colors outline-none hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-brand-500/20 disabled:cursor-wait dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </button>
  )
}
