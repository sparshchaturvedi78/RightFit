import { Clock } from 'lucide-react'
import { useState } from 'react'
import { EmptyState, PanelError, Skeleton, TILE_SURFACE } from '../../components/dashboard/Panel'
import { Button, Input, Textarea } from '../../components/ui/form'
import RefreshButton from '../../components/ui/RefreshButton'
import { useQuery } from '../../hooks/useQuery'
import { useToast } from '../../hooks/useToast'
import { associateProfileService } from '../../services/associate/profile.service'
import { getApiErrorMessage } from '../../services/httpClient'
import { useAppDispatch } from '../../store'
import { invalidateQueries } from '../../store/queriesSlice'
import { humanize, timeAgo } from '../../utils/format'
import { formatDay } from '../admin/employees/employeeUi'
import PageHeader from './PageHeader'
import { Card, Row, Tag } from './ui'

/**
 * Time away (leave, training elsewhere, anything that makes you unavailable). Your RMG verifies each request;
 * when you are back early you say so here.
 */
export default function AvailabilityPage() {
  const dispatch = useAppDispatch()
  const toast = useToast()
  const list = useQuery('associateAvailability', {})
  const dashboard = useQuery('associateDashboard', {})
  const [until, setUntil] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState<string | number | null>(null)

  async function run(key: string | number, action: () => Promise<unknown>, done: string) {
    setBusy(key)
    try {
      await action()
      toast.success(done)
      dispatch(invalidateQueries('associateAvailability'))
      dispatch(invalidateQueries('associateDashboard'))
    } catch (err) {
      toast.error('Could not save', getApiErrorMessage(err, 'Try again.'))
    } finally {
      setBusy(null)
    }
  }

  const away = dashboard.data?.availabilityStatus && dashboard.data.availabilityStatus !== 'AVAILABLE'

  return (
    <div className="mx-auto grid max-w-350 grid-cols-[minmax(0,1fr)] gap-4 lg:gap-5">
      <PageHeader
        eyebrow="Me"
        title="Availability"
        sub="Tell your RMG when you will be away, and when you are back."
        actions={
          <RefreshButton
            onClick={() => {
              list.refresh()
              dashboard.refresh()
            }}
            loading={list.loading}
          />
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-5">
        <div className="grid gap-4 lg:gap-5">
          <Card title="Right now">
            <p className="text-sm text-ink-900 dark:text-white">{dashboard.data ? humanize(dashboard.data.availabilityStatus) : '…'}</p>
            {away && (
              <Button variant="secondary" loading={busy === 'back'} onClick={() => void run('back', () => associateProfileService.returnEarly(), 'Welcome back')}>
                I am back early
              </Button>
            )}
          </Card>

          <Card title="Request time away">
            <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
              Back on
              <Input type="date" value={until} onChange={(e) => setUntil(e.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-ink-500 dark:text-slate-400">
              Reason
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example, planned leave" />
            </label>
            <div className="flex justify-end">
              <Button
                variant="primary"
                loading={busy === 'request'}
                disabled={!until || !reason.trim()}
                onClick={() =>
                  void run(
                    'request',
                    async () => {
                      await associateProfileService.requestUnavailability({ expectedReturnDate: until, reason: reason.trim() })
                      setUntil('')
                      setReason('')
                    },
                    'Request sent to your RMG',
                  )
                }
              >
                Send to RMG
              </Button>
            </div>
          </Card>
        </div>

        {list.error && !list.data ? (
          <div className={`${TILE_SURFACE} p-5`}>
            <PanelError message={list.error} status={list.status} onRetry={list.refresh} />
          </div>
        ) : !list.data ? (
          <Skeleton className="h-48 rounded-3xl" />
        ) : list.data.length === 0 ? (
          <div className={`${TILE_SURFACE} px-6 py-12`}>
            <EmptyState icon={<Clock className="h-5 w-5" />}>No time away recorded.</EmptyState>
          </div>
        ) : (
          <Card title="Your requests" note={`${list.data.length}`}>
            {list.data.map((a) => (
              <Row
                key={a.id}
                title={`${humanize(a.availabilityStatus)}${a.expectedReturnDate ? ` until ${formatDay(a.expectedReturnDate)}` : ''}`}
                detail={[a.reason, a.createdAt ? `asked ${timeAgo(a.createdAt)}` : null, a.verifiedByName ? `by ${a.verifiedByName}` : null, a.verificationComment].filter(Boolean).join(' · ')}
                aside={
                  <div className="flex items-center gap-2">
                    <Tag tone={a.verificationStatus === 'VERIFIED' || a.verificationStatus === 'APPROVED' ? 'ok' : 'muted'}>{humanize(a.verificationStatus)}</Tag>
                    {a.verificationStatus === 'PENDING' && (
                      <Button variant="secondary" loading={busy === a.id} onClick={() => void run(a.id, () => associateProfileService.cancelUnavailabilityRequest(a.id), 'Request cancelled')}>
                        Cancel
                      </Button>
                    )}
                  </div>
                }
              />
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}
