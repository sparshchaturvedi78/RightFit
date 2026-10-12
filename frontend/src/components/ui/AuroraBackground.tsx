export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-brand-50/70 via-white to-white dark:from-ink-950 dark:via-[#07130e] dark:to-ink-950" />

      <div className="bg-grid fade-mask absolute inset-0" />

      <div className="animate-aurora absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-300/40 blur-[80px] sm:-top-48 sm:h-144 sm:w-144 sm:blur-[120px] dark:bg-brand-500/25" />
      <div className="animate-aurora-slow absolute top-12 -left-16 h-56 w-56 rounded-full bg-cyan-200/50 blur-[70px] sm:top-24 sm:-left-40 sm:h-112 sm:w-112 sm:blur-[110px] dark:bg-cyan-500/15" />
      <div className="animate-aurora absolute top-32 -right-16 h-56 w-56 rounded-full bg-emerald-200/50 blur-[70px] sm:top-48 sm:-right-40 sm:h-112 sm:w-112 sm:blur-[110px] dark:bg-emerald-400/10" />
    </div>
  )
}
