import { Button } from './Button'

const PAGE_WINDOW = 1

interface PaginationProps {
  page: number
  pageSize: number
  pageItems: number
  totalPages: number
  totalItems: number
  itemLabel: { one: string; other: string }
  disabled?: boolean
  onPageChange: (page: number) => void
}

type PageSlot = number | 'gap-start' | 'gap-end'

function pageSlots(page: number, lastPage: number): PageSlot[] {
  const slots: PageSlot[] = []
  for (let current = 1; current <= lastPage; current++) {
    const isEdge = current === 1 || current === lastPage
    if (isEdge || Math.abs(current - page) <= PAGE_WINDOW) slots.push(current)
    else if (current < page && !slots.includes('gap-start')) slots.push('gap-start')
    else if (current > page && !slots.includes('gap-end')) slots.push('gap-end')
  }
  return slots
}

export function Pagination({
  page,
  pageSize,
  pageItems,
  totalPages,
  totalItems,
  itemLabel,
  disabled = false,
  onPageChange,
}: PaginationProps) {
  const lastPage = Math.max(totalPages, 1)
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const last = totalItems === 0 ? 0 : first + pageItems - 1
  const label = totalItems === 1 ? itemLabel.one : itemLabel.other

  return (
    <nav className="pagination" aria-label="Paginação">
      <p className="pagination__total">
        Mostrando {first}–{last} de {totalItems} {label}
      </p>
      <div className="pagination__controls">
        <Button
          variant="ghost"
          size="sm"
          icon="chevronLeft"
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        {pageSlots(page, lastPage).map((slot) =>
          typeof slot === 'number' ? (
            <button
              key={slot}
              type="button"
              className="pagination__page"
              aria-label={`Página ${slot}`}
              aria-current={slot === page ? 'page' : undefined}
              disabled={disabled}
              onClick={() => onPageChange(slot)}
            >
              {slot}
            </button>
          ) : (
            <span key={slot} className="pagination__gap" aria-hidden="true">
              …
            </span>
          ),
        )}
        <Button
          variant="ghost"
          size="sm"
          trailingIcon="chevronRight"
          disabled={disabled || page >= lastPage}
          onClick={() => onPageChange(page + 1)}
        >
          Próxima
        </Button>
      </div>
    </nav>
  )
}
