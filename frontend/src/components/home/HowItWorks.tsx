import { motion } from 'motion/react'
import { CheckCircle2, ClipboardList, Search, UsersRound } from 'lucide-react'
import SectionHeading from '../ui/SectionHeading'

const STEPS = [
  {
    icon: UsersRound,
    title: 'Maintain Resource Pool',
    description: 'Associates keep skills, certifications, preferences and availability up to date.',
    color: 'from-brand-500 to-emerald-600',
  },
  {
    icon: ClipboardList,
    title: 'Create Requirements',
    description: 'Managers publish one requirement per position with skills and timelines.',
    color: 'from-sky-500 to-blue-600',
  },
  {
    icon: Search,
    title: 'Discover & Shortlist',
    description: 'RMG recommends, managers shortlist, invite and interview the best fits.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: CheckCircle2,
    title: 'Allocate & Track',
    description: 'RMG approves capacity, the associate is allocated and the bench updates.',
    color: 'from-amber-500 to-orange-600',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-slate-50/80 dark:bg-white/1.5" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading
          eyebrow="How it works"
          title="From open requirement to"
          highlight="allocated in days"
          subtitle="A single, transparent flow shared by every role — no spreadsheets, no lost emails."
        />

        <div className="relative mt-20">
          <div className="absolute top-8 right-[12.5%] left-[12.5%] hidden h-0.5 rounded-full bg-slate-200 lg:block dark:bg-white/10" />
          <motion.div
            className="absolute top-8 left-[12.5%] hidden h-0.5 origin-left rounded-full bg-linear-to-r from-brand-500 via-sky-500 to-amber-500 lg:block"
            style={{ width: '75%' }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: '-120px' }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />

          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-120px' }}
                transition={{ duration: 0.6, delay: 0.3 + i * 0.4 }}
                className="group relative text-center"
              >
                <div className="relative mx-auto h-16 w-16">
                  <span className={`absolute inset-0 rounded-2xl bg-linear-to-br ${step.color} opacity-40 blur-lg transition-opacity group-hover:opacity-80`} />
                  <span
                    className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${step.color} text-white shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-6`}
                  >
                    <step.icon className="h-7 w-7" />
                  </span>
                  <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-ink-900 text-xs font-bold text-white dark:border-ink-950 dark:bg-white dark:text-ink-900">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-bold text-ink-900 dark:text-white">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-64 text-sm text-ink-500 dark:text-slate-400">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
