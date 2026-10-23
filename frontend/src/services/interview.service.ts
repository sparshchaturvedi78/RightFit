import { INTERVIEW_API } from './apis'
import { httpClient } from './httpClient'

export interface FeedbackDTO {
  rating: number
  technicalScore?: number
  communicationScore?: number
  culturalFitScore?: number
  recommendation: 'SELECT' | 'REJECT' | 'ON_HOLD' | string
  comments?: string
  givenByName?: string
  createdAt?: string
}

export interface InterviewDTO {
  id: number
  interviewId: string
  applicationId: string
  requirementId?: string
  projectId?: string
  employeeId: string
  employeeName?: string
  interviewerId?: string
  interviewerName?: string
  scheduledByName?: string
  roundNumber?: number
  scheduledAt: string
  durationMinutes?: number
  mode?: 'ONLINE' | 'IN_PERSON' | 'PHONE' | string
  locationOrLink?: string
  notes?: string
  status: string
  candidateResponseAt?: string
  candidateResponseComment?: string
  completedAt?: string
  cancelledReason?: string
  feedback?: FeedbackDTO
}

export interface ScheduleInterviewRequest {
  /** Defaults to the project's owning Manager. */
  interviewerEmployeeId?: string
  scheduledAt: string
  durationMinutes?: number
  mode?: 'ONLINE' | 'IN_PERSON' | 'PHONE'
  locationOrLink?: string
  notes?: string
}

export interface InterviewResponseRequest {
  response: 'ACCEPT' | 'DECLINE'
  comment?: string
}

export interface SubmitFeedbackRequest {
  rating: number
  technicalScore?: number
  communicationScore?: number
  culturalFitScore?: number
  /** Advisory only - the Manager makes the final decision. */
  recommendation: 'SELECT' | 'REJECT' | 'ON_HOLD'
  comments?: string
}

// Manager side
async function schedule(applicationId: string, payload: ScheduleInterviewRequest): Promise<InterviewDTO> {
  const { data } = await httpClient.post<InterviewDTO>(INTERVIEW_API.schedule(applicationId), payload)
  return data
}

async function listForApplication(applicationId: string): Promise<InterviewDTO[]> {
  const { data } = await httpClient.get<InterviewDTO[]>(INTERVIEW_API.listForApplication(applicationId))
  return data
}

async function mine(): Promise<InterviewDTO[]> {
  const { data } = await httpClient.get<InterviewDTO[]>(INTERVIEW_API.mine)
  return data
}

/** Free start times (ISO, local) for an interview of the given length, from now on. */
async function suggestSlots(applicationId: string, durationMinutes: number): Promise<string[]> {
  const { data } = await httpClient.get<string[]>(INTERVIEW_API.suggestSlots(applicationId), { params: { durationMinutes } })
  return data
}

/** Every interview on the manager's requirements, newest first. */
/** Interviews on the requirements the signed-in person coordinates or interviews on. */
async function dutyInterviews(): Promise<InterviewDTO[]> {
  const { data } = await httpClient.get<InterviewDTO[]>(INTERVIEW_API.dutyInterviews)
  return data
}

/** Sets or clears the meeting link on an open interview; the candidate is told. */
async function setLink(interviewId: string, locationOrLink: string): Promise<InterviewDTO> {
  const { data } = await httpClient.put<InterviewDTO>(INTERVIEW_API.setLink(interviewId), { locationOrLink })
  return data
}

async function managerList(): Promise<InterviewDTO[]> {
  const { data } = await httpClient.get<InterviewDTO[]>(INTERVIEW_API.managerList)
  return data
}

async function byId(interviewId: string): Promise<InterviewDTO> {
  const { data } = await httpClient.get<InterviewDTO>(INTERVIEW_API.byId(interviewId))
  return data
}

async function cancel(interviewId: string, reason: string): Promise<InterviewDTO> {
  const { data } = await httpClient.put<InterviewDTO>(INTERVIEW_API.cancel(interviewId), { reason })
  return data
}

async function submitFeedback(interviewId: string, payload: SubmitFeedbackRequest): Promise<InterviewDTO> {
  const { data } = await httpClient.post<InterviewDTO>(INTERVIEW_API.feedback(interviewId), payload)
  return data
}

// Associate side
async function associateList(): Promise<InterviewDTO[]> {
  const { data } = await httpClient.get<InterviewDTO[]>(INTERVIEW_API.associateList)
  return data
}

async function associateRespond(interviewId: string, payload: InterviewResponseRequest): Promise<InterviewDTO> {
  const { data } = await httpClient.put<InterviewDTO>(INTERVIEW_API.associateRespond(interviewId), payload)
  return data
}

export const interviewService = {
  schedule,
  listForApplication,
  mine,
  managerList,
  dutyInterviews,
  setLink,
  suggestSlots,
  byId,
  cancel,
  submitFeedback,
  associateList,
  associateRespond,
}
