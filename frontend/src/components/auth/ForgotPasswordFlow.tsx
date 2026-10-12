import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Check, KeyRound, Lock, LockKeyhole, LogIn, Mail, MailCheck, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { authService } from '../../services/auth.service'
import { getApiErrorMessage } from '../../services/httpClient'
import { maskEmail } from '../../utils/maskEmail'
import OtpInput from '../ui/OtpInput'
import {
  AuthField,
  CountdownRing,
  ErrorBanner,
  PasswordToggle,
  StepHeader,
  StepProgress,
  SubmitButton,
  SuccessCheck,
  TEXT_LINK_CLASS,
} from './AuthUi'

type Step = 'email' | 'otp' | 'reset' | 'done'

const STEPS: Step[] = ['email', 'otp', 'reset']
const STEP_LABELS = ['Email', 'Verify', 'Reset']
const MIN_PASSWORD_LENGTH = 8
const RESEND_COOLDOWN_SECONDS = 60

const STRENGTH_LEVELS = [
  { label: 'Too short', color: 'bg-rose-500', text: 'text-rose-500' },
  { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500' },
  { label: 'Fair', color: 'bg-amber-400', text: 'text-amber-500' },
  { label: 'Good', color: 'bg-sky-500', text: 'text-sky-500' },
  { label: 'Strong', color: 'bg-brand-500', text: 'text-brand-600 dark:text-brand-400' },
]

function passwordScore(password: string): number {
  if (password.length < MIN_PASSWORD_LENGTH) return 0
  let score = 1
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const stepMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.3 },
}

function PasswordRule({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <li
      className={`flex items-center gap-2 text-xs transition-colors ${
        met ? 'text-brand-600 dark:text-brand-400' : 'text-ink-500 dark:text-slate-400'
      }`}
    >
      <motion.span
        animate={{ scale: met ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
          met ? 'bg-brand-500 text-white' : 'bg-slate-200 text-transparent dark:bg-white/10'
        }`}
      >
        <Check className="h-3 w-3" />
      </motion.span>
      {children}
    </li>
  )
}

function StrengthMeter({ password }: { password: string }) {
  const score = passwordScore(password)
  const level = STRENGTH_LEVELS[score]

  return (
    <div>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((segment) => (
          <div key={segment} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <motion.div
              className={`h-full rounded-full ${level.color}`}
              initial={false}
              animate={{ width: score >= segment ? '100%' : '0%' }}
              transition={{ duration: 0.35 }}
            />
          </div>
        ))}
      </div>
      {password && (
        <p className={`mt-1.5 text-right text-[11px] font-semibold ${level.text}`}>{level.label}</p>
      )}
    </div>
  )
}

interface ForgotPasswordFlowProps {
  onBackToLogin: () => void
  onStepChange?: (stepIndex: number) => void
}

export default function ForgotPasswordFlow({ onBackToLogin, onStepChange }: ForgotPasswordFlowProps) {
  const [step, setStepState] = useState<Step>('email')

  function setStep(next: Step) {
    setStepState(next)
    onStepChange?.(next === 'done' ? STEPS.length : STEPS.indexOf(next))
  }
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const passwordLongEnough = newPassword.length >= MIN_PASSWORD_LENGTH
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword

  async function sendCode(e?: FormEvent) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.forgotPasswordStep1({ email: email.trim() })
      setOtp('')
      setCooldown(RESEND_COOLDOWN_SECONDS)
      setStep('otp')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send the code. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await authService.forgotPasswordStep2({ email: email.trim(), otp })
      setResetToken(response.resetToken)
      setStep('reset')
    } catch (err) {
      setError(getApiErrorMessage(err, "That code didn't work. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authService.forgotPasswordStep3({ email: email.trim(), resetToken, newPassword, confirmPassword })
      setStep('done')
    } catch (err) {
      const message = getApiErrorMessage(err, 'Could not reset your password. Please try again.')
      if (/restart/i.test(message)) startOver()
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  function startOver() {
    setOtp('')
    setResetToken('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setStep('email')
  }

  function backToEmail() {
    setOtp('')
    setError(null)
    setStep('email')
  }

  const cooldownLabel = `${Math.floor(cooldown / 60)}:${(cooldown % 60).toString().padStart(2, '0')}`

  return (
    <div>
      {step !== 'done' && <StepProgress steps={STEP_LABELS} current={STEPS.indexOf(step)} className="lg:hidden" />}

      <AnimatePresence mode="wait">
        {step === 'email' && (
          <motion.div key="email" {...stepMotion}>
            <StepHeader icon={<Mail className="h-7 w-7" />} title="Forgot password?">
              No worries — enter your registered email and we'll send you a 6-digit reset code.
            </StepHeader>

            <form onSubmit={sendCode} className="mt-8 space-y-5">
              <AuthField
                id="resetEmail"
                label="Email address"
                icon={<Mail className="h-4 w-4" />}
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />

              <ErrorBanner message={error} />

              <SubmitButton loading={loading} loadingText="Sending code..." icon={<Send className="h-4 w-4" />}>
                Send reset code
              </SubmitButton>

              <div className="flex justify-center">
                <button type="button" onClick={onBackToLogin} className={TEXT_LINK_CLASS}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'otp' && (
          <motion.div key="otp" {...stepMotion}>
            <StepHeader icon={<MailCheck className="h-7 w-7" />} title="Check your inbox">
              Enter the 6-digit code sent to{' '}
              <span className="font-semibold text-ink-900 dark:text-white">{maskEmail(email.trim())}</span>
            </StepHeader>

            <form onSubmit={verifyCode} className="mt-8 space-y-5">
              <OtpInput value={otp} onChange={setOtp} disabled={loading} autoFocus />

              <CountdownRing seconds={cooldown} total={RESEND_COOLDOWN_SECONDS}>
                {cooldown > 0 ? (
                  <>
                    You can resend in <span className="font-semibold text-ink-900 dark:text-white">{cooldownLabel}</span>
                  </>
                ) : (
                  "Didn't get it? You can resend the code now."
                )}
              </CountdownRing>

              <ErrorBanner message={error} />

              <SubmitButton
                loading={loading}
                disabled={otp.length !== 6}
                loadingText="Verifying..."
                icon={<ShieldCheck className="h-4 w-4" />}
              >
                Verify code
              </SubmitButton>

              <div className="flex items-center justify-between">
                <button type="button" onClick={backToEmail} className={TEXT_LINK_CLASS}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Change email
                </button>
                <button
                  type="button"
                  disabled={cooldown > 0 || loading}
                  onClick={() => sendCode()}
                  className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-ink-500/40 dark:text-brand-400 dark:disabled:text-slate-600"
                >
                  Resend code
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'reset' && (
          <motion.div key="reset" {...stepMotion}>
            <StepHeader icon={<KeyRound className="h-7 w-7" />} title="Create a new password">
              Make it strong — you can't reuse your current or recent passwords.
            </StepHeader>

            <form onSubmit={resetPassword} className="mt-8 space-y-5">
              <AuthField
                id="newPassword"
                label="New password"
                icon={<Lock className="h-4 w-4" />}
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
              />

              <StrengthMeter password={newPassword} />

              <AuthField
                id="confirmPassword"
                label="Confirm new password"
                icon={<LockKeyhole className="h-4 w-4" />}
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />

              <ul className="space-y-1.5 px-1">
                <PasswordRule met={passwordLongEnough}>At least {MIN_PASSWORD_LENGTH} characters</PasswordRule>
                <PasswordRule met={passwordsMatch}>Both passwords match</PasswordRule>
              </ul>

              <ErrorBanner message={error} />

              <SubmitButton
                loading={loading}
                disabled={!passwordLongEnough || !passwordsMatch}
                loadingText="Updating password..."
                icon={<Lock className="h-4 w-4" />}
              >
                Reset password
              </SubmitButton>

              <div className="flex justify-center">
                <button type="button" onClick={startOver} className={TEXT_LINK_CLASS}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Start over
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="text-center"
          >
            <SuccessCheck />
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
              Password updated!
            </h1>
            <p className="mt-2 text-sm text-ink-500 dark:text-slate-400">
              Your password has been reset. Sign in with your new password to continue.
            </p>
            <div className="mt-8">
              <SubmitButton type="button" onClick={onBackToLogin} icon={<LogIn className="h-4 w-4" />}>
                Back to sign in
              </SubmitButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
