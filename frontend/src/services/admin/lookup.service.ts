import { ADMIN_LOOKUP_API } from '../apis'
import { httpClient } from '../httpClient'

export interface DepartmentOption {
  id: number
  name: string
  code?: string
}

export interface LocationOption {
  id: number
  name: string
  city?: string
  country?: string
}

export interface LookupsDTO {
  departments: DepartmentOption[]
  locations: LocationOption[]
  designations: string[]
}

async function get(): Promise<LookupsDTO> {
  const { data } = await httpClient.get<LookupsDTO>(ADMIN_LOOKUP_API.get)
  return data
}

export const adminLookupService = { get }
