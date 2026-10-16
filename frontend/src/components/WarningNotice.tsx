import type { ReactNode } from 'react'

export function WarningNotice({ children }: { children: ReactNode }) {
  return (
    <div className="warning-notice" role="status">
      {children}
    </div>
  )
}
