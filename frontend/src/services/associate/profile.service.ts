import { ASSOCIATE_PROFILE_API } from '../apis'
import type { EmployeeDTO } from '../admin/employee.service'
import { httpClient } from '../httpClient'

export interface UpdateProfileRequest {
  phone?: string
}

export interface EmployeeSkillDTO {
  id: number
  skillId?: number
  skillName: string
  category?: string
  proficiencyLevel: number
  yearsOfExperience?: number
  lastUsedDate?: string
}

export interface AddEmployeeSkillRequest {
  skillName: string
  proficiencyLevel: number
  yearsOfExperience?: number
  lastUsedDate?: string
}

export interface UpdateEmployeeSkillRequest {
  proficiencyLevel?: number
  yearsOfExperience?: number
  lastUsedDate?: string
}

export interface EmployeeCertificationDTO {
  id: number
  certificationId?: number
  certificationName: string
  issuingOrganization?: string
  obtainedDate?: string
  expiryDate?: string
  isValid?: boolean
  fileName?: string
  contentType?: string
  fileSize?: number
  hasDocument?: boolean
}

export interface EmployeePreferenceDTO {
  preferredTechnology: string | null
  preferredDomain: string | null
  preferredLocation: string | null
  preferredWorkMode: string | null
  preferredProjectType: string | null
}

export type UpdateEmployeePreferenceRequest = Partial<EmployeePreferenceDTO>

export interface EmployeeAvailabilityDTO {
  id: number
  employeeId: string
  availabilityStatus: string
  expectedReturnDate?: string
  reason?: string
  verificationStatus: string
  verifiedByName?: string
  verifiedAt?: string
  verificationComment?: string
  createdAt?: string
}

export interface RequestUnavailabilityRequest {
  expectedReturnDate: string
  reason: string
}

async function getProfile(): Promise<EmployeeDTO> {
  const { data } = await httpClient.get<EmployeeDTO>(ASSOCIATE_PROFILE_API.profile)
  return data
}

async function updateProfile(payload: UpdateProfileRequest): Promise<EmployeeDTO> {
  const { data } = await httpClient.put<EmployeeDTO>(ASSOCIATE_PROFILE_API.profile, payload)
  return data
}

async function listSkills(): Promise<EmployeeSkillDTO[]> {
  const { data } = await httpClient.get<EmployeeSkillDTO[]>(ASSOCIATE_PROFILE_API.skills)
  return data
}

async function addSkill(payload: AddEmployeeSkillRequest): Promise<EmployeeSkillDTO> {
  const { data } = await httpClient.post<EmployeeSkillDTO>(ASSOCIATE_PROFILE_API.skills, payload)
  return data
}

async function updateSkill(skillName: string, payload: UpdateEmployeeSkillRequest): Promise<EmployeeSkillDTO> {
  const { data } = await httpClient.put<EmployeeSkillDTO>(ASSOCIATE_PROFILE_API.updateSkill(skillName), payload)
  return data
}

async function removeSkill(skillName: string): Promise<void> {
  await httpClient.delete(ASSOCIATE_PROFILE_API.removeSkill(skillName))
}

async function listCertifications(): Promise<EmployeeCertificationDTO[]> {
  const { data } = await httpClient.get<EmployeeCertificationDTO[]>(ASSOCIATE_PROFILE_API.certifications)
  return data
}

async function addCertification(params: {
  certificationName: string
  obtainedDate: string
  expiryDate?: string
  file?: File
}): Promise<EmployeeCertificationDTO> {
  const form = new FormData()
  form.append('certificationName', params.certificationName)
  form.append('obtainedDate', params.obtainedDate)
  if (params.expiryDate) form.append('expiryDate', params.expiryDate)
  if (params.file) form.append('file', params.file)

  const { data } = await httpClient.post<EmployeeCertificationDTO>(ASSOCIATE_PROFILE_API.certifications, form)
  return data
}

async function updateCertification(
  id: number,
  params: { obtainedDate?: string; expiryDate?: string; file?: File },
): Promise<EmployeeCertificationDTO> {
  const form = new FormData()
  if (params.obtainedDate) form.append('obtainedDate', params.obtainedDate)
  if (params.expiryDate) form.append('expiryDate', params.expiryDate)
  if (params.file) form.append('file', params.file)

  const { data } = await httpClient.put<EmployeeCertificationDTO>(ASSOCIATE_PROFILE_API.updateCertification(id), form)
  return data
}

async function certificationDocumentUrl(id: number): Promise<string> {
  const response = await httpClient.get(ASSOCIATE_PROFILE_API.certificationDocument(id), { responseType: 'blob' })
  return URL.createObjectURL(response.data as Blob)
}

async function removeCertification(id: number): Promise<void> {
  await httpClient.delete(ASSOCIATE_PROFILE_API.removeCertification(id))
}

async function getPreferences(): Promise<EmployeePreferenceDTO> {
  const { data } = await httpClient.get<EmployeePreferenceDTO>(ASSOCIATE_PROFILE_API.preferences)
  return data
}

async function updatePreferences(payload: UpdateEmployeePreferenceRequest): Promise<EmployeePreferenceDTO> {
  const { data } = await httpClient.put<EmployeePreferenceDTO>(ASSOCIATE_PROFILE_API.preferences, payload)
  return data
}

async function getAvailability(): Promise<EmployeeAvailabilityDTO[]> {
  const { data } = await httpClient.get<EmployeeAvailabilityDTO[]>(ASSOCIATE_PROFILE_API.availability)
  return data
}

async function requestUnavailability(payload: RequestUnavailabilityRequest): Promise<EmployeeAvailabilityDTO> {
  const { data } = await httpClient.post<EmployeeAvailabilityDTO>(
    ASSOCIATE_PROFILE_API.requestUnavailability,
    payload,
  )
  return data
}

async function cancelUnavailabilityRequest(id: number): Promise<EmployeeAvailabilityDTO> {
  const { data } = await httpClient.post<EmployeeAvailabilityDTO>(
    ASSOCIATE_PROFILE_API.cancelUnavailabilityRequest(id),
  )
  return data
}

async function returnEarly(): Promise<EmployeeAvailabilityDTO> {
  const { data } = await httpClient.post<EmployeeAvailabilityDTO>(ASSOCIATE_PROFILE_API.returnEarly)
  return data
}

export const associateProfileService = {
  getProfile,
  updateProfile,
  listSkills,
  addSkill,
  updateSkill,
  removeSkill,
  listCertifications,
  addCertification,
  updateCertification,
  certificationDocumentUrl,
  removeCertification,
  getPreferences,
  updatePreferences,
  getAvailability,
  requestUnavailability,
  cancelUnavailabilityRequest,
  returnEarly,
}
