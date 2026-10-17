import { Fragment, type Key, type ReactNode } from 'react'
import { ErrorState, LoadingState, StatePanel, type StateContent } from './StatePanel'

const DEFAULT_SKELETON_ROWS = 5

export interface Column<Row> {
  key: string
  header: ReactNode
  render: (row: Row) => ReactNode
  align?: 'start' | 'end' | 'center'
}

export interface RowGroup {
  key: string
  label: ReactNode
  meta?: ReactNode
}

interface DataTableProps<Row> {
  caption: string
  columns: Column<Row>[]
  rows: Row[] | undefined
  getRowKey: (row: Row) => Key
  isLoading: boolean
  loadingLabel?: string
  error?: string
  errorTitle?: string
  onRetry?: () => void
  empty: StateContent
  skeletonRows?: number
  getGroup?: (row: Row) => RowGroup
}

function alignClass(align: Column<unknown>['align']): string | undefined {
  return align && align !== 'start' ? `cell--${align}` : undefined
}

function groupRows<Row>(rows: Row[], getGroup: (row: Row) => RowGroup) {
  const groups: { group: RowGroup; rows: Row[] }[] = []
  for (const row of rows) {
    const group = getGroup(row)
    const current = groups[groups.length - 1]
    if (current?.group.key === group.key) current.rows.push(row)
    else groups.push({ group, rows: [row] })
  }
  return groups
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  getRowKey,
  isLoading,
  loadingLabel = 'Carregando…',
  error,
  errorTitle = 'Não foi possível carregar os dados',
  onRetry,
  empty,
  skeletonRows = DEFAULT_SKELETON_ROWS,
  getGroup,
}: DataTableProps<Row>) {
  if (!isLoading && error) {
    return <ErrorState title={errorTitle} error={error} onRetry={onRetry} />
  }
  if (!isLoading && (!rows || rows.length === 0)) {
    return <StatePanel {...empty} />
  }

  function renderRow(row: Row) {
    return (
      <tr key={getRowKey(row)}>
        {columns.map((column) => (
          <td key={column.key} className={alignClass(column.align)}>
            {column.render(row)}
          </td>
        ))}
      </tr>
    )
  }

  function renderSkeleton() {
    return Array.from({ length: skeletonRows }, (_, index) => (
      <tr key={index} className="data-table__skeleton" aria-hidden="true">
        {columns.map((column) => (
          <td key={column.key} className={alignClass(column.align)}>
            <span className="skeleton" />
          </td>
        ))}
      </tr>
    ))
  }

  function renderBody(loadedRows: Row[]) {
    if (!getGroup) return loadedRows.map(renderRow)
    return groupRows(loadedRows, getGroup).map(({ group, rows: groupedRows }) => (
      <Fragment key={group.key}>
        <tr className="data-table__group">
          <th scope="colgroup" colSpan={columns.length}>
            <span>{group.label}</span>
            {group.meta && <span className="data-table__group-meta">{group.meta}</span>}
          </th>
        </tr>
        {groupedRows.map(renderRow)}
      </Fragment>
    ))
  }

  return (
    <div className="data-table">
      {isLoading && <LoadingState label={loadingLabel} />}
      <div className="data-table__scroll">
        <table aria-busy={isLoading}>
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={alignClass(column.align)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{isLoading ? renderSkeleton() : renderBody(rows ?? [])}</tbody>
        </table>
      </div>
    </div>
  )
}
