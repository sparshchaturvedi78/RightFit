import { NOTIFICATION_API } from './apis'
import type { PageResponse } from './common.types'
import { httpClient } from './httpClient'

export interface NotificationDTO {
  id: number
  type: string
  title: string
  message: string
  entityType?: string
  entityRef?: string
  isRead: boolean
  readAt?: string
  createdAt: string
}

async function list(unreadOnly = false, page = 0, size = 20): Promise<PageResponse<NotificationDTO>> {
  const { data } = await httpClient.get<PageResponse<NotificationDTO>>(NOTIFICATION_API.list, {
    params: { unreadOnly, page, size },
  })
  return data
}

async function unreadCount(): Promise<number> {
  const { data } = await httpClient.get<{ unread: number }>(NOTIFICATION_API.unreadCount)
  return data.unread
}

async function markRead(notificationId: number): Promise<NotificationDTO> {
  const { data } = await httpClient.put<NotificationDTO>(NOTIFICATION_API.markRead(notificationId))
  return data
}

async function markAllRead(): Promise<number> {
  const { data } = await httpClient.put<{ updated: number }>(NOTIFICATION_API.markAllRead)
  return data.updated
}

export const notificationService = { list, unreadCount, markRead, markAllRead }
