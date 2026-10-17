import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  NotificationsContext,
  type NotificationContent,
  type NotificationType,
  type Notifications,
} from '../hooks/useNotifications'
import { Icon } from './Icon'

const DISMISS_AFTER_MS: Record<NotificationType, number> = {
  success: 5000,
  error: 8000,
}

interface Notification extends NotificationContent {
  id: number
  type: NotificationType
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const nextIdRef = useRef(1)

  const dismiss = useCallback((id: number) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id))
  }, [])

  const notify = useCallback(
    (type: NotificationType, content: NotificationContent) => {
      const id = nextIdRef.current++
      setNotifications((current) => [...current, { id, type, ...content }])
      window.setTimeout(() => dismiss(id), DISMISS_AFTER_MS[type])
    },
    [dismiss],
  )

  const value = useMemo<Notifications>(() => ({ notify }), [notify])

  return (
    <NotificationsContext value={value}>
      {children}
      <div className="toasts">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`toast toast--${notification.type}`}
            role={notification.type === 'error' ? 'alert' : 'status'}
          >
            <Icon
              name={notification.type === 'error' ? 'alertCircle' : 'checkCircle'}
              className="toast__icon"
            />
            <div className="toast__content">
              <p className="toast__title">{notification.title}</p>
              <p className="toast__message">{notification.message}</p>
            </div>
            <button
              type="button"
              className="toast__close"
              aria-label="Fechar aviso"
              onClick={() => dismiss(notification.id)}
            >
              <Icon name="x" size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationsContext>
  )
}
