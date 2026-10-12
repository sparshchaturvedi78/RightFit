import { motion } from 'motion/react'
import { BarChart3, Bell, Check, Hourglass, KeyRound, Target, Workflow } from 'lucide-react'
import type { ReactNode } from 'react'
import Reveal from '../ui/Reveal'
import SectionHeading from '../ui/SectionHeading'
import SpotlightCard from '../ui/SpotlightCard'

function CardHeader({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600 ring-1 ring-brand-500/20 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 dark:text-brand-400">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink-900 dark:text-white">{title}</h3>
      <p className="mt-1.5 text-sm text-ink-500 dark:text-slate-400">{text}</p>
    </>
  )
}

const BENCH = [
  { name: 'Vikram Desai', days: 34, zone: 'Green', color: 'bg-brand-500', chip: 'bg-brand-500/15 text-brand-700 dark:text-brand-300' },
  { name: 'Sneha Gupta', days: 104, zone: 'Amber', color: 'bg-amber-400', chip: 'bg-amber-400/15 text-amber-700 dark:text-amber-300' },
  { name: 'Rohit Nair', days: 131, zone: 'Red', color: 'bg-rose-500', chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
]

const MATCHES = [
  { name: 'Ananya Singh', score: 94 },
  { name: 'Amit Patel', score: 81 },
  { name: 'Vikram Desai', score: 67 },
]

const WORKFLOW = ['Manager requests allocation', 'RMG reviews capacity', 'Allocation approved', 'Associate onboarded']

const PERMISSIONS = [
  { role: 'Admin', perm: 'Manage roles & audit' },
  { role: 'Manager', perm: 'Publish requirements' },
  { role: 'RMG', perm: 'Approve allocations' },
  { role: 'Associate', perm: 'Update availability' },
]

const DEMAND = [
  { skill: 'Java', demand: 85, supply: 60 },
  { skill: 'React', demand: 70, supply: 75 },
  { skill: 'Python', demand: 55, supply: 40 },
  { skill: 'AWS', demand: 90, supply: 45 },
  { skill: 'DevOps', demand: 60, supply: 50 },
  { skill: 'QA', demand: 40, supply: 55 },
]

export default function FeaturesBento() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="Features"
          title="Everything to run your"
          highlight="talent supply chain"
          subtitle="From bench tracking to approvals and analytics — every workflow your teams need, connected in one place."
        />

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          <Reveal className="lg:col-span-2">
            <SpotlightCard className="p-7">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <CardHeader
                    icon={<Hourglass className="h-5 w-5" />}
                    title="Bench Tracking & Aging"
                    text="Every associate on the bench is tracked automatically and colour-coded green, amber or red against your configured thresholds."
                  />
                </div>
                <div className="space-y-3">
                  {BENCH.map((b, i) => (
                    <motion.div
                      key={b.name}
                      initial={{ opacity: 0, x: 30 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.15 }}
                      className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 dark:border-white/5 dark:bg-white/4"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-ink-900 dark:text-white">{b.name}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${b.chip}`}>
                          {b.zone} · {b.days}d
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                        <motion.div
                          className={`h-full rounded-full ${b.color}`}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.min((b.days / 150) * 100, 100)}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.4 + i * 0.15 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal delay={0.1}>
            <SpotlightCard className="p-7">
              <CardHeader
                icon={<Target className="h-5 w-5" />}
                title="Smart Candidate Matching"
                text="RMG recommendations rank the pool against each requirement's skills and experience."
              />
              <div className="mt-5 space-y-3">
                {MATCHES.map((m, i) => (
                  <div key={m.name}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-ink-700 dark:text-slate-300">{m.name}</span>
                      <span className="font-bold text-brand-600 dark:text-brand-400">{m.score}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-linear-to-r from-brand-500 to-cyan-400"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${m.score}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.3 + i * 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal>
            <SpotlightCard className="p-7">
              <CardHeader
                icon={<Workflow className="h-5 w-5" />}
                title="Approval Workflow"
                text="Managers request, RMG approves — capacity is checked before anyone is double-booked."
              />
              <div className="relative mt-5 space-y-3 pl-1">
                <div className="absolute top-2 bottom-2 left-[13px] w-px bg-slate-200 dark:bg-white/10" />
                <motion.div
                  className="absolute top-2 left-[13px] w-px origin-top bg-brand-500"
                  initial={{ height: 0 }}
                  whileInView={{ height: 'calc(100% - 16px)' }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, delay: 0.3 }}
                />
                {WORKFLOW.map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0.3 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.4 }}
                    className="relative flex items-center gap-3"
                  >
                    <motion.span
                      initial={{ scale: 0.6, backgroundColor: 'rgba(148,163,184,0.3)' }}
                      whileInView={{ scale: 1, backgroundColor: '#22c55e' }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.4, type: 'spring', stiffness: 300 }}
                      className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </motion.span>
                    <span className="text-sm text-ink-700 dark:text-slate-300">{step}</span>
                  </motion.div>
                ))}
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal delay={0.1}>
            <SpotlightCard className="p-7">
              <CardHeader
                icon={<Bell className="animate-wiggle h-5 w-5" />}
                title="Real-time Notifications"
                text="Invitations, interviews and decisions reach the right person the moment they happen."
              />
              <div className="mt-5 space-y-2.5">
                {[
                  { t: 'You have a new invitation', s: 'FinTech Platform · Java Dev' },
                  { t: 'Interview confirmed', s: 'Tomorrow · 11:00 AM' },
                  { t: 'Allocation approved', s: 'Starts Monday' },
                ].map((n, i) => (
                  <motion.div
                    key={n.t}
                    initial={{ opacity: 0, y: -14, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.3, type: 'spring', stiffness: 260, damping: 20 }}
                    className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/80 p-2.5 dark:border-white/5 dark:bg-white/4"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-ink-900 dark:text-white">{n.t}</p>
                      <p className="truncate text-[11px] text-ink-500 dark:text-slate-400">{n.s}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal delay={0.2}>
            <SpotlightCard className="p-7">
              <CardHeader
                icon={<KeyRound className="h-5 w-5" />}
                title="Role-based Access"
                text="Fine-grained permissions for every role, with a full audit trail of who did what."
              />
              <div className="mt-5 space-y-2.5">
                {PERMISSIONS.map((p, i) => (
                  <div
                    key={p.role}
                    className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-white/5 dark:bg-white/4"
                  >
                    <div>
                      <p className="text-xs font-semibold text-ink-900 dark:text-white">{p.role}</p>
                      <p className="text-[11px] text-ink-500 dark:text-slate-400">{p.perm}</p>
                    </div>
                    <motion.span
                      initial={{ backgroundColor: 'rgba(148,163,184,0.4)' }}
                      whileInView={{ backgroundColor: '#22c55e' }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.4 + i * 0.2 }}
                      className="flex h-5 w-9 items-center rounded-full p-0.5"
                    >
                      <motion.span
                        initial={{ x: 0 }}
                        whileInView={{ x: 16 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 + i * 0.2, type: 'spring', stiffness: 400, damping: 25 }}
                        className="h-4 w-4 rounded-full bg-white shadow"
                      />
                    </motion.span>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </Reveal>

          <Reveal className="lg:col-span-3">
            <SpotlightCard className="p-7">
              <div className="grid items-center gap-8 lg:grid-cols-5">
                <div className="lg:col-span-2">
                  <CardHeader
                    icon={<BarChart3 className="h-5 w-5" />}
                    title="Demand & Supply Intelligence"
                    text="See which skills your open requirements need versus what your pool actually has — and spot shortages before they block a project."
                  />
                  <div className="mt-5 flex gap-5 text-xs">
                    <span className="flex items-center gap-2 text-ink-500 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-sm bg-brand-500" /> Demand
                    </span>
                    <span className="flex items-center gap-2 text-ink-500 dark:text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" /> Supply
                    </span>
                  </div>
                </div>
                <div className="flex h-48 items-end justify-between gap-3 lg:col-span-3">
                  {DEMAND.map((d, i) => (
                    <div key={d.skill} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <div className="flex h-full w-full items-end justify-center gap-1">
                        <motion.div
                          className="w-1/2 max-w-5 rounded-t-md bg-linear-to-t from-brand-600 to-brand-400"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${d.demand}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                        />
                        <motion.div
                          className="w-1/2 max-w-5 rounded-t-md bg-linear-to-t from-cyan-500 to-cyan-300"
                          initial={{ height: 0 }}
                          whileInView={{ height: `${d.supply}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                        />
                      </div>
                      <span
                        className={`text-[11px] font-medium ${
                          d.demand > d.supply ? 'text-rose-500' : 'text-ink-500 dark:text-slate-400'
                        }`}
                      >
                        {d.skill}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SpotlightCard>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
