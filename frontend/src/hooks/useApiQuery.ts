import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/client'

interface QueryResult<T> {
  fetcher: () => Promise<T>
  version: number
  data?: T
  error?: string
}

export interface ApiQuery<T> {
  data: T | undefined
  error: string | undefined
  isLoading: boolean
  reload: () => void
}

export function useApiQuery<T>(fetcher: () => Promise<T>): ApiQuery<T> {
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<QueryResult<T>>()

  useEffect(() => {
    let isCurrent = true
    fetcher().then(
      (data) => isCurrent && setResult({ fetcher, version, data }),
      (error: unknown) =>
        isCurrent && setResult({ fetcher, version, error: getErrorMessage(error) }),
    )
    return () => {
      isCurrent = false
    }
  }, [fetcher, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  const isLoading = result?.fetcher !== fetcher || result.version !== version

  return {
    data: result?.data,
    error: isLoading ? undefined : result?.error,
    isLoading,
    reload,
  }
}
