import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext, type Theme } from './theme'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('rightfit-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // ignore unavailable storage
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('rightfit-theme', theme)
    } catch {
      // ignore unavailable storage
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}
