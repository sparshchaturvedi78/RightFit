/** Mirrors Spring Data's `Page<T>` JSON shape, returned by every paginated list endpoint. */
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface MessageResponse {
  message: string
}
