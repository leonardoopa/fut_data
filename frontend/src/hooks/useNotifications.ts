import { createContext, useContext } from 'react'

export type NotificationType = 'success' | 'error'

export interface NotificationContent {
  title: string
  message: string
}

export interface Notifications {
  notify: (type: NotificationType, content: NotificationContent) => void
}

export const NotificationsContext = createContext<Notifications | null>(null)

export function useNotifications(): Notifications {
  const notifications = useContext(NotificationsContext)
  if (!notifications) {
    throw new Error('useNotifications must be used inside NotificationsProvider.')
  }
  return notifications
}
