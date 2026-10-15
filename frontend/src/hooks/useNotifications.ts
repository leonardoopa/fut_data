import { createContext, useContext } from 'react'

export type NotificationType = 'success' | 'error'

export interface Notifications {
  notify: (type: NotificationType, message: string) => void
}

export const NotificationsContext = createContext<Notifications | null>(null)

export function useNotifications(): Notifications {
  const notifications = useContext(NotificationsContext)
  if (!notifications) {
    throw new Error('useNotifications precisa estar dentro de NotificationsProvider.')
  }
  return notifications
}
