import { useCallback, useRef, useState } from 'react'
import { ApiError, getErrorMessage } from '../api/client'
import { useLeagueReload } from './useLeague'
import { useNotifications, type NotificationContent } from './useNotifications'

export interface ActionError {
  message: string
  isNetworkError: boolean
}

interface ActionOptions<Result> {
  success: (result: Result) => NotificationContent
  errorToastTitle?: string
  changesLeague?: boolean
  onSuccess?: (result: Result) => void
}

export interface Action<Args extends unknown[], Result> {
  run: (...args: Args) => Promise<Result | undefined>
  isPending: boolean
  error: ActionError | undefined
  clearError: () => void
}

function toActionError(error: unknown): ActionError {
  return {
    message: getErrorMessage(error),
    isNetworkError: error instanceof ApiError && error.status === 0,
  }
}

export function useAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
  { success, errorToastTitle, changesLeague = true, onSuccess }: ActionOptions<Result>,
): Action<Args, Result> {
  const { notify } = useNotifications()
  const reloadLeague = useLeagueReload()
  const pendingRef = useRef(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<ActionError>()
  const clearError = useCallback(() => setError(undefined), [])

  async function run(...args: Args): Promise<Result | undefined> {
    if (pendingRef.current) return undefined
    pendingRef.current = true
    setIsPending(true)
    setError(undefined)
    try {
      const result = await action(...args)
      notify('success', success(result))
      if (changesLeague) reloadLeague?.()
      onSuccess?.(result)
      return result
    } catch (caught) {
      const actionError = toActionError(caught)
      setError(actionError)
      if (errorToastTitle) notify('error', { title: errorToastTitle, message: actionError.message })
      return undefined
    } finally {
      pendingRef.current = false
      setIsPending(false)
    }
  }

  return { run, isPending, error, clearError }
}
