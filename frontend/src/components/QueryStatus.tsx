import { Button } from './Button'

export function LoadingIndicator() {
  return (
    <>
      <span className="spinner" aria-hidden="true" /> Carregando…
    </>
  )
}

interface ErrorDetailsProps {
  error: string
  onRetry?: () => void
}

export function ErrorDetails({ error, onRetry }: ErrorDetailsProps) {
  return (
    <>
      <p>{error}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </>
  )
}

interface QueryStatusProps {
  isLoading: boolean
  error: string | undefined
  onRetry?: () => void
}

export function QueryStatus({ isLoading, error, onRetry }: QueryStatusProps) {
  if (isLoading) {
    return (
      <div className="query-status" role="status">
        <LoadingIndicator />
      </div>
    )
  }
  if (!error) return null
  return (
    <div className="query-status query-status--error" role="alert">
      <ErrorDetails error={error} onRetry={onRetry} />
    </div>
  )
}
