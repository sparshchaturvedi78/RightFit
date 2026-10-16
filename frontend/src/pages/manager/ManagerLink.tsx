import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { isManagerPageReady } from './managerRoutes'

/**
 * A card or row that opens the page it relates to. While that page isn't built it renders as a plain block
 * (with a "Coming soon" hint) instead of a link, so it never leads to an empty screen.
 */
export default function ManagerLink({
  to,
  className = '',
  hoverClassName = 'hover:border-brand-500/40 hover:bg-slate-50/70 dark:hover:bg-white/4',
  children,
  ...rest
}: {
  to: string
  className?: string
  /** Extra classes applied only when the link is live. */
  hoverClassName?: string
  children: ReactNode
  'aria-label'?: string
}) {
  if (isManagerPageReady(to)) {
    return (
      <Link
        to={to}
        className={`${className} ${hoverClassName} transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500`}
        {...rest}
      >
        {children}
      </Link>
    )
  }
  return (
    <div className={className} title="Coming soon" {...rest}>
      {children}
    </div>
  )
}
