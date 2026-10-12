import { useRef } from 'react'

interface OtpInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export default function OtpInput({ length = 6, value, onChange, disabled, autoFocus }: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function setDigit(index: number, digit: string) {
    const next = digits.slice()
    next[index] = digit
    onChange(next.join(''))
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1)
    setDigit(index, digit)
    if (digit && index < length - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
      setDigit(index - 1, '')
    }
    if (e.key === 'ArrowLeft' && index > 0) inputsRef.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < length - 1) inputsRef.current[index + 1]?.focus()
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted.padEnd(digits.length, ''))
    const focusIndex = Math.min(pasted.length, length - 1)
    inputsRef.current[focusIndex]?.focus()
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digit}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`h-14 w-11 rounded-2xl border text-center text-xl font-bold text-ink-900 transition-all duration-200 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 sm:w-12 dark:text-white dark:focus:border-brand-400 ${
            digit
              ? 'scale-105 border-brand-500 bg-brand-500/10 shadow-md shadow-brand-500/20 dark:border-brand-400 dark:bg-brand-400/10'
              : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5'
          }`}
        />
      ))}
    </div>
  )
}
