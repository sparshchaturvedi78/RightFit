import { ADMIN_BENCH_CONFIGURATION_API } from '../apis'
import { httpClient } from '../httpClient'

export interface BenchConfigurationDTO {
  id: number
  greenMaxDays: number
  amberMaxDays: number
  redThresholdDays: number
  effectiveFrom: string
  effectiveTo?: string
  isActive: boolean
}

export interface CreateBenchConfigurationRequest {
  greenMaxDays: number
  amberMaxDays: number
  redThresholdDays: number
  effectiveFrom?: string
}

async function current(): Promise<BenchConfigurationDTO> {
  const { data } = await httpClient.get<BenchConfigurationDTO>(ADMIN_BENCH_CONFIGURATION_API.current)
  return data
}

async function history(): Promise<BenchConfigurationDTO[]> {
  const { data } = await httpClient.get<BenchConfigurationDTO[]>(ADMIN_BENCH_CONFIGURATION_API.history)
  return data
}

async function create(payload: CreateBenchConfigurationRequest): Promise<BenchConfigurationDTO> {
  const { data } = await httpClient.post<BenchConfigurationDTO>(ADMIN_BENCH_CONFIGURATION_API.create, payload)
  return data
}

export const adminBenchConfigurationService = { current, history, create }
