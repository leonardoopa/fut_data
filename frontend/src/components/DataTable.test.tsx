import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './DataTable'

interface Row {
  id: number
  name: string
  team: string
}

const COLUMNS: Column<Row>[] = [{ key: 'name', header: 'Nome', render: (row) => row.name }]
const ROWS: Row[] = [
  { id: 1, name: 'Ana', team: 'Alfa' },
  { id: 2, name: 'Bia', team: 'Alfa' },
  { id: 3, name: 'Caio', team: 'Beta' },
]

function renderTable(props: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) {
  return render(
    <DataTable<Row>
      caption="Pessoas"
      columns={COLUMNS}
      rows={[]}
      getRowKey={(row) => row.id}
      isLoading={false}
      error={undefined}
      empty={{ icon: 'users', title: 'Nada por aqui', description: 'Cadastre a primeira pessoa.' }}
      {...props}
    />,
  )
}

describe('DataTable', () => {
  it('renders the header and one row per item', () => {
    renderTable({ rows: ROWS.slice(0, 2) })
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Ana' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: 'Bia' })).toBeInTheDocument()
  })

  it('shows the loading label and skeleton rows instead of the rows', () => {
    renderTable({ rows: ROWS, isLoading: true, loadingLabel: 'Carregando pessoas…' })
    expect(screen.getByRole('status')).toHaveTextContent('Carregando pessoas…')
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
  })

  it('shows the empty state with its description', () => {
    renderTable()
    expect(screen.getByRole('status')).toHaveTextContent('Nada por aqui')
    expect(screen.getByRole('status')).toHaveTextContent('Cadastre a primeira pessoa.')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows the error with a retry button', async () => {
    const onRetry = vi.fn()
    renderTable({ error: 'API fora do ar.', errorTitle: 'Não foi possível carregar', onRetry })
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar')
    expect(alert).toHaveTextContent('API fora do ar.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('groups consecutive rows under a header row', () => {
    renderTable({
      rows: ROWS,
      getGroup: (row) => ({ key: row.team, label: `Time ${row.team}` }),
    })
    const groups = screen.getAllByRole('columnheader').filter((header) => header.closest('tbody'))
    expect(groups.map((group) => group.textContent)).toEqual(['Time Alfa', 'Time Beta'])
    const rows = within(screen.getByRole('table')).getAllByRole('row')
    expect(rows.map((row) => row.textContent)).toEqual([
      'Nome',
      'Time Alfa',
      'Ana',
      'Bia',
      'Time Beta',
      'Caio',
    ])
  })
})
