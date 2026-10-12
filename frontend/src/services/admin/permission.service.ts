import { ADMIN_PERMISSION_API } from '../apis'
import { httpClient } from '../httpClient'

export interface Permission {
  id: number
  name: string
  description: string
  resource: string
  action: string
  scope: string
  isActive: boolean
  isSystem: boolean
  createdAt?: string
  updatedAt?: string
}

async function list(): Promise<Permission[]> {
  const { data } = await httpClient.get<Permission[]>(ADMIN_PERMISSION_API.list)
  return data
}

async function systemPermissions(): Promise<Permission[]> {
  const { data } = await httpClient.get<Permission[]>(ADMIN_PERMISSION_API.system)
  return data
}

async function customPermissions(): Promise<Permission[]> {
  const { data } = await httpClient.get<Permission[]>(ADMIN_PERMISSION_API.custom)
  return data
}

async function byId(permissionId: number): Promise<Permission> {
  const { data } = await httpClient.get<Permission>(ADMIN_PERMISSION_API.byId(permissionId))
  return data
}

async function byName(permissionName: string): Promise<Permission> {
  const { data } = await httpClient.get<Permission>(ADMIN_PERMISSION_API.byName(permissionName))
  return data
}

async function byResource(resource: string): Promise<Permission[]> {
  const { data } = await httpClient.get<Permission[]>(ADMIN_PERMISSION_API.byResource(resource))
  return data
}

export const adminPermissionService = { list, systemPermissions, customPermissions, byId, byName, byResource }
