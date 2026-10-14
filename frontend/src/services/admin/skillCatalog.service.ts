import { ADMIN_SKILL_CATALOG_API, ADMIN_SKILL_CATEGORY_API } from '../apis'
import { httpClient } from '../httpClient'

export interface SkillDTO {
  id: number
  skillName: string
  /** Category name. */
  category?: string
  categoryId?: number
  description?: string
  isActive: boolean
  /** Active associates holding the skill. */
  holderCount?: number
}

export interface SkillCategoryDTO {
  id: number
  name: string
  description?: string
  isActive: boolean
  skillCount: number
}

export interface HolderDTO {
  id: number
  employeeId: string
  name: string
  designation?: string
  proficiencyLevel: number
  yearsOfExperience?: number
  lastUsedDate?: string
}

export interface SkillHoldersPage {
  skill: SkillDTO
  activeHolders: number
  atLevelSevenOrAbove: number
  openRequirements: number
  content: HolderDTO[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

/** HIGH 8–10, MEDIUM 5–7, LOW 1–4. Empty = everyone. */
export type LevelBand = '' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface CreateSkillRequest {
  skillName: string
  categoryId: number
  description?: string
}

export interface UpdateSkillRequest {
  skillName?: string
  categoryId?: number
  description?: string
}

export interface CreateCategoryRequest {
  name: string
  description?: string
}

async function listSkills(activeOnly = false): Promise<SkillDTO[]> {
  const { data } = await httpClient.get<SkillDTO[]>(ADMIN_SKILL_CATALOG_API.list, { params: { activeOnly } })
  return data
}

async function createSkill(payload: CreateSkillRequest): Promise<SkillDTO> {
  const { data } = await httpClient.post<SkillDTO>(ADMIN_SKILL_CATALOG_API.create, payload)
  return data
}

async function updateSkill(id: number, payload: UpdateSkillRequest): Promise<SkillDTO> {
  const { data } = await httpClient.put<SkillDTO>(ADMIN_SKILL_CATALOG_API.update(id), payload)
  return data
}

async function retireSkill(id: number): Promise<SkillDTO> {
  const { data } = await httpClient.put<SkillDTO>(ADMIN_SKILL_CATALOG_API.retire(id))
  return data
}

async function restoreSkill(id: number): Promise<SkillDTO> {
  const { data } = await httpClient.put<SkillDTO>(ADMIN_SKILL_CATALOG_API.restore(id))
  return data
}

async function holders(id: number, level: LevelBand, page: number, size: number): Promise<SkillHoldersPage> {
  const { data } = await httpClient.get<SkillHoldersPage>(ADMIN_SKILL_CATALOG_API.holders(id), {
    params: { level: level || undefined, page, size },
  })
  return data
}

async function listCategories(): Promise<SkillCategoryDTO[]> {
  const { data } = await httpClient.get<SkillCategoryDTO[]>(ADMIN_SKILL_CATEGORY_API.list)
  return data
}

async function createCategory(payload: CreateCategoryRequest): Promise<SkillCategoryDTO> {
  const { data } = await httpClient.post<SkillCategoryDTO>(ADMIN_SKILL_CATEGORY_API.create, payload)
  return data
}

async function updateCategory(id: number, payload: Partial<CreateCategoryRequest>): Promise<SkillCategoryDTO> {
  const { data } = await httpClient.put<SkillCategoryDTO>(ADMIN_SKILL_CATEGORY_API.update(id), payload)
  return data
}

async function retireCategory(id: number): Promise<SkillCategoryDTO> {
  const { data } = await httpClient.put<SkillCategoryDTO>(ADMIN_SKILL_CATEGORY_API.retire(id))
  return data
}

async function restoreCategory(id: number): Promise<SkillCategoryDTO> {
  const { data } = await httpClient.put<SkillCategoryDTO>(ADMIN_SKILL_CATEGORY_API.restore(id))
  return data
}

export const adminSkillCatalogService = {
  listSkills,
  createSkill,
  updateSkill,
  retireSkill,
  restoreSkill,
  holders,
  listCategories,
  createCategory,
  updateCategory,
  retireCategory,
  restoreCategory,
}
