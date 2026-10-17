import type { ReactNode } from 'react'
import { LeagueContext, useLeagueData } from '../hooks/useLeague'

export function LeagueProvider({ children }: { children: ReactNode }) {
  return <LeagueContext value={useLeagueData()}>{children}</LeagueContext>
}
