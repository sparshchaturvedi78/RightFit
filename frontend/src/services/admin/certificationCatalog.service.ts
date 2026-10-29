import { ADMIN_CERTIFICATION_CATALOG_API } from '../apis'
import { httpClient } from '../httpClient'

export interface CertificationDTO {
  id: number
  certificationName: string
  issuingOrganization?: string
  description?: string
  validYears?: number
  isActive: boolean
}

export interface CreateCertificationRequest {
  certificationName: string
  issuingOrganization?: string
  description?: string
  validYears?: number
}

export type UpdateCertificationRequest = Partial<CreateCertificationRequest>

async function list(activeOnly = true): Promise<CertificationDTO[]> {
  const { data } = await httpClient.get<CertificationDTO[]>(ADMIN_CERTIFICATION_CATALOG_API.list, {
    params: { activeOnly },
  })
  return data
}

async function create(payload: CreateCertificationRequest): Promise<CertificationDTO> {
  const { data } = await httpClient.post<CertificationDTO>(ADMIN_CERTIFICATION_CATALOG_API.create, payload)
  return data
}

async function update(id: number, payload: UpdateCertificationRequest): Promise<CertificationDTO> {
  const { data } = await httpClient.put<CertificationDTO>(ADMIN_CERTIFICATION_CATALOG_API.update(id), payload)
  return data
}

async function retire(id: number): Promise<CertificationDTO> {
  const { data } = await httpClient.put<CertificationDTO>(ADMIN_CERTIFICATION_CATALOG_API.retire(id))
  return data
}

export const adminCertificationCatalogService = { list, create, update, retire }
