import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './DataTable'

interface Row {
  id: number
  name: string
}

const COLUMNS: Column<Row>[] = [{ key: 'name', header: 'Nome', render: (row) => row.name }]

function renderTable(props: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) {
  return render(
    <DataTable<Row>
      caption="Pessoas"
      columns={COLUMNS}
      rows={[]}
      getRowKey={(row) => row.id}
      isLoading={false}
      error={undefined}
      emptyMessage="Nada por aqui."
      {...props}
    />,
  )
}

describe('DataTable', () => {
  it('renders the header and one row per item', () => {
    renderTable({
      rows: [
        { id: 1, name: 'Ana' },
        { id: 2, name: 'Bia' },
      ],
    })
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Ana' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Bia' })).toBeInTheDocument()
  })

  it('shows the loading state instead of the rows', () => {
    renderTable({ rows: [{ id: 1, name: 'Ana' }], isLoading: true })
    expect(screen.getByRole('status')).toHaveTextContent('Carregando…')
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
  })

  it('shows the empty state', () => {
    renderTable()
    expect(screen.getByRole('status')).toHaveTextContent('Nada por aqui.')
  })

  it('shows the error with a retry button', async () => {
    const onRetry = vi.fn()
    renderTable({ error: 'API fora do ar.', onRetry })
    expect(screen.getByRole('alert')).toHaveTextContent('API fora do ar.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
