import { motion } from 'motion/react'
import { ArrowRight, LayoutDashboard, LogIn, Sprout } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboardLink } from '../../hooks/useDashboardLink'
import Reveal from '../ui/Reveal'

export default function CtaBanner() {
  const { checking, loggedIn, to: ctaTo } = useDashboardLink()
  return (
    <section id="contact" className="relative px-6 py-24 sm:py-32">
      <Reveal className="mx-auto max-w-6xl">
        <div className="glow-border rounded-4xl">
          <div className="relative overflow-hidden rounded-4xl bg-linear-to-br from-brand-600 via-emerald-600 to-teal-700 px-8 py-16 text-center sm:px-16 dark:from-[#0b2a1b] dark:via-[#0a1f17] dark:to-ink-950">
            <div className="bg-grid absolute inset-0 opacity-30" />
            <div className="animate-aurora absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/20 blur-3xl dark:bg-brand-500/30" />
            <div className="animate-aurora-slow absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />

            <motion.span
              initial={{ scale: 0, rotate: -45 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="animate-float-y relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-md"
            >
              <Sprout className="h-8 w-8" />
            </motion.span>

            <h2 className="relative mx-auto mt-8 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Ready to find the right people for your next project?
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-brand-50/90 sm:text-lg">
              Sign in to RightFit and start turning your bench into billable, well-matched teams.
            </p>

            <div className="relative mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                to={ctaTo}
                aria-busy={checking}
                className={`shimmer group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-700 shadow-xl shadow-black/20 transition-all hover:scale-105 ${
                  checking ? 'pointer-events-none opacity-60' : ''
                }`}
              >
                {loggedIn ? <LayoutDashboard className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
                {loggedIn ? 'Open your dashboard' : 'Login to RightFit'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#features"
                className="rounded-full border border-white/40 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
