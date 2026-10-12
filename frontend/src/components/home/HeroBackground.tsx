const OUTER_ORBIT = [
  { initials: 'PS', grad: 'from-rose-400 to-orange-400', pos: 'top-0 left-1/2' },
  { initials: 'AP', grad: 'from-sky-400 to-indigo-500', pos: 'top-1/2 right-0' },
  { initials: 'SG', grad: 'from-amber-400 to-pink-500', pos: 'bottom-0 left-1/2' },
  { initials: 'VD', grad: 'from-violet-400 to-fuchsia-500', pos: 'top-1/2 left-0' },
]

const INNER_ORBIT = [
  { initials: 'AS', grad: 'from-brand-400 to-emerald-600', pos: 'top-[15%] right-[15%]' },
  { initials: 'RK', grad: 'from-cyan-400 to-blue-500', pos: 'bottom-[15%] left-[15%]' },
]

function OrbitAvatar({ initials, grad, pos, reverse }: { initials: string; grad: string; pos: string; reverse?: boolean }) {
  return (
    <span className={`absolute ${pos} -translate-x-1/2 -translate-y-1/2`}>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br ${grad} text-xs font-bold text-white shadow-lg ring-4 ring-white/80 dark:ring-ink-950/80 ${
          reverse ? 'animate-orbit' : 'animate-orbit-reverse'
        }`}
      >
        {initials}
      </span>
    </span>
  )
}

export default function HeroBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-b from-brand-50/70 via-white to-white dark:from-ink-950 dark:via-[#07130e] dark:to-ink-950" />

      <div className="bg-grid fade-mask absolute inset-0" />

      <div className="animate-aurora absolute -top-48 left-1/2 h-144 w-144 -translate-x-1/2 rounded-full bg-brand-300/40 blur-[120px] dark:bg-brand-500/25" />
      <div className="animate-aurora-slow absolute top-24 -left-40 h-112 w-112 rounded-full bg-cyan-200/50 blur-[110px] dark:bg-cyan-500/15" />
      <div className="animate-aurora absolute top-48 -right-40 h-112 w-112 rounded-full bg-emerald-200/50 blur-[110px] dark:bg-emerald-400/10" />

      <div className="absolute top-72 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
        <div className="animate-orbit relative h-200 w-200 rounded-full border border-dashed border-slate-300/70 dark:border-white/10">
          {OUTER_ORBIT.map((a) => (
            <OrbitAvatar key={a.initials} {...a} />
          ))}
        </div>
        <div className="animate-orbit-reverse absolute top-1/2 left-1/2 h-136 w-136 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-300/60 dark:border-brand-400/10">
          {INNER_ORBIT.map((a) => (
            <OrbitAvatar key={a.initials} {...a} reverse />
          ))}
        </div>
      </div>
    </div>
  )
}
