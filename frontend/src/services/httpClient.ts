import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { API_BASE_URL, AUTH_API } from './apis'
import { tokenStorage } from './tokenStorage'

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const tokens = tokenStorage.get()
  if (!tokens) throw new Error('No refresh token available')

  const response = await axios.post(
    `${API_BASE_URL}${AUTH_API.refreshToken}`,
    { refreshToken: tokens.refreshToken },
    { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
  )

  const newAccessToken: string = response.data.accessToken
  const newRefreshToken: string = response.data.refreshToken
  tokenStorage.set({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  return newAccessToken
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined
    const isAuthEndpoint =
      originalRequest?.url?.includes(AUTH_API.login) ||
      originalRequest?.url?.includes(AUTH_API.verifyLoginOtp) ||
      originalRequest?.url?.includes(AUTH_API.refreshToken)

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried && !isAuthEndpoint) {
      originalRequest._retried = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const newAccessToken = await refreshPromise
        originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
        return httpClient(originalRequest)
      } catch (refreshError) {
        tokenStorage.clear()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

export interface ApiErrorBody {
  status: number
  error: string
  message: string
  timestamp?: string
  path?: string
  details?: string
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    return body?.message ?? error.message ?? fallback
  }
  return fallback
}
