import { RMG_BENCH_API } from '../apis'
import { httpClient } from '../httpClient'

export interface BenchEntryDTO {
  employeeId: string
  name: string
  designation?: string
  grade?: string
  departmentName?: string
  benchStartDate?: string
  pausedDays?: number
  daysOnBench: number
  benchStatus: 'GREEN' | 'AMBER' | 'RED' | string
}

export interface BenchHistoryEntryDTO {
  benchStartDate: string
  benchEndDate?: string
  daysOnBench?: number
  pausedDays?: number
  benchStatus: string
  isCurrent: boolean
}

export interface BenchDetailDTO {
  employeeId: string
  name: string
  history: BenchHistoryEntryDTO[]
}

export interface BenchSummaryDTO {
  green: number
  amber: number
  red: number
  total: number
}

async function list(benchStatus?: string): Promise<BenchEntryDTO[]> {
  const { data } = await httpClient.get<BenchEntryDTO[]>(RMG_BENCH_API.list, { params: { benchStatus } })
  return data
}

async function summary(): Promise<BenchSummaryDTO> {
  const { data } = await httpClient.get<BenchSummaryDTO>(RMG_BENCH_API.summary)
  return data
}

async function detail(employeeId: string): Promise<BenchDetailDTO> {
  const { data } = await httpClient.get<BenchDetailDTO>(RMG_BENCH_API.byId(employeeId))
  return data
}

export const rmgBenchService = { list, summary, detail }
