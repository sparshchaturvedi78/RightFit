import { Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50/40 px-6 dark:bg-slate-900">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-xl shadow-slate-200 dark:border-slate-800 dark:bg-slate-800/60 dark:shadow-black/30">
        <Link to="/" className="mb-6 inline-flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold text-ink-900 dark:text-white">RightFit</span>
        </Link>
        <h1 className="text-xl font-bold text-ink-900 dark:text-white">Login page coming next</h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-slate-400">
          This is a placeholder route so the Home page's Login buttons have somewhere to go.
          We'll build the real login form as its own page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
