import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Search box that reports the typed text after a short pause. `value` is the committed value (from the URL),
 * so the box follows external changes such as "Clear filters".
 */
export function SearchInput({
  value,
  onSearch,
  placeholder,
  delayMs = 350,
}: {
  value: string
  onSearch: (value: string) => void
  placeholder: string
  delayMs?: number
}) {
  const [draft, setDraft] = useState(value)
  const [seen, setSeen] = useState(value)

  // Follow outside changes to `value` (e.g. Clear filters) without an effect.
  if (value !== seen) {
    setSeen(value)
    setDraft(value)
  }

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onSearch(draft), delayMs)
    return () => clearTimeout(timer)
  }, [draft, value, onSearch, delayMs])

  return (
    <div className="group relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-500 transition-colors group-focus-within:text-brand-600 dark:text-slate-500 dark:group-focus-within:text-brand-400" />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-9 pl-10 text-sm text-ink-900 shadow-sm transition-all outline-none placeholder:text-ink-500/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-brand-400 [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            setDraft('')
            onSearch('')
          }}
          className="absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-ink-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
