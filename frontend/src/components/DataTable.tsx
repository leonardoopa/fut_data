import type { Key, ReactNode } from 'react'
import { ErrorDetails, LoadingIndicator } from './QueryStatus'

export interface Column<Row> {
  key: string
  header: string
  render: (row: Row) => ReactNode
  align?: 'start' | 'end'
}

interface DataTableProps<Row> {
  caption: string
  columns: Column<Row>[]
  rows: Row[] | undefined
  getRowKey: (row: Row) => Key
  isLoading: boolean
  error?: string
  emptyMessage: string
  onRetry?: () => void
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  isLoading,
  error,
  emptyMessage,
  onRetry,
}: DataTableProps<Row>) {
  function renderState(content: ReactNode, className: string, role?: 'status' | 'alert') {
    return (
      <tr>
        <td colSpan={columns.length} className={`data-table__state ${className}`} role={role}>
          {content}
        </td>
      </tr>
    )
  }

  function renderBody() {
    if (isLoading) {
      return renderState(<LoadingIndicator />, 'data-table__state--loading', 'status')
    }
    if (error) {
      return renderState(
        <ErrorDetails error={error} onRetry={onRetry} />,
        'data-table__state--error',
        'alert',
      )
    }
    if (!rows || rows.length === 0) {
      return renderState(emptyMessage, 'data-table__state--empty', 'status')
    }
    return rows.map((row) => (
      <tr key={getRowKey(row)}>
        {columns.map((column) => (
          <td key={column.key} className={column.align === 'end' ? 'cell--end' : undefined}>
            {column.render(row)}
          </td>
        ))}
      </tr>
    ))
  }

  return (
    <div className="data-table">
      <table aria-busy={isLoading}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.align === 'end' ? 'cell--end' : undefined}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{renderBody()}</tbody>
      </table>
    </div>
  )
}
