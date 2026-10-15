import { Button } from './Button'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  itemLabel: { one: string; other: string }
  disabled?: boolean
  onPageChange: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  itemLabel,
  disabled = false,
  onPageChange,
}: PaginationProps) {
  const lastPage = Math.max(totalPages, 1)
  const label = totalItems === 1 ? itemLabel.one : itemLabel.other

  return (
    <nav className="pagination" aria-label="Paginação">
      <p className="pagination__total">
        {totalItems} {label}
      </p>
      <div className="pagination__controls">
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="pagination__current">
          Página {Math.min(page, lastPage)} de {lastPage}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </Button>
      </div>
    </nav>
  )
}
