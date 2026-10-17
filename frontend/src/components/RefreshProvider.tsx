import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { RefreshContext, type Refresh } from '../hooks/useRefresh'

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const refresh = useCallback(() => setVersion((current) => current + 1), [])
  const value = useMemo<Refresh>(() => ({ version, refresh }), [version, refresh])

  return <RefreshContext value={value}>{children}</RefreshContext>
}
