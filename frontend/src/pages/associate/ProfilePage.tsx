import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Dropdown } from '../../components/ui/Dropdown'
import { Button, Input } from '../../components/ui/form'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { associateProfileService, type EmployeePreferenceDTO } from '../../services/associate/profile.service'
import { getApiErrorMessage } from '../../services/httpClient'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize } from '../../utils/format'
import PageHeader from './PageHeader'
import { Card, Row } from './ui'

const LEVELS = Array.from({ length: 10 }, (_, i) => i + 1)

/** The associate's own profile: contact details, skills with a level, and what they would like to work on. */
export default function ProfilePage() {
  const profile = useQuery('associateProfile', {})
  const skills = useQuery('associateSkills', {})
  const p = profile.data

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Me"
        title="Profile and skills"
        sub="Managers find people by these details, so keep your skills and preferences current."
        actions={
          <RefreshButton
            onClick={() => {
              profile.refresh()
              skills.refresh()
            }}
            loading={profile.loading}
          />
        }
      />

      {profile.error && !p ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={profile.error} status={profile.status} onRetry={profile.refresh} />
        </div>
      ) : !p ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-5">
          <div className="grid gap-4 lg:gap-5">
            <Card title="About you">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Fact label="Name" value={`${p.firstName} ${p.lastName}`} />
                <Fact label="Employee ID" value={p.employeeId} />
                <Fact label="Designation" value={p.designation} />
                <Fact label="Grade" value={p.grade} />
                <Fact label="Domain" value={p.domain} />
                <Fact label="Experience" value={p.yearsOfExperience != null ? `${p.yearsOfExperience} years` : undefined} />
                <Fact label="Location" value={p.locationName} />
                <Fact label="RMG" value={p.rmgName} />
                <Fact label="Email" value={p.email} />
                <Fact label="Working day" value={p.workingHoursPerDay != null ? `${p.workingHoursPerDay} h` : undefined} />
              </dl>
              <PhoneForm current={p.phone ?? ''} />
            </Card>
            <PreferencesCard />
          </div>
          <SkillsCard />
        </div>
      )}
    </div>
  )
}

function Fact({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-bold tracking-widest text-ink-500 uppercase dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-ink-900 dark:text-white">{value || value === 0 ? value : '—'}</dd>
    </div>
  )
}

function PhoneForm({ current }: { current: string }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [phone, setPhone] = useState(current)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await associateProfileService.updateProfile({ phone: phone.trim() || undefined })
      toast.success('Phone saved')
      dispatch(invalidateQueries('associateProfile'))
    } catch (err) {
      toast.error('Could not save', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-end gap-2">
      <label className="grid flex-1 gap-1.5 text-xs font-semibold text-ink-500 dark:text-slate-400">
        Phone
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <Button variant="secondary" loading={busy} disabled={phone === current} onClick={() => void save()}>
        Save
      </Button>
    </div>
  )
}

function SkillsCard() {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const skills = useQuery('associateSkills', {})
  const [name, setName] = useState('')
  const [level, setLevel] = useState(5)
  const [years, setYears] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  async function run(key: string, action: () => Promise<unknown>, done: string) {
    setBusy(key)
    try {
      await action()
      toast.success(done)
      dispatch(invalidateQueries('associateSkills'))
    } catch (err) {
      toast.error('Could not save', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Card title="Skills" note={skills.data ? `${skills.data.length}` : undefined}>
      <div className="grid gap-2 rounded-2xl bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_110px_90px_auto] sm:items-end dark:bg-white/4">
        <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
          Skill
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="For example, Java" />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
          Level (1 to 10)
          <Dropdown ariaLabel="Level" value={String(level)} onChange={(v) => setLevel(Number(v))} options={LEVELS.map((l) => ({ value: String(l), label: String(l) }))} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
          Years
          <Input type="number" min={0} step={0.5} value={years} onChange={(e) => setYears(e.target.value)} />
        </label>
        <Button
          variant="primary"
          loading={busy === 'add'}
          disabled={!name.trim()}
          onClick={() =>
            void run(
              'add',
              async () => {
                await associateProfileService.addSkill({ skillName: name.trim(), proficiencyLevel: level, yearsOfExperience: years ? Number(years) : undefined })
                setName('')
                setYears('')
              },
              'Skill added',
            )
          }
        >
          Add
        </Button>
      </div>

      {!skills.data ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : skills.data.length === 0 ? (
        <p className="text-sm text-ink-500 dark:text-slate-400">No skills yet. Add the ones you use, with an honest level.</p>
      ) : (
        skills.data.map((s) => (
          <Row
            key={s.skillName}
            title={s.skillName}
            detail={[s.category ? humanize(s.category) : null, s.yearsOfExperience != null ? `${s.yearsOfExperience} yrs` : null].filter(Boolean).join(' · ')}
            aside={
              <div className="flex items-center gap-2">
                <Dropdown
                  ariaLabel={`Level for ${s.skillName}`}
                  size="sm"
                  value={String(s.proficiencyLevel)}
                  disabled={busy === s.skillName}
                  onChange={(v) => void run(s.skillName, () => associateProfileService.updateSkill(s.skillName, { proficiencyLevel: Number(v) }), 'Level saved')}
                  options={LEVELS.map((l) => ({ value: String(l), label: `${l}/10` }))}
                />
                <button
                  type="button"
                  aria-label={`Remove ${s.skillName}`}
                  onClick={() => void run(s.skillName, () => associateProfileService.removeSkill(s.skillName), 'Skill removed')}
                  className="rounded-lg p-1.5 text-ink-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            }
          />
        ))
      )}
    </Card>
  )
}

const PREF_FIELDS: { key: keyof EmployeePreferenceDTO; label: string; hint: string }[] = [
  { key: 'preferredTechnology', label: 'Technology', hint: 'For example, Java, React' },
  { key: 'preferredDomain', label: 'Domain', hint: 'For example, Banking' },
  { key: 'preferredLocation', label: 'Location', hint: 'For example, Bangalore' },
  { key: 'preferredWorkMode', label: 'Work mode', hint: 'Remote, Hybrid or Office' },
  { key: 'preferredProjectType', label: 'Project type', hint: 'For example, Product' },
]

function PreferencesCard() {
  const prefs = useQuery('associatePreferences', {})
  if (!prefs.data) return <Skeleton className="h-40 rounded-3xl" />
  return <PreferencesForm key={JSON.stringify(prefs.data)} initial={prefs.data} />
}

function PreferencesForm({ initial }: { initial: EmployeePreferenceDTO }) {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const [form, setForm] = useState<EmployeePreferenceDTO>(initial)
  const [busy, setBusy] = useState(false)

  async function save() {
    setBusy(true)
    try {
      await associateProfileService.updatePreferences(form)
      toast.success('Preferences saved')
      dispatch(invalidateQueries('associatePreferences'))
    } catch (err) {
      toast.error('Could not save', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title="What you would like">
      <div className="grid gap-3 sm:grid-cols-2">
        {PREF_FIELDS.map((f) => (
          <label key={f.key} className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
            {f.label}
            <Input value={form[f.key] ?? ''} placeholder={f.hint} onChange={(e) => setForm((cur) => ({ ...cur, [f.key]: e.target.value || null }))} />
          </label>
        ))}
      </div>
      <div className="flex justify-end">
        <Button variant="primary" loading={busy} onClick={() => void save()}>
          Save preferences
        </Button>
      </div>
    </Card>
  )
}
