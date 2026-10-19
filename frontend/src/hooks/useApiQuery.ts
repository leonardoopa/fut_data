import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorMessage } from '../api/client'
import { useRefresh } from './useRefresh'

interface QueryKey<T> {
  fetcher: () => Promise<T>
  version: number
  refreshVersion: number
}

interface QueryResult<T> extends QueryKey<T> {
  data?: T
  error?: string
}

export interface ApiQuery<T> {
  data: T | undefined
  error: string | undefined
  isLoading: boolean
  reload: () => void
  revalidate: () => void
}

function isSameKey<T>(result: QueryResult<T> | undefined, key: QueryKey<T>): boolean {
  return (
    result?.fetcher === key.fetcher &&
    result.version === key.version &&
    result.refreshVersion === key.refreshVersion
  )
}

export function useApiQuery<T>(fetcher: (() => Promise<T>) | null): ApiQuery<T> {
  const { version: refreshVersion } = useRefresh()
  const [version, setVersion] = useState(0)
  const [result, setResult] = useState<QueryResult<T>>()
  const hasResult = useRef(false)

  useEffect(() => {
    hasResult.current = result !== undefined
  }, [result])

  useEffect(() => {
    if (!fetcher) return
    let isCurrent = true
    const key = { fetcher, version, refreshVersion }
    new Promise<T>((resolve) => resolve(fetcher())).then(
      (data) => isCurrent && setResult({ ...key, data }),
      (error: unknown) => isCurrent && setResult({ ...key, error: getErrorMessage(error) }),
    )
    return () => {
      isCurrent = false
    }
  }, [fetcher, version, refreshVersion])

  const reload = useCallback(() => setVersion((current) => current + 1), [])
  // Busca de novo só o que já foi carregado; na primeira carga a busca inicial já está em curso.
  const revalidate = useCallback(() => {
    if (hasResult.current) reload()
  }, [reload])
  const isLoading = fetcher !== null && !isSameKey(result, { fetcher, version, refreshVersion })

  return {
    data: result?.fetcher === fetcher ? result.data : undefined,
    error: isLoading ? undefined : result?.error,
    isLoading,
    reload,
    revalidate,
  }
}
