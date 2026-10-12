import { animate, useInView } from 'motion/react'
import { useEffect, useRef } from 'react'

interface AnimatedCounterProps {
  to: number
  suffix?: string
  duration?: number
}

export default function AnimatedCounter({ to, suffix = '', duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    const node = ref.current
    if (!inView || !node) return
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => {
        node.textContent = `${Math.round(v)}${suffix}`
      },
    })
    return () => controls.stop()
  }, [inView, to, suffix, duration])

  return <span ref={ref}>0{suffix}</span>
}
