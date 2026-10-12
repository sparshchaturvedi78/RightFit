import Reveal from './Reveal'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  highlight?: string
  subtitle?: string
}

export default function SectionHeading({ eyebrow, title, highlight, subtitle }: SectionHeadingProps) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-brand-700 uppercase dark:text-brand-300">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
        {eyebrow}
      </span>
      <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-ink-900 sm:text-5xl dark:text-white">
        {title} {highlight && <span className="text-gradient-animated">{highlight}</span>}
      </h2>
      {subtitle && (
        <p className="mx-auto mt-4 max-w-2xl text-base text-ink-500 sm:text-lg dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </Reveal>
  )
}
