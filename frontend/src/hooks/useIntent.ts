import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'

export type Intent = 'createClub' | 'playMatch' | 'browseFreePlayers'

export function hasIntent(state: unknown, intent: Intent): boolean {
  return typeof state === 'object' && state !== null && intent in state
}

export function intentState(intent: Intent): Partial<Record<Intent, true>> {
  return { [intent]: true as const }
}

export function useIntentToggle(intent: Intent): [boolean, (isOpen: boolean) => void] {
  const location = useLocation()
  const intentKey = hasIntent(location.state, intent) ? location.key : undefined
  const [toggle, setToggle] = useState({ isOpen: intentKey !== undefined, seenKey: intentKey })

  if (intentKey !== undefined && intentKey !== toggle.seenKey) {
    setToggle({ isOpen: true, seenKey: intentKey })
  }

  const setOpen = useCallback(
    (isOpen: boolean) => setToggle((current) => ({ ...current, isOpen })),
    [],
  )
  return [toggle.isOpen, setOpen]
}
