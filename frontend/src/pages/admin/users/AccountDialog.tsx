import { CalendarClock, Lock, ShieldBan, ShieldCheck, Unlock } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Badge } from '../../../components/ui/Badge'
import { Button, FormError, Textarea } from '../../../components/ui/form'
import { Modal } from '../../../components/ui/Overlay'
import { useToast } from '../../../hooks/useToast'
import { adminUserAccountService, type UserAccountDTO } from '../../../services/admin/userAccount.service'
import { getApiErrorMessage } from '../../../services/httpClient'
import { avatarGradient } from '../employees/employeeUi'
import { accountInitials, accountName, ROLE_LABEL, STATE_TONE, stamp, stateText } from './usersUi'

const MIN_REASON = 3

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-ink-500 dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink-900 dark:text-white">{children || '—'}</dd>
    </div>
  )
}

const ROLE_TONE: Record<string, 'green' | 'sky' | 'amber' | 'violet'> = {
  ADMIN: 'green',
  MANAGER: 'sky',
  RMG: 'amber',
  ASSOCIATE: 'violet',
}

/** Shows one account: why it is blocked or locked, its details, and the action that fixes it. */
export default function AccountDialog({
  account: a,
  onClose,
  onChanged,
}: {
  account: UserAccountDTO
  onClose: () => void
  onChanged: (updated: UserAccountDTO, message: string) => void
}) {
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const blocked = a.signInState === 'BLOCKED'
  const locked = a.signInState === 'LOCKED'
  const fromDeactivation = blocked && a.blockReason?.startsWith('Employee deactivated: ')
  const shownReason = fromDeactivation ? a.blockReason?.replace('Employee deactivated: ', '') : a.blockReason

  const action = blocked
    ? { label: 'Unblock account', icon: ShieldCheck, tone: 'primary' as const, verb: 'unblock' as const }
    : locked
      ? { label: 'Unlock account', icon: Unlock, tone: 'primary' as const, verb: 'unlock' as const }
      : { label: 'Block sign-in', icon: ShieldBan, tone: 'danger' as const, verb: 'block' as const }

  // Every block, unblock and unlock needs a reason; the backend keeps it in the audit log.
  const reasonOk = reason.trim().length >= MIN_REASON
  // Nobody can block the account they are signed in with; the server refuses it too.
  const blockingSelf = a.self && action.verb === 'block'

  async function run() {
    if (!reasonOk) {
      setError(`Give a reason of at least ${MIN_REASON} characters. It is kept in the audit log.`)
      return
    }
    setError(null)
    setSaving(true)
    try {
      const text = reason.trim()
      const updated =
        action.verb === 'block'
          ? await adminUserAccountService.block(a.userId, text)
          : action.verb === 'unblock'
            ? await adminUserAccountService.unblock(a.userId, text)
            : await adminUserAccountService.unlock(a.userId, text)
      const message =
        action.verb === 'block'
          ? `${accountName(a)} can no longer sign in`
          : action.verb === 'unblock'
            ? `${accountName(a)} can sign in again`
            : `${accountName(a)} is unlocked`
      toast.success('Saved', message)
      onChanged(updated, message)
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save this change. Nothing was changed.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={accountName(a)}
      subtitle={`${a.employeeId} · ${stateText(a)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Close
          </Button>
          <Button
            variant={action.tone === 'danger' ? 'danger' : 'primary'}
            icon={<action.icon className="h-4 w-4" />}
            loading={saving}
            disabled={!reasonOk || blockingSelf}
            onClick={() => void run()}
          >
            {action.label}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br ${avatarGradient(a.userId)} text-base font-bold text-white shadow-md`}
          >
            {accountInitials(a)}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone={STATE_TONE[a.signInState]} dot>
              {stateText(a)}
            </Badge>
            {a.roles.map((r) => (
              <Badge key={r} tone={ROLE_TONE[r] ?? 'slate'}>
                {ROLE_LABEL[r] ?? r}
              </Badge>
            ))}
          </div>
        </div>

        {blocked && (
          <div className="flex gap-3 rounded-2xl border border-rose-500/25 bg-rose-500/8 p-4 text-sm">
            <ShieldBan className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="min-w-0 space-y-2">
              <p className="font-semibold text-rose-700 dark:text-rose-300">
                {fromDeactivation ? 'Blocked because the employee was deactivated' : 'Blocked from signing in'}
              </p>
              <p className="whitespace-pre-line rounded-xl border-l-[3px] border-rose-500 bg-white/60 px-3 py-2 text-ink-900 dark:bg-white/5 dark:text-white">
                {shownReason || 'No reason was recorded.'}
              </p>
              <p className="text-xs text-ink-500 dark:text-slate-400">
                {a.blockedAt ? `Blocked ${stamp(a.blockedAt)}` : 'Blocked'}
                {a.blockedBy ? ` by ${a.blockedBy}` : ''}. Their roles are kept, so unblocking restores their access.
              </p>
            </div>
          </div>
        )}

        {locked && (
          <div className="flex gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-4 text-sm">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-800 dark:text-amber-200">Locked after too many failed sign-ins</p>
              <p className="text-ink-700 dark:text-slate-300">
                {a.lockedUntil ? `Locked until ${stamp(a.lockedUntil)}.` : 'Locked for now.'} Unlocking lets them try again.
                Their roles don’t change.
              </p>
            </div>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Item label="Email">{a.email}</Item>
          <Item label="Employee status">{a.employmentStatus ? (a.employmentStatus === 'ACTIVE' ? 'Active' : 'Deactivated') : 'No employee record'}</Item>
          <Item label="Last signed in">{stamp(a.lastLoginAt) ?? 'Never signed in'}</Item>
          <Item label="Account created">{stamp(a.createdAt)}</Item>
        </dl>

        {blockingSelf && (
          <div className="flex gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-500/8 p-3.5 text-sm text-amber-800 dark:text-amber-200">
            <ShieldBan className="mt-0.5 h-4 w-4 shrink-0" />
            <p>This is your own account. You can’t block yourself; another Admin would have to do it.</p>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-ink-500 dark:text-slate-400">
          <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Roles are changed on the Employees page.
        </div>

        <div className="space-y-2">
          <label htmlFor="account-reason" className="block text-xs font-semibold text-ink-500 dark:text-slate-400">
            {action.verb === 'block' ? 'Why is this account being blocked?' : action.verb === 'unblock' ? 'Why is it being unblocked?' : 'Why is it being unlocked?'}
          </label>
          <Textarea
            id="account-reason"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value)
              setError(null)
            }}
            placeholder="Required. Kept in the audit log."
          />
          {!reasonOk && reason.length > 0 && !blockingSelf && (
            <p className="text-xs text-ink-500 dark:text-slate-400">Enter at least {MIN_REASON} characters.</p>
          )}
        </div>

        <FormError message={error} />
      </div>
    </Modal>
  )
}
