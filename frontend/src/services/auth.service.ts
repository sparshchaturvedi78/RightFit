import { AUTH_API } from './apis'
import { httpClient } from './httpClient'
import { tokenStorage } from './tokenStorage'

export interface LoginRequest {
  employeeId: string
  password: string
}

export interface LoginOtpSentResponse {
  message: string
  email: string
  /** Serialized as a JSON string by the backend (large-Long safety), despite being a Long server-side. */
  sessionId: string
  expiryMinutes: number
}

export interface VerifyLoginOtpRequest {
  otp: string
  sessionId: string
}

export interface LoginResponse {
  userId: number
  employeeId: string
  email: string
  firstName: string
  lastName: string
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  roles: string[]
  status: string
}

export interface VerifyEmailRequest {
  email: string
  otp: string
}

export interface ForgotPasswordStep1Request {
  email: string
}

export interface ForgotPasswordStep2Request {
  email: string
  otp: string
}

export interface ForgotPasswordStep2Response {
  message: string
  resetToken: string
}

export interface ForgotPasswordStep3Request {
  email: string
  resetToken: string
  newPassword: string
  confirmPassword: string
}

export interface ResetPasswordRequest {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UserProfile {
  userId: number
  employeeId: string
  email: string
  firstName: string
  lastName: string
  designation: string
  department: string
  grade: string
  roles: string[]
  status: string
  employmentStatus: string
  allocationStatus: string
}

export interface MessageResponse {
  message: string
}

async function login(payload: LoginRequest): Promise<LoginOtpSentResponse> {
  const { data } = await httpClient.post<LoginOtpSentResponse>(AUTH_API.login, payload)
  return data
}

async function verifyLoginOtp(payload: VerifyLoginOtpRequest): Promise<LoginResponse> {
  const { data } = await httpClient.post<LoginResponse>(AUTH_API.verifyLoginOtp, payload)
  tokenStorage.set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return data
}

async function logout(): Promise<void> {
  const tokens = tokenStorage.get()
  try {
    if (tokens) {
      await httpClient.post(AUTH_API.logout, { refreshToken: tokens.refreshToken })
    }
  } finally {
    tokenStorage.clear()
  }
}

async function verifyEmailOtp(payload: VerifyEmailRequest): Promise<MessageResponse> {
  const { data } = await httpClient.post<MessageResponse>(AUTH_API.verifyEmailOtp, payload)
  return data
}

async function forgotPasswordStep1(payload: ForgotPasswordStep1Request): Promise<MessageResponse> {
  const { data } = await httpClient.post<MessageResponse>(AUTH_API.forgotPasswordStep1, payload)
  return data
}

async function forgotPasswordStep2(payload: ForgotPasswordStep2Request): Promise<ForgotPasswordStep2Response> {
  const { data } = await httpClient.post<ForgotPasswordStep2Response>(AUTH_API.forgotPasswordStep2, payload)
  return data
}

async function forgotPasswordStep3(payload: ForgotPasswordStep3Request): Promise<MessageResponse> {
  const { data } = await httpClient.post<MessageResponse>(AUTH_API.forgotPasswordStep3, payload)
  return data
}

async function resetPassword(payload: ResetPasswordRequest): Promise<MessageResponse> {
  const { data } = await httpClient.post<MessageResponse>(AUTH_API.resetPassword, payload)
  return data
}

async function getCurrentUser(): Promise<UserProfile> {
  const { data } = await httpClient.get<UserProfile>(AUTH_API.me)
  return data
}

function isAuthenticated(): boolean {
  return tokenStorage.get() !== null
}

export const authService = {
  login,
  verifyLoginOtp,
  logout,
  verifyEmailOtp,
  forgotPasswordStep1,
  forgotPasswordStep2,
  forgotPasswordStep3,
  resetPassword,
  getCurrentUser,
  isAuthenticated,
}
