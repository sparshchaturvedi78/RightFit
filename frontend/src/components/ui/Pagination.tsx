import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Dropdown } from './Dropdown'

const PAGE_SIZES = [10, 20, 50]

function pageWindow(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i)
  const pages = new Set([0, total - 1, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap')
    out.push(p)
  })
  return out
}

/** Zero-based `page`; shows "Showing a–b of n", page buttons and a page-size picker. */
export function Pagination({
  page,
  size,
  totalElements,
  totalPages,
  onPage,
  onSize,
}: {
  page: number
  size: number
  totalElements: number
  totalPages: number
  onPage: (page: number) => void
  onSize: (size: number) => void
}) {
  const from = totalElements === 0 ? 0 : page * size + 1
  const to = Math.min(totalElements, (page + 1) * size)
  const btn =
    'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-ink-500 sm:px-5 dark:border-white/6 dark:text-slate-400">
      <p>
        Showing <span className="font-semibold text-ink-900 dark:text-white">{from}–{to}</span> of{' '}
        <span className="font-semibold text-ink-900 dark:text-white">{totalElements}</span>
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows</span>
          <div className="w-20">
            <Dropdown
              size="sm"
              ariaLabel="Rows per page"
              value={String(size)}
              onChange={(v) => onSize(Number(v))}
              options={PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
            />
          </div>
        </div>
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 0}
            onClick={() => onPage(page - 1)}
            className={`${btn} text-ink-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageWindow(page, totalPages).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="px-1">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPage(p)}
                className={`${btn} ${
                  p === page
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-ink-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {p + 1}
              </button>
            ),
          )}
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= totalPages - 1}
            onClick={() => onPage(page + 1)}
            className={`${btn} text-ink-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </div>
  )
}
