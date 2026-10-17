import { createContext, useContext } from 'react'

export interface Refresh {
  version: number
  refresh: () => void
}

export const RefreshContext = createContext<Refresh>({ version: 0, refresh: () => undefined })

export function useRefresh(): Refresh {
  return useContext(RefreshContext)
}
