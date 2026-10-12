import AuroraBackground from '../ui/AuroraBackground'

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
      <AuroraBackground />

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
