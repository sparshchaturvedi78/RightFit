import { ADMIN_USER_ACCOUNT_API } from '../apis'
import type { PageResponse } from '../common.types'
import { httpClient } from '../httpClient'

/** ALLOWED: can sign in. BLOCKED: sign-in switched off. LOCKED: too many failed sign-ins. */
export type SignInState = 'ALLOWED' | 'BLOCKED' | 'LOCKED'

export interface UserAccountDTO {
  userId: number
  employeeId: string
  /** Null when the account has no employee record. */
  name?: string
  email: string
  status: string
  signInState: SignInState
  neverSignedIn: boolean
  lastLoginAt?: string
  createdAt?: string
  /** Active role codes: ADMIN, MANAGER, RMG, ASSOCIATE. */
  roles: string[]
  employmentStatus?: string
  blockReason?: string
  blockedBy?: string
  blockedAt?: string
  lockedUntil?: string
  /** True for the account of the person signed in right now. */
  self: boolean
}

export interface UserAccountSummary {
  totalAccounts: number
  accountsByRole: Record<string, number>
  blocked: number
  locked: number
  neverSignedIn: number
  signInsToday: number
  signIns: { date: string; count: number }[]
}

/** ALL = no state filter. */
export type AccountState = 'ALL' | 'BLOCKED' | 'LOCKED' | 'NEVER'

export interface UserAccountFilters {
  q?: string
  role?: string
  state?: AccountState
  page?: number
  size?: number
}

async function list(filters: UserAccountFilters = {}): Promise<PageResponse<UserAccountDTO>> {
  const params = { ...filters, state: filters.state && filters.state !== 'ALL' ? filters.state : undefined }
  const { data } = await httpClient.get<PageResponse<UserAccountDTO>>(ADMIN_USER_ACCOUNT_API.list, { params })
  return data
}

async function summary(): Promise<UserAccountSummary> {
  const { data } = await httpClient.get<UserAccountSummary>(ADMIN_USER_ACCOUNT_API.summary)
  return data
}

async function block(userId: number, reason: string): Promise<UserAccountDTO> {
  const { data } = await httpClient.put<UserAccountDTO>(ADMIN_USER_ACCOUNT_API.block(userId), { reason })
  return data
}

async function unblock(userId: number, reason: string): Promise<UserAccountDTO> {
  const { data } = await httpClient.put<UserAccountDTO>(ADMIN_USER_ACCOUNT_API.unblock(userId), { reason })
  return data
}

async function unlock(userId: number, reason: string): Promise<UserAccountDTO> {
  const { data } = await httpClient.put<UserAccountDTO>(ADMIN_USER_ACCOUNT_API.unlock(userId), { reason })
  return data
}

export const adminUserAccountService = { list, summary, block, unblock, unlock }
