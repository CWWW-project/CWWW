export interface NotificationPayload {
  notificationId: string
  eventType: string
  userId: number
  actorId: number
  actorName: string
  targetId: number
  targetType: string
  preview: string
  createdAt: string
}

export interface NotificationItem {
  id: string
  eventType: string
  actorId: number
  actorName: string
  targetId: number
  targetType: string
  preview: string
  createdAt: string
}
