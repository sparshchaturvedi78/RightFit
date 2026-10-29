import type { ReactNode } from 'react'
import { VARIANTS } from '../../components/ui/buttonVariants'
import ManagerLink from './ManagerLink'

/** A link that looks exactly like a `Button`, so a link and a button side by side line up. */
export default function LinkButton({ to, variant = 'secondary', children }: { to: string; variant?: 'primary' | 'secondary'; children: ReactNode }) {
  return (
    <ManagerLink
      to={to}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap ${VARIANTS[variant]}`}
      hoverClassName=""
    >
      {children}
    </ManagerLink>
  )
}
