import { useState } from 'react'
import { Drawer } from '../../../components/ui/Overlay'
import { Dropdown } from '../../../components/ui/Dropdown'
import { Button, Field, FormError, Input, Textarea } from '../../../components/ui/form'
import { useAuth } from '../../../contexts/auth'
import { useToast } from '../../../hooks/useToast'
import type { ProjectDTO } from '../../../services/admin/project.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { managerRequirementAssignmentService } from '../../../services/manager/requirementAssignment.service'
import { managerRequirementService, type RequirementDTO } from '../../../services/manager/requirement.service'
import ResponsibilityBoard from './ResponsibilityBoard'
import { type PickedPerson } from './ResponsibilityPicker'

type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
]

const num = (v: string): number | undefined => (v.trim() === '' ? undefined : Number(v))

/**
 * Create a requirement: the role, then who sources, interviews and coordinates it. One requirement is one person to
 * hire. Everything can be changed later from the requirement page. Saving as a draft keeps it private; "Create and
 * publish" opens it for candidates straight away. Given a `requirement`, the same panel edits its role details
 * (who handles it is changed on the requirement page itself).
 */
export default function NewRequirementPanel({
  open,
  onClose,
  projects,
  initialProjectId,
  requirement,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  /** Projects the manager has claimed: requirements can only be created for these. */
  projects: ProjectDTO[]
  initialProjectId?: string
  /** When set, the panel edits this requirement instead of creating one. */
  requirement?: RequirementDTO | null
  /** Called with the requirement after it was created or saved. */
  onCreated: (requirement: RequirementDTO) => void
}) {
  const editing = Boolean(requirement)
  const { user } = useAuth()
  const toast = useToast()
  const me: PickedPerson | null = user ? { employeeId: user.employeeId, name: `${user.firstName} ${user.lastName}`.trim() } : null

  const [projectId, setProjectId] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<Priority>('MEDIUM')
  const [description, setDescription] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [skillText, setSkillText] = useState('')
  const [minExp, setMinExp] = useState('')
  const [maxExp, setMaxExp] = useState('')
  const [certs, setCerts] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sourcers, setSourcers] = useState<PickedPerson[]>([])
  const [interviewers, setInterviewers] = useState<PickedPerson[]>([])
  const [coordinators, setCoordinators] = useState<PickedPerson[]>([])
  const [busy, setBusy] = useState<'draft' | 'publish' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // A fresh form each time the panel opens. The manager is the coordinator unless they say otherwise.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setProjectId(requirement?.projectId ?? initialProjectId ?? projects[0]?.projectId ?? '')
      setTitle(requirement?.positionTitle ?? '')
      setPriority((requirement?.priority as Priority | undefined) ?? 'MEDIUM')
      setDescription(requirement?.description ?? '')
      setSkills(requirement?.requiredSkills ? requirement.requiredSkills.split(',').map((k) => k.trim()).filter(Boolean) : [])
      setSkillText('')
      setMinExp(requirement?.minExperience != null ? String(requirement.minExperience) : '')
      setMaxExp(requirement?.maxExperience != null ? String(requirement.maxExperience) : '')
      setCerts(requirement?.requiredCertifications ?? '')
      setFrom(requirement?.allocationStartDate ?? '')
      setTo(requirement?.allocationEndDate ?? '')
      setSourcers([])
      setInterviewers([])
      setCoordinators(!requirement && me ? [me] : [])
      setError(null)
    }
  }

  function commitSkill(raw: string) {
    const s = raw.trim()
    if (s && !skills.some((k) => k.toLowerCase() === s.toLowerCase())) setSkills([...skills, s])
    setSkillText('')
  }

  function problem(): string | null {
    if (!projectId) return 'Choose a project.'
    if (!title.trim()) return 'Give the position a title.'
    if (minExp && maxExp && Number(minExp) > Number(maxExp)) return 'Experience “from” can’t be more than “to”.'
    if (from && to && to < from) return 'The end date can’t be before the start date.'
    return null
  }

  async function submit(publish: boolean) {
    const bad = problem()
    if (bad) {
      setError(bad)
      return
    }
    setBusy(publish ? 'publish' : 'draft')
    setError(null)
    if (requirement) {
      try {
        const saved = await managerRequirementService.update(requirement.requirementId, {
          projectId: requirement.projectId,
          positionTitle: title.trim(),
          description: description.trim() || undefined,
          requiredSkills: skills.length ? skills.join(', ') : undefined,
          minExperience: num(minExp),
          maxExperience: num(maxExp),
          requiredCertifications: certs.trim() || undefined,
          priority,
          allocationStartDate: from || undefined,
          allocationEndDate: to || undefined,
        })
        toast.success(`${saved.requirementId} saved`, saved.positionTitle)
        onCreated(saved)
        onClose()
      } catch (err) {
        setError(getApiErrorMessage(err, 'Could not save the changes. Try again.'))
      } finally {
        setBusy(null)
      }
      return
    }
    let created: RequirementDTO
    try {
      created = await managerRequirementService.create({
        projectId,
        positionTitle: title.trim(),
        description: description.trim() || undefined,
        requiredSkills: skills.length ? skills.join(', ') : undefined,
        minExperience: num(minExp),
        maxExperience: num(maxExp),
        requiredCertifications: certs.trim() || undefined,
        priority,
        allocationStartDate: from || undefined,
        allocationEndDate: to || undefined,
      })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create the requirement. Try again.'))
      setBusy(null)
      return
    }

    // The requirement exists now. Anything that fails from here is reported, and can be fixed on the requirement page.
    const wanted = [
      ...sourcers.map((p) => ({ p, type: 'SOURCER' as const })),
      ...interviewers.map((p) => ({ p, type: 'INTERVIEWER' as const })),
      ...coordinators.map((p) => ({ p, type: 'COORDINATOR' as const })),
    ]
    const results = await Promise.allSettled(
      wanted.map((w) => managerRequirementAssignmentService.assign(created.requirementId, { employeeId: w.p.employeeId, responsibilityType: w.type })),
    )
    const failed = wanted.filter((_, i) => results[i].status === 'rejected').map((w) => `${w.p.name} (${w.type.toLowerCase()})`)
    let publishFailed = false
    if (publish) {
      try {
        await managerRequirementService.publish(created.requirementId, { reason: 'Published when created' })
      } catch {
        publishFailed = true
      }
    }

    if (failed.length || publishFailed) {
      toast.error(
        `${created.requirementId} was created, with problems`,
        [failed.length ? `Couldn’t assign ${failed.join(', ')}.` : '', publishFailed ? 'It is still a draft.' : ''].filter(Boolean).join(' ') +
          ' Open it to fix this.',
      )
    } else {
      toast.success(publish ? `${created.requirementId} published` : `${created.requirementId} saved as a draft`, created.positionTitle)
    }
    setBusy(null)
    onCreated(created)
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={busy ? () => undefined : onClose}
      title={editing ? `Edit ${requirement?.requirementId}` : 'New requirement'}
      subtitle={editing ? 'Change the role. To change who handles it, use the requirement page.' : 'One requirement is one person to hire. Need three? Create three.'}
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <Button variant="secondary" onClick={onClose} disabled={busy !== null}>
            Cancel
          </Button>
          {editing ? (
            <Button variant="primary" onClick={() => void submit(false)} loading={busy === 'draft'} disabled={busy !== null}>
              Save changes
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => void submit(false)} loading={busy === 'draft'} disabled={busy !== null}>
                Save as draft
              </Button>
              <Button variant="primary" onClick={() => void submit(true)} loading={busy === 'publish'} disabled={busy !== null}>
                Create and publish
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="grid gap-6">
        <section className="grid gap-4">
          <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">The role</h3>
          <Field label="Project" htmlFor="nr-project" required hint={editing ? 'A requirement stays with its project.' : 'Only projects you have claimed are listed.'}>
            <Dropdown
              id="nr-project"
              value={projectId}
              onChange={setProjectId}
              disabled={editing}
              placeholder="No claimed project"
              emptyText="You haven't claimed a project yet"
              options={projects.map((p) => ({ value: p.projectId, label: p.projectName, hint: p.projectId }))}
            />
          </Field>
          <Field label="Position title" htmlFor="nr-title" required>
            <Input id="nr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="For example, Senior Backend Engineer" autoComplete="off" />
          </Field>
          <div>
            <span id="nr-priority" className="mb-1.5 block text-xs font-semibold text-ink-700 dark:text-slate-300">
              Priority
            </span>
            <div role="group" aria-labelledby="nr-priority" className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/4">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={priority === p.value}
                  onClick={() => setPriority(p.value)}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    priority === p.value ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900' : 'text-ink-500 hover:text-ink-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <Field label="What the person will do" htmlFor="nr-desc">
            <Textarea id="nr-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <div>
            <label htmlFor="nr-skill" className="mb-1.5 block text-xs font-semibold text-ink-700 dark:text-slate-300">
              Skills needed
            </label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-white/10 dark:bg-white/5">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/12 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-400">
                  {s}
                  <button type="button" aria-label={`Remove ${s}`} onClick={() => setSkills(skills.filter((k) => k !== s))}>
                    ×
                  </button>
                </span>
              ))}
              <input
                id="nr-skill"
                value={skillText}
                onChange={(e) => (e.target.value.endsWith(',') ? commitSkill(e.target.value.slice(0, -1)) : setSkillText(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    commitSkill(skillText)
                  }
                }}
                onBlur={() => commitSkill(skillText)}
                placeholder="Type a skill and press Enter"
                className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-ink-500/50 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Experience from (years)" htmlFor="nr-min">
              <Input id="nr-min" type="number" min={0} value={minExp} onChange={(e) => setMinExp(e.target.value)} />
            </Field>
            <Field label="to (years)" htmlFor="nr-max">
              <Input id="nr-max" type="number" min={0} value={maxExp} onChange={(e) => setMaxExp(e.target.value)} />
            </Field>
          </div>
          <Field label="Certifications (optional)" htmlFor="nr-certs">
            <Input id="nr-certs" value={certs} onChange={(e) => setCerts(e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Needed from" htmlFor="nr-from">
              <Input id="nr-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="Until" htmlFor="nr-to">
              <Input id="nr-to" type="date" min={from || undefined} value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
        </section>

        {!editing && (
        <section className="grid gap-3">
          <h3 className="text-[11px] font-bold tracking-[0.12em] text-ink-500 uppercase dark:text-slate-500">Who handles it</h3>
          <ResponsibilityBoard
            projectId={projectId}
            value={{ SOURCER: sourcers, INTERVIEWER: interviewers, COORDINATOR: coordinators }}
            onChange={(type, next) => (type === 'SOURCER' ? setSourcers : type === 'INTERVIEWER' ? setInterviewers : setCoordinators)(next)}
          />
          <p className="text-xs text-ink-500 dark:text-slate-400">
            Only people on the project's team, and you, can be chosen. Each step can have more than one person, and you can change
            who handles it at any time from the requirement page.
          </p>
        </section>
        )}

        <FormError message={error} />
      </div>
    </Drawer>
  )
}
