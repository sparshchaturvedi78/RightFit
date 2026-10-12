import { TRAINING_API } from '../apis'
import { httpClient } from '../httpClient'

export interface TrainingProgramDTO {
  programId: string
  programName: string
  description?: string
  durationDays?: number
  trainingType?: string
  provider?: string
  cost?: number
  requiredCertifications?: string
  isActive: boolean
}

export interface CreateTrainingProgramRequest {
  programName: string
  description?: string
  durationDays?: number
  trainingType?: string
  provider?: string
  cost?: number
  requiredCertifications?: string
}

export type UpdateTrainingProgramRequest = Partial<CreateTrainingProgramRequest>

export interface AssignTrainingRequest {
  employeeIds: string[]
  /** Optional - links this assignment to the rejection that prompted it. */
  rejectionId?: string
  startDate?: string
  expectedEndDate?: string
}

export interface UpdateTrainingAssignmentRequest {
  assignmentStatus?: string
  completionStatus?: string
  score?: number
  certificateId?: string
  actualEndDate?: string
}

export interface TrainingAssignmentDTO {
  assignmentId: string
  employeeId: string
  employeeName?: string
  programId: string
  programName?: string
  rejectionId?: string
  assignmentStatus: string
  startDate?: string
  expectedEndDate?: string
  actualEndDate?: string
  completionStatus?: string
  score?: number
  certificateId?: string
  assignedByName?: string
  assignedAt?: string
}

// Programs (RMG manages)
async function listPrograms(): Promise<TrainingProgramDTO[]> {
  const { data } = await httpClient.get<TrainingProgramDTO[]>(TRAINING_API.listPrograms)
  return data
}

async function createProgram(payload: CreateTrainingProgramRequest): Promise<TrainingProgramDTO> {
  const { data } = await httpClient.post<TrainingProgramDTO>(TRAINING_API.createProgram, payload)
  return data
}

async function updateProgram(programId: string, payload: UpdateTrainingProgramRequest): Promise<TrainingProgramDTO> {
  const { data } = await httpClient.put<TrainingProgramDTO>(TRAINING_API.updateProgram(programId), payload)
  return data
}

async function retireProgram(programId: string): Promise<TrainingProgramDTO> {
  const { data } = await httpClient.put<TrainingProgramDTO>(TRAINING_API.retireProgram(programId))
  return data
}

// Assignments
async function assign(programId: string, payload: AssignTrainingRequest): Promise<TrainingAssignmentDTO[]> {
  const { data } = await httpClient.post<TrainingAssignmentDTO[]>(TRAINING_API.assign(programId), payload)
  return data
}

async function listAssignments(): Promise<TrainingAssignmentDTO[]> {
  const { data } = await httpClient.get<TrainingAssignmentDTO[]>(TRAINING_API.listAssignments)
  return data
}

async function updateAssignment(
  assignmentId: string,
  payload: UpdateTrainingAssignmentRequest,
): Promise<TrainingAssignmentDTO> {
  const { data } = await httpClient.put<TrainingAssignmentDTO>(TRAINING_API.updateAssignment(assignmentId), payload)
  return data
}

// Associate side
async function myAssignments(): Promise<TrainingAssignmentDTO[]> {
  const { data } = await httpClient.get<TrainingAssignmentDTO[]>(TRAINING_API.associateAssignments)
  return data
}

export const trainingService = {
  listPrograms,
  createProgram,
  updateProgram,
  retireProgram,
  assign,
  listAssignments,
  updateAssignment,
  myAssignments,
}
