import { ASSOCIATE_WORK_API } from '../apis'
import type { CandidateDTO } from '../manager/candidate.service'
import { httpClient } from '../httpClient'

/** A published requirement, with the associate's own candidacy on it when they have one. */
export interface OpenRequirementDTO {
  requirementId: string
  positionTitle: string
  description?: string
  projectId: string
  projectName: string
  managerName?: string
  requiredSkills?: string
  requiredCertifications?: string
  minExperience?: number
  maxExperience?: number
  priority?: string
  allocationStartDate?: string
  allocationEndDate?: string
  myApplicationId?: string
  myStatus?: string
}

export interface TeamPersonDTO {
  employeeId: string
  name: string
  designation?: string
  email?: string
  role?: string
  hoursPerDay?: number
  me: boolean
}

export interface MyProjectDTO {
  projectId: string
  projectName: string
  clientName?: string
  description?: string
  status?: string
  projectStartDate?: string
  projectEndDate?: string
  managerName?: string
  managerEmployeeId?: string
  managerEmail?: string
  myHoursPerDay?: number
  myStartDate?: string
  myEndDate?: string
  myRole?: string
  myWorkingHoursPerDay?: number
  team: TeamPersonDTO[]
}

export type Responsibility = 'SOURCER' | 'COORDINATOR' | 'INTERVIEWER'

export interface DutyDTO {
  requirementId: string
  positionTitle: string
  projectName: string
  requirementStatus: string
  responsibility: Responsibility
  toShortlist: number
  toInvite: number
  toBook: number
  upcomingInterviews: number
  feedbackDue: number
}

export interface OpenTrainingDTO {
  programId: string
  programName: string
  description?: string
  durationDays?: number
  trainingType?: string
  provider?: string
  requiredCertifications?: string
  myAssignmentId?: string
  myStatus?: string
  /** Seats in the program; absent when it has no limit. */
  maxParticipants?: number
  seatsTaken?: number
}

export interface TrainingAssignmentDTO {
  assignmentId: string
  programId: string
  programName: string
  assignmentStatus: string
  startDate?: string
  expectedEndDate?: string
  actualEndDate?: string
  completionStatus?: string
  score?: number
  assignedByName?: string
  assignedAt?: string
}

async function openRequirements(): Promise<OpenRequirementDTO[]> {
  const { data } = await httpClient.get<OpenRequirementDTO[]>(ASSOCIATE_WORK_API.requirements)
  return data
}

async function apply(requirementId: string): Promise<CandidateDTO> {
  const { data } = await httpClient.post<CandidateDTO>(ASSOCIATE_WORK_API.apply(requirementId))
  return data
}

async function withdraw(applicationId: string): Promise<CandidateDTO> {
  const { data } = await httpClient.put<CandidateDTO>(ASSOCIATE_WORK_API.withdraw(applicationId))
  return data
}

async function myProjects(): Promise<MyProjectDTO[]> {
  const { data } = await httpClient.get<MyProjectDTO[]>(ASSOCIATE_WORK_API.myProjects)
  return data
}

async function duties(): Promise<DutyDTO[]> {
  const { data } = await httpClient.get<DutyDTO[]>(ASSOCIATE_WORK_API.duties)
  return data
}

async function trainings(): Promise<OpenTrainingDTO[]> {
  const { data } = await httpClient.get<OpenTrainingDTO[]>(ASSOCIATE_WORK_API.trainings)
  return data
}

async function requestTraining(programId: string): Promise<TrainingAssignmentDTO> {
  const { data } = await httpClient.post<TrainingAssignmentDTO>(ASSOCIATE_WORK_API.trainingInterest(programId))
  return data
}

async function trainingAssignments(): Promise<TrainingAssignmentDTO[]> {
  const { data } = await httpClient.get<TrainingAssignmentDTO[]>(ASSOCIATE_WORK_API.trainingAssignments)
  return data
}

export const associateWorkService = {
  openRequirements,
  apply,
  withdraw,
  myProjects,
  duties,
  trainings,
  requestTraining,
  trainingAssignments,
}
