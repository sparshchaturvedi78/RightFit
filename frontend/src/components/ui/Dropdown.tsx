import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'

export interface DropdownOption {
  value: string
  label: string
  /** Second, muted line under the label. */
  hint?: string
}

interface DropdownProps {
  id?: string
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  placeholder?: string
  /** Accessible name when there is no visible <label htmlFor={id}>. */
  ariaLabel?: string
  disabled?: boolean
  invalid?: boolean
  /** Shown inside the open list when `options` is empty. */
  emptyText?: string
  size?: 'md' | 'sm'
  className?: string
  /** Show a filter box at the top of the list. Defaults to on for lists longer than 3. */
  searchable?: boolean
}

interface Position {
  left: number
  width: number
  top?: number
  bottom?: number
  maxHeight: number
}

const PANEL_MAX = 288
const GAP = 6

function place(trigger: HTMLElement): Position {
  const r = trigger.getBoundingClientRect()
  const below = window.innerHeight - r.bottom - GAP - 8
  const above = r.top - GAP - 8
  const width = Math.max(r.width, 200)
  const left = Math.min(r.left, window.innerWidth - width - 8)
  if (below < 180 && above > below) {
    return { left, width, bottom: window.innerHeight - r.top + GAP, maxHeight: Math.min(PANEL_MAX, above) }
  }
  return { left, width, top: r.bottom + GAP, maxHeight: Math.min(PANEL_MAX, below) }
}

/**
 * Styled replacement for the native <select>: the browser's own option menu can't follow the app's light/dark
 * theme (it rendered white text on a white menu in dark mode). Keyboard: ↑ ↓ Enter Space Esc Home End.
 */
export function Dropdown({
  id,
  value,
  options,
  onChange,
  placeholder = 'Select…',
  ariaLabel,
  disabled,
  invalid,
  emptyText = 'Nothing to choose from',
  size = 'md',
  className = '',
  searchable,
}: DropdownProps) {
  const listId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<Position | null>(null)
  const [active, setActive] = useState(-1)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => o.value === value)
  const withSearch = searchable ?? options.length > 3
  const needle = query.trim().toLowerCase()
  const shown = needle
    ? options.filter((o) => o.label.toLowerCase().includes(needle) || o.hint?.toLowerCase().includes(needle))
    : options

  const openList = useCallback(() => {
    if (disabled || !triggerRef.current) return
    setPos(place(triggerRef.current))
    setQuery('')
    setActive(Math.max(0, options.findIndex((o) => o.value === value)))
    setOpen(true)
  }, [disabled, options, value])

  const close = useCallback(() => setOpen(false), [])

  const choose = (option: DropdownOption) => {
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  // Follow the trigger while the page or a drawer scrolls; close on outside clicks.
  useEffect(() => {
    if (!open) return
    const reposition = () => triggerRef.current && setPos(place(triggerRef.current))
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node
      if (!triggerRef.current?.contains(t) && !panelRef.current?.parentElement?.contains(t)) close()
    }
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    document.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open, close])

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open || active < 0) return
    panelRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  /** Short lists without a filter box: a letter moves to the next option starting with it. */
  function jumpTo(letter: string) {
    const l = letter.toLowerCase()
    const start = active + 1
    const order = [...options.slice(start), ...options.slice(0, start)]
    const hit = order.find((o) => o.label.toLowerCase().startsWith(l))
    if (!hit) return
    const index = options.indexOf(hit)
    if (open) setActive(index)
    else onChange(hit.value)
  }

  function onKeyDown(e: KeyboardEvent<HTMLElement>) {
    const printable = e.key.length === 1 && e.key !== ' ' && !e.ctrlKey && !e.metaKey && !e.altKey
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      } else if (printable && withSearch) {
        // Start filtering straight away: open the list with the typed character in the filter box.
        e.preventDefault()
        openList()
        setQuery(e.key)
        setActive(0)
      } else if (printable) {
        jumpTo(e.key)
      }
      return
    }
    if (printable && !withSearch && !(e.target instanceof HTMLInputElement)) {
      jumpTo(e.key)
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActive((i) => Math.min(shown.length - 1, i + 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActive((i) => Math.max(0, i - 1))
        break
      case 'Home':
        e.preventDefault()
        setActive(0)
        break
      case 'End':
        e.preventDefault()
        setActive(shown.length - 1)
        break
      case 'Enter':
      case ' ':
        // A space is a normal character while typing in the search box.
        if (e.key === ' ' && e.target instanceof HTMLInputElement) break
        e.preventDefault()
        if (shown[active]) choose(shown[active])
        break
      case 'Escape':
        // Don't let Escape also close the drawer or dialog this dropdown sits in.
        e.preventDefault()
        e.stopPropagation()
        close()
        triggerRef.current?.focus()
        break
      case 'Tab':
        close()
        break
    }
  }

  const height = size === 'sm' ? 'h-8 px-2.5 text-xs rounded-lg' : 'h-[42px] px-3.5 text-sm rounded-xl'

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 border bg-white text-left shadow-sm transition-all outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white/5 ${height} ${
          open || invalid
            ? invalid
              ? 'border-rose-500 ring-4 ring-rose-500/15'
              : 'border-brand-500 ring-4 ring-brand-500/15 dark:border-brand-400'
            : 'border-slate-200 hover:border-slate-300 focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/15 dark:border-white/10 dark:hover:border-white/20'
        } ${className}`}
      >
        <span className={`truncate ${selected ? 'text-ink-900 dark:text-white' : 'text-ink-500/80 dark:text-slate-500'}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-ink-500 transition-transform duration-200 dark:text-slate-400 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              initial={{ opacity: 0, y: pos.top !== undefined ? -4 : 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.12 }}
              style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
              className="fixed z-[90] flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-white/10 dark:bg-ink-900 dark:shadow-black/50"
            >
              {withSearch && (
                <div className="relative shrink-0 border-b border-slate-100 p-1.5 dark:border-white/8">
                  <Search className="pointer-events-none absolute top-1/2 left-4 h-3.5 w-3.5 -translate-y-1/2 text-ink-500 dark:text-slate-500" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setActive(0)
                    }}
                    onKeyDown={onKeyDown}
                    placeholder="Type to filter…"
                    aria-label={`Filter ${ariaLabel ?? 'options'}`}
                    aria-controls={listId}
                    className="w-full rounded-lg bg-slate-50 py-2 pr-3 pl-8 text-sm text-ink-900 outline-none placeholder:text-ink-500/70 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>
              )}
            <ul
              ref={panelRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1"
            >
              {shown.length === 0 && (
                <li className="px-3 py-2.5 text-sm text-ink-500 dark:text-slate-400">
                  {options.length === 0 ? emptyText : `No match for “${query.trim()}”`}
                </li>
              )}
              {shown.map((option, i) => {
                const isSelected = option.value === value
                return (
                  <li
                    key={option.value}
                    id={`${listId}-${i}`}
                    data-index={i}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(option)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      i === active ? 'bg-slate-100 dark:bg-white/8' : ''
                    } ${isSelected ? 'font-semibold text-brand-700 dark:text-brand-300' : 'text-ink-700 dark:text-slate-200'}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.hint && (
                        <span className="block truncate text-xs font-normal text-ink-500 dark:text-slate-400">{option.hint}</span>
                      )}
                    </span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </li>
                )
              })}
            </ul>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
