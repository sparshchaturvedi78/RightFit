import { RefreshCw, TriangleAlert } from 'lucide-react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  error: Error | null
}

/**
 * Catches a crash inside one admin page so the shell (sidebar, header) stays usable and the admin sees what
 * happened instead of a blank screen. AppShell keys it by route, so navigating away resets it.
 */
export default class PageErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-slate-200/80 bg-white px-6 py-14 text-center shadow-sm dark:border-white/8 dark:bg-white/3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/12 text-amber-600 dark:text-amber-400">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <div>
          <p className="text-base font-semibold text-ink-900 dark:text-white">This page hit a problem</p>
          <p className="mt-1 text-sm text-ink-500 dark:text-slate-400">{this.state.error.message || 'Something went wrong while showing it.'}</p>
        </div>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/25 hover:bg-brand-700"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      </div>
    )
  }
}
