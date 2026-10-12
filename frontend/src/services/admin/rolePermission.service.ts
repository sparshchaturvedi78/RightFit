import { ADMIN_ROLE_PERMISSION_API } from '../apis'
import type { Permission } from './permission.service'
import { httpClient } from '../httpClient'

async function byRole(roleId: number): Promise<Permission[]> {
  const { data } = await httpClient.get<Permission[]>(ADMIN_ROLE_PERMISSION_API.byRole(roleId))
  return data
}

async function rolesByPermission(permissionId: number): Promise<number[]> {
  const { data } = await httpClient.get<number[]>(ADMIN_ROLE_PERMISSION_API.rolesByPermission(permissionId))
  return data
}

async function check(roleId: number, permissionId: number): Promise<boolean> {
  const { data } = await httpClient.get<boolean>(ADMIN_ROLE_PERMISSION_API.check(roleId, permissionId))
  return data
}

export const adminRolePermissionService = { byRole, rolesByPermission, check }
