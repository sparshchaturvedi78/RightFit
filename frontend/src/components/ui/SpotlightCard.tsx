import type { MouseEvent, ReactNode } from 'react'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
}

export default function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--x', `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      onMouseMove={handleMove}
      className={`spotlight group relative h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/30 hover:shadow-2xl hover:shadow-brand-500/10 dark:border-white/10 dark:bg-white/3 ${className}`}
    >
      {children}
    </div>
  )
}
