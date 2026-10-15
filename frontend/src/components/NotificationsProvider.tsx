import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  NotificationsContext,
  type NotificationType,
  type Notifications,
} from '../hooks/useNotifications'

const DISMISS_AFTER_MS: Record<NotificationType, number> = {
  success: 5000,
  error: 8000,
}

interface Notification {
  id: number
  type: NotificationType
  message: string
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const nextIdRef = useRef(1)

  const dismiss = useCallback((id: number) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }, [])

  const notify = useCallback(
    (type: NotificationType, message: string) => {
      const id = nextIdRef.current++
      setNotifications((current) => [...current, { id, type, message }])
      window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS[type])
    },
    [dismiss],
  )

  const value = useMemo<Notifications>(() => ({ notify }), [notify])

  return (
    <NotificationsContext value={value}>
      {children}
      <div className="notifications">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`notification notification--${notification.type}`}
            role={notification.type === 'error' ? 'alert' : 'status'}
          >
            <p>{notification.message}</p>
            <button
              type="button"
              className="notification__close"
              aria-label="Fechar aviso"
              onClick={() => dismiss(notification.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </NotificationsContext>
  )
}
