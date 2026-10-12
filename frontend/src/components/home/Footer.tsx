import { Sprout } from 'lucide-react'
import { LinkedInIcon, XIcon, YouTubeIcon } from './SocialIcons'

const LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'Features', href: '#features' },
  { label: 'Roles', href: '#roles' },
  { label: 'About', href: '#why' },
  { label: 'Contact', href: '#contact' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white dark:border-slate-800/60 dark:bg-transparent">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Sprout className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-ink-900 dark:text-white">RightFit</p>
            <p className="text-xs text-ink-500 dark:text-slate-400">
              Resource Allocation & Employee Pool Management Platform
            </p>
          </div>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-ink-500 dark:text-slate-400">
          {LINKS.map((link) => (
            <li key={link.label}>
              <a href={link.href} className="hover:text-brand-600 dark:hover:text-brand-400">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 text-ink-500 dark:text-slate-400">
          <a href="#" aria-label="LinkedIn" className="hover:text-brand-600 dark:hover:text-brand-400">
            <LinkedInIcon className="h-4 w-4" />
          </a>
          <a href="#" aria-label="X" className="hover:text-brand-600 dark:hover:text-brand-400">
            <XIcon className="h-4 w-4" />
          </a>
          <a href="#" aria-label="YouTube" className="hover:text-brand-600 dark:hover:text-brand-400">
            <YouTubeIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
      <p className="border-t border-slate-100 py-4 text-center text-xs text-ink-500 dark:border-slate-800 dark:text-slate-400">
        © 2026 RightFit. All rights reserved.
      </p>
    </footer>
  )
}
