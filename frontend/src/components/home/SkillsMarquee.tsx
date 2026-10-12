const ROW_ONE = ['Java', 'Spring Boot', 'React', 'Python', 'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'Microservices', 'Kafka']
const ROW_TWO = ['Node.js', 'DevOps', 'QA Automation', 'Data Engineering', 'Angular', 'Azure', 'Django', 'TypeScript', 'Terraform', 'Power BI']

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="marquee fade-x flex overflow-hidden">
      <div className={`flex w-max shrink-0 gap-3 pr-3 ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}>
        {[...items, ...items].map((skill, i) => (
          <span
            key={`${skill}-${i}`}
            className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-5 py-2.5 text-sm font-medium whitespace-nowrap text-ink-700 shadow-sm backdrop-blur-sm transition-colors hover:border-brand-500/40 hover:text-brand-700 dark:border-white/10 dark:bg-white/4 dark:text-slate-300 dark:hover:text-brand-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {skill}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function SkillsMarquee() {
  return (
    <section className="relative border-y border-slate-200/70 py-12 dark:border-white/5">
      <p className="mb-6 text-center text-xs font-semibold tracking-[0.2em] text-ink-500 uppercase dark:text-slate-500">
        Skills flowing through your resource pool
      </p>
      <div className="space-y-3">
        <Row items={ROW_ONE} />
        <Row items={ROW_TWO} reverse />
      </div>
    </section>
  )
}
