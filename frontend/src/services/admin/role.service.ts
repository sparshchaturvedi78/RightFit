import { ADMIN_ROLE_API } from '../apis'
import { httpClient } from '../httpClient'

export interface Role {
  id: number
  code?: string
  name: string
  description?: string
  roleType: 'SYSTEM' | 'CUSTOM' | string
  isModifiable: boolean
  createdAt?: string
  updatedAt?: string
}

async function list(): Promise<Role[]> {
  const { data } = await httpClient.get<Role[]>(ADMIN_ROLE_API.list)
  return data
}

async function systemRoles(): Promise<Role[]> {
  const { data } = await httpClient.get<Role[]>(ADMIN_ROLE_API.system)
  return data
}

async function customRoles(): Promise<Role[]> {
  const { data } = await httpClient.get<Role[]>(ADMIN_ROLE_API.custom)
  return data
}

async function byId(roleId: number): Promise<Role> {
  const { data } = await httpClient.get<Role>(ADMIN_ROLE_API.byId(roleId))
  return data
}

async function permissions(roleId: number): Promise<string[]> {
  const { data } = await httpClient.get<string[]>(ADMIN_ROLE_API.permissions(roleId))
  return data
}

export const adminRoleService = { list, systemRoles, customRoles, byId, permissions }
