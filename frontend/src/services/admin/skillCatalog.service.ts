import { ADMIN_SKILL_CATALOG_API } from '../apis'
import { httpClient } from '../httpClient'

export interface SkillDTO {
  id: number
  skillName: string
  category?: string
  description?: string
  isActive: boolean
}

export interface CreateSkillRequest {
  skillName: string
  category?: string
  description?: string
}

export type UpdateSkillRequest = Partial<CreateSkillRequest>

async function list(activeOnly = true): Promise<SkillDTO[]> {
  const { data } = await httpClient.get<SkillDTO[]>(ADMIN_SKILL_CATALOG_API.list, { params: { activeOnly } })
  return data
}

async function create(payload: CreateSkillRequest): Promise<SkillDTO> {
  const { data } = await httpClient.post<SkillDTO>(ADMIN_SKILL_CATALOG_API.create, payload)
  return data
}

async function update(id: number, payload: UpdateSkillRequest): Promise<SkillDTO> {
  const { data } = await httpClient.put<SkillDTO>(ADMIN_SKILL_CATALOG_API.update(id), payload)
  return data
}

async function retire(id: number): Promise<SkillDTO> {
  const { data } = await httpClient.put<SkillDTO>(ADMIN_SKILL_CATALOG_API.retire(id))
  return data
}

export const adminSkillCatalogService = { list, create, update, retire }
