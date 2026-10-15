import { useRef, useState } from 'react'
import { getErrorMessage } from '../api/client'
import { useNotifications } from './useNotifications'

interface ActionOptions<Result> {
  successMessage: (result: Result) => string
  onSuccess?: (result: Result) => void
}

export interface Action<Args extends unknown[], Result> {
  run: (...args: Args) => Promise<Result | undefined>
  isPending: boolean
}

export function useAction<Args extends unknown[], Result>(
  action: (...args: Args) => Promise<Result>,
  { successMessage, onSuccess }: ActionOptions<Result>,
): Action<Args, Result> {
  const { notify } = useNotifications()
  const pendingRef = useRef(false)
  const [isPending, setIsPending] = useState(false)

  async function run(...args: Args): Promise<Result | undefined> {
    if (pendingRef.current) return undefined
    pendingRef.current = true
    setIsPending(true)
    try {
      const result = await action(...args)
      notify('success', successMessage(result))
      onSuccess?.(result)
      return result
    } catch (error) {
      notify('error', getErrorMessage(error))
      return undefined
    } finally {
      pendingRef.current = false
      setIsPending(false)
    }
  }

  return { run, isPending }
}
