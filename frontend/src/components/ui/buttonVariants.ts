export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

/** Colours for each kind of button. Shared by `Button` and by links that need to look like one. */
export const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-md shadow-brand-600/25 hover:bg-brand-700 focus-visible:ring-brand-500/40',
  secondary:
    'border border-slate-200 bg-white text-ink-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10',
  danger: 'bg-rose-600 text-white shadow-md shadow-rose-600/25 hover:bg-rose-700 focus-visible:ring-rose-500/40',
  ghost: 'text-ink-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10',
}
