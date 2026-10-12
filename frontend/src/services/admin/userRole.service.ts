import { ADMIN_USER_ROLE_API } from '../apis'
import type { Role } from './role.service'
import { httpClient } from '../httpClient'

export interface UserRoleDTO {
  id: number
  user?: { id: number; email?: string; employeeId?: string }
  role: Role
  assignedAt: string
  assignedBy?: number
  isActive: boolean
}

async function byUser(userId: number): Promise<UserRoleDTO[]> {
  const { data } = await httpClient.get<UserRoleDTO[]>(ADMIN_USER_ROLE_API.byUser(userId))
  return data
}

async function assign(userId: number, roleId: number): Promise<void> {
  await httpClient.post(ADMIN_USER_ROLE_API.assign, null, { params: { userId, roleId } })
}

async function remove(userId: number, roleId: number): Promise<void> {
  await httpClient.delete(ADMIN_USER_ROLE_API.remove, { params: { userId, roleId } })
}

async function deactivate(userId: number): Promise<void> {
  await httpClient.post(ADMIN_USER_ROLE_API.deactivate, null, { params: { userId } })
}

async function reactivate(userId: number): Promise<void> {
  await httpClient.post(ADMIN_USER_ROLE_API.reactivate, null, { params: { userId } })
}

export const adminUserRoleService = { byUser, assign, remove, deactivate, reactivate }
