import { BadgeCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button, Input } from '../../components/ui/form'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { associateProfileService, type EmployeeCertificationDTO } from '../../services/associate/profile.service'
import { getApiErrorMessage } from '../../services/httpClient'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { formatDay } from '../admin/employees/employeeUi'
import PageHeader from './PageHeader'
import { Card, Row, Tag } from './ui'

/** Certifications with their dates and an optional document. Requirements that ask for one are matched on these. */
export default function CertificationsPage() {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const list = useQuery('associateCertifications', {})
  const [name, setName] = useState('')
  const [obtained, setObtained] = useState('')
  const [expiry, setExpiry] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState<string | number | null>(null)

  async function add() {
    if (!name.trim() || !obtained) return
    setBusy('add')
    try {
      await associateProfileService.addCertification({ certificationName: name.trim(), obtainedDate: obtained, expiryDate: expiry || undefined, file: file ?? undefined })
      toast.success('Certification added', name.trim())
      setName('')
      setObtained('')
      setExpiry('')
      setFile(null)
      dispatch(invalidateQueries('associateCertifications'))
    } catch (err) {
      toast.error('Could not add it', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  async function remove(c: EmployeeCertificationDTO) {
    setBusy(c.id)
    try {
      await associateProfileService.removeCertification(c.id)
      toast.success('Certification removed', c.certificationName)
      dispatch(invalidateQueries('associateCertifications'))
    } catch (err) {
      toast.error('Could not remove it', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  async function view(c: EmployeeCertificationDTO) {
    try {
      const url = await associateProfileService.certificationDocumentUrl(c.id)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      toast.error('Could not open the document', getApiErrorMessage(err, 'Try again.'))
    }
  }

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader eyebrow="Me" title="Certifications" sub="Add each certification with its dates. A document is optional." actions={<RefreshButton onClick={list.refresh} loading={list.loading} />} />

      <Card title="Add a certification">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(10.5rem,11rem)_minmax(10.5rem,11rem)_minmax(0,1fr)_auto] lg:items-end">
          <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
            Name
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="For example, AWS Developer Associate" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
            Obtained
            <Input type="date" value={obtained} onChange={(e) => setObtained(e.target.value)} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
            Expires (optional)
            <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
            Document (optional)
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full min-w-0 text-xs text-ink-700 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:font-semibold file:text-ink-900 dark:text-slate-300 dark:file:bg-white/10 dark:file:text-white"
            />
          </label>
          <Button variant="primary" loading={busy === 'add'} disabled={!name.trim() || !obtained} onClick={() => void add()}>
            Add
          </Button>
        </div>
      </Card>

      {list.error && !list.data ? (
        <div className={`${TILE_SURFACE} p-5`}>
          <PanelError message={list.error} status={list.status} onRetry={list.refresh} />
        </div>
      ) : !list.data ? (
        <Skeleton className="h-40 rounded-3xl" />
      ) : list.data.length === 0 ? (
        <div className={`${TILE_SURFACE} px-6 py-12`}>
          <EmptyState icon={<BadgeCheck className="h-5 w-5" />}>No certifications yet.</EmptyState>
        </div>
      ) : (
        <Card title="Your certifications" note={`${list.data.length}`}>
          {list.data.map((c) => (
            <Row
              key={c.id}
              title={c.certificationName}
              detail={[c.issuingOrganization, c.obtainedDate ? `obtained ${formatDay(c.obtainedDate)}` : null, c.expiryDate ? `expires ${formatDay(c.expiryDate)}` : null].filter(Boolean).join(' · ')}
              aside={
                <div className="flex items-center gap-2">
                  <Tag tone={c.isValid === false ? 'muted' : 'ok'}>{c.isValid === false ? 'Expired' : 'Valid'}</Tag>
                  {c.hasDocument && (
                    <Button variant="secondary" onClick={() => void view(c)}>
                      Document
                    </Button>
                  )}
                  <button
                    type="button"
                    aria-label={`Remove ${c.certificationName}`}
                    disabled={busy === c.id}
                    onClick={() => void remove(c)}
                    className="rounded-lg p-1.5 text-ink-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-slate-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              }
            />
          ))}
        </Card>
      )}
    </div>
  )
}
