import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, KeyRound, Lock, LogIn, ShieldCheck, UserRound } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthShell from '../components/auth/AuthShell'
import {
  AuthField,
  CountdownRing,
  ErrorBanner,
  PasswordToggle,
  SecureNote,
  StepHeader,
  StepProgress,
  SubmitButton,
  SuccessCheck,
  TEXT_LINK_CLASS,
} from '../components/auth/AuthUi'
import ForgotPasswordFlow from '../components/auth/ForgotPasswordFlow'
import OtpInput from '../components/ui/OtpInput'
import { dashboardPathForRoles, useAuth } from '../contexts/auth'
import { authService, type LoginOtpSentResponse } from '../services/auth.service'
import { getApiErrorMessage } from '../services/httpClient'
import { maskEmail } from '../utils/maskEmail'

type Step = 'credentials' | 'otp' | 'success'
type Mode = 'login' | 'forgot'

const REDIRECT_DELAY_MS = 1400

const LOGIN_STEP_INDEX: Record<Step, number> = { credentials: 0, otp: 1, success: 2 }

const stepMotion = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { duration: 0.3 },
}

const modeMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUserFromLogin } = useAuth()

  const [mode, setMode] = useState<Mode>('login')
  const [forgotStepIndex, setForgotStepIndex] = useState(0)
  const [step, setStep] = useState<Step>('credentials')
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpSession, setOtpSession] = useState<LoginOtpSentResponse | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [step, secondsLeft])

  useEffect(
    () => () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current)
    },
    [],
  )

  async function requestOtp(e?: FormEvent) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const response = await authService.login({ employeeId: employeeId.trim(), password })
      const total = Math.round(response.expiryMinutes * 60)
      setOtpSession(response)
      setOtp('')
      setTotalSeconds(total)
      setSecondsLeft(total)
      setStep('otp')
    } catch (err) {
      setError(getApiErrorMessage(err, 'Invalid employee ID or password.'))
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault()
    if (!otpSession) return
    setError(null)
    setLoading(true)
    try {
      const response = await authService.verifyLoginOtp({ otp, sessionId: otpSession.sessionId })
      const destination = dashboardPathForRoles(response.roles)
      if (destination === '/login') {
        setError('Your account has no role with dashboard access. Please contact your administrator.')
        return
      }
      setUserFromLogin(response)
      setFirstName(response.firstName)
      setStep('success')
      redirectTimerRef.current = setTimeout(() => navigate(destination, { replace: true }), REDIRECT_DELAY_MS)
    } catch (err) {
      setError(getApiErrorMessage(err, "That code didn't work. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  function backToCredentials() {
    setStep('credentials')
    setOtp('')
    setOtpSession(null)
    setSecondsLeft(0)
    setError(null)
  }

  function openForgotPassword() {
    setError(null)
    setForgotStepIndex(0)
    setMode('forgot')
  }

  const expiryLabel = `${Math.floor(secondsLeft / 60)}:${(secondsLeft % 60).toString().padStart(2, '0')}`

  return (
    <AuthShell journey={mode} activeStep={mode === 'forgot' ? forgotStepIndex : LOGIN_STEP_INDEX[step]}>
      <AnimatePresence mode="wait">
        {mode === 'forgot' ? (
          <motion.div key="forgot" {...modeMotion}>
            <ForgotPasswordFlow onBackToLogin={() => setMode('login')} onStepChange={setForgotStepIndex} />
          </motion.div>
        ) : (
          <motion.div key="login" {...modeMotion}>
            {step !== 'success' && (
              <StepProgress
                steps={['Sign in', 'Verify']}
                current={step === 'credentials' ? 0 : 1}
                className="lg:hidden"
              />
            )}

            <AnimatePresence mode="wait">
              {step === 'credentials' && (
                <motion.div key="credentials" {...stepMotion}>
                  <StepHeader icon={<LogIn className="h-7 w-7" />} title="Welcome back">
                    Sign in with your Employee ID to continue to RightFit.
                  </StepHeader>

                  <form onSubmit={requestOtp} className="mt-8 space-y-5">
                    <AuthField
                      id="employeeId"
                      label="Employee ID"
                      icon={<UserRound className="h-4 w-4" />}
                      type="text"
                      required
                      autoFocus
                      autoComplete="username"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="e.g. EMP001"
                    />

                    <AuthField
                      id="password"
                      label="Password"
                      icon={<Lock className="h-4 w-4" />}
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      labelAction={
                        <button
                          type="button"
                          onClick={openForgotPassword}
                          className="text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          Forgot password?
                        </button>
                      }
                      trailing={<PasswordToggle visible={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
                    />

                    <ErrorBanner message={error} />

                    <SubmitButton loading={loading} loadingText="Sending code...">
                      Continue
                    </SubmitButton>
                  </form>

                  <SecureNote />
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div key="otp" {...stepMotion}>
                  <StepHeader icon={<ShieldCheck className="h-7 w-7" />} title="Verify it's you">
                    Enter the 6-digit code sent to{' '}
                    <span className="font-semibold text-ink-900 dark:text-white">
                      {otpSession ? maskEmail(otpSession.email) : 'your email'}
                    </span>
                  </StepHeader>

                  <form onSubmit={verifyOtp} className="mt-8 space-y-5">
                    <OtpInput value={otp} onChange={setOtp} disabled={loading} autoFocus />

                    <CountdownRing seconds={secondsLeft} total={totalSeconds}>
                      {secondsLeft > 0 ? (
                        <>
                          Code expires in{' '}
                          <span className="font-semibold text-ink-900 dark:text-white">{expiryLabel}</span>
                        </>
                      ) : (
                        <span className="font-medium text-rose-500">Code expired — request a new one</span>
                      )}
                    </CountdownRing>

                    <ErrorBanner message={error} />

                    <SubmitButton
                      loading={loading}
                      disabled={otp.length !== 6}
                      loadingText="Verifying..."
                      icon={<KeyRound className="h-4 w-4" />}
                    >
                      Verify &amp; sign in
                    </SubmitButton>

                    <div className="flex items-center justify-between">
                      <button type="button" onClick={backToCredentials} className={TEXT_LINK_CLASS}>
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={secondsLeft > 0 || loading}
                        onClick={() => requestOtp()}
                        className="text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 disabled:cursor-not-allowed disabled:text-ink-500/40 dark:text-brand-400 dark:disabled:text-slate-600"
                      >
                        Resend code
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  className="py-4 text-center"
                >
                  <SuccessCheck />
                  <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">
                    Welcome back{firstName ? `, ${firstName}` : ''}!
                  </h1>
                  <p className="mt-2 text-sm text-ink-500 dark:text-slate-400">Taking you to your dashboard…</p>
                  <div className="mx-auto mt-8 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-linear-to-r from-brand-500 to-emerald-400"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: REDIRECT_DELAY_MS / 1000, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  )
}
