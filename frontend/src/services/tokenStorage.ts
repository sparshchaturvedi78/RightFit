const ACCESS_TOKEN_KEY = 'rightfit-access-token'
const REFRESH_TOKEN_KEY = 'rightfit-refresh-token'

export interface StoredTokens {
  accessToken: string
  refreshToken: string
}

const clearListeners = new Set<() => void>()

export const tokenStorage = {
  /** Runs when the stored session is discarded (logout, or the refresh token no longer works). */
  onClear(listener: () => void) {
    clearListeners.add(listener)
  },
  get(): StoredTokens | null {
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
      if (!accessToken || !refreshToken) return null
      return { accessToken, refreshToken }
    } catch {
      return null
    }
  },
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY)
    } catch {
      return null
    }
  },
  set(tokens: StoredTokens) {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    } catch {
      // ignore unavailable storage
    }
  },
  clear() {
    clearListeners.forEach((listener) => listener())
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    } catch {
      // ignore unavailable storage
    }
  },
}
