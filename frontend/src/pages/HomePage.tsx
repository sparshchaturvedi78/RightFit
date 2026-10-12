import { MotionConfig, motion, useScroll, useSpring } from 'motion/react'
import CtaBanner from '../components/home/CtaBanner'
import FeaturesBento from '../components/home/FeaturesBento'
import Footer from '../components/home/Footer'
import Hero from '../components/home/Hero'
import HowItWorks from '../components/home/HowItWorks'
import Navbar from '../components/home/Navbar'
import RolesSection from '../components/home/RolesSection'
import SkillsMarquee from '../components/home/SkillsMarquee'
import WhyRightFit from '../components/home/WhyRightFit'

export default function HomePage() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen overflow-x-clip bg-white dark:bg-ink-950">
        <motion.div
          style={{ scaleX: progress }}
          className="fixed inset-x-0 top-0 z-60 h-0.5 origin-left bg-linear-to-r from-brand-500 via-emerald-400 to-cyan-400"
        />
        <Navbar />
        <main>
          <Hero />
          <SkillsMarquee />
          <FeaturesBento />
          <HowItWorks />
          <RolesSection />
          <WhyRightFit />
          <CtaBanner />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
