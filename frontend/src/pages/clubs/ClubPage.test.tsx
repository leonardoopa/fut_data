import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import {
  exportClubTransactions,
  getClub,
  getClubLineup,
  listClubTransactions,
} from '../../api/clubs'
import { sellPlayer } from '../../api/players'
import {
  makeClubDetails,
  makeHistory,
  makeLineup,
  makeSale,
  makeSquadPlayer,
  makeTransaction,
} from '../../test/fixtures'
import { rowOf, summaryValue } from '../../test/queries'
import { renderWithProviders } from '../../test/render'
import { ClubPage } from './ClubPage'

vi.mock('../../api/clubs')
vi.mock('../../api/players')

const GOALKEEPER = makeSquadPlayer({ id: 7, name: 'Paredão', position: 'GOL' })
const MIDFIELDER = makeSquadPlayer()
const PURCHASE = makeTransaction()
const SALE = makeTransaction({
  id: 2,
  player_id: 7,
  player_name: 'Paredão',
  type: 'VENDA',
  value: 40,
  fee: 0.3,
  penalty: 4,
  profit: 3,
  cash_change: 35.7,
  created_at: '2026-10-15T09:05:00-03:00',
})

async function renderPage() {
  const user = userEvent.setup()
  renderWithProviders(<ClubPage />, { path: '/clubs/:clubId', url: '/clubs/2' })
  await screen.findByRole('cell', { name: MIDFIELDER.name })
  return user
}

async function openHistory(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('tab', { name: 'Histórico de transações' }))
  await screen.findByRole('cell', { name: 'Paredão' })
}

function lastHistoryQuery() {
  return vi.mocked(listClubTransactions).mock.lastCall
}

beforeEach(() => {
  vi.mocked(getClub).mockResolvedValue(makeClubDetails([GOALKEEPER, MIDFIELDER]))
  vi.mocked(listClubTransactions).mockResolvedValue(makeHistory([SALE, PURCHASE]))
  vi.mocked(getClubLineup).mockResolvedValue(makeLineup())
})

describe('ClubPage squad', () => {
  it('shows the club finances and the squad with the contract columns', async () => {
    await renderPage()

    expect(getClub).toHaveBeenCalledWith(2)
    expect(screen.getByRole('heading', { name: 'Alfa FC (ALF)' })).toBeInTheDocument()
    expect(summaryValue('Caixa')).toBe('282,00')
    expect(summaryValue('Valor do elenco')).toBe('18,00')
    expect(summaryValue('Patrimônio')).toBe('300,00')

    const names = screen.getAllByRole('row').slice(1)
    expect(names.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      'Paredão',
      'Meia Lua',
    ])
    const row = rowOf(MIDFIELDER.name)
    expect(row.getByText('3,50')).toBeInTheDocument()
    expect(row.getByText('3,00')).toBeInTheDocument()
    expect(row.getByText(/^10\/01\/2027,? 10:00$/)).toBeInTheDocument()
    expect(row.getByText('87')).toBeInTheDocument()
    expect(row.getByText('10%')).toBeInTheDocument()
  })

  it('shows the API message when the club does not exist', async () => {
    vi.mocked(getClub).mockRejectedValue(new ApiError('Clube não encontrado.', 404))
    renderWithProviders(<ClubPage />, { path: '/clubs/:clubId', url: '/clubs/99' })

    expect(await screen.findByRole('alert')).toHaveTextContent('Clube não encontrado.')
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('sells after confirmation with one request and shows the result from the API', async () => {
    vi.mocked(sellPlayer).mockResolvedValue(makeSale())
    const user = await renderPage()
    const clubCalls = vi.mocked(getClub).mock.calls.length
    const historyCalls = vi.mocked(listClubTransactions).mock.calls.length

    await user.click(rowOf(MIDFIELDER.name).getByRole('button', { name: /Vender/ }))
    const dialog = within(screen.getByRole('dialog', { name: 'Vender jogador' }))
    expect(sellPlayer).not.toHaveBeenCalled()
    vi.mocked(getClub).mockResolvedValue(makeClubDetails([GOALKEEPER]))
    await user.dblClick(dialog.getByRole('button', { name: 'Vender' }))

    expect(sellPlayer).toHaveBeenCalledOnce()
    expect(sellPlayer).toHaveBeenCalledWith(MIDFIELDER.id)
    const result = await screen.findByRole('dialog', { name: 'Venda concluída' })
    expect(summaryValue('Valor de compra', result)).toBe('37,00')
    expect(summaryValue('Valor de venda', result)).toBe('40,00')
    expect(summaryValue('Dias restantes', result)).toBe('87')
    expect(summaryValue('Multa', result)).toBe('4,00 (10%)')
    expect(summaryValue('Lucro', result)).toBe('+3,00')
    expect(summaryValue('Comissão', result)).toBe('0,30')
    expect(summaryValue('Crédito', result)).toBe('+35,70')
    expect(summaryValue('Novo caixa', result)).toBe('317,70')
    expect(screen.getByText('Venda de "Meia Lua" concluída.')).toBeInTheDocument()

    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: MIDFIELDER.name })).not.toBeInTheDocument(),
    )
    expect(vi.mocked(getClub).mock.calls.length).toBeGreaterThan(clubCalls)
    expect(vi.mocked(listClubTransactions).mock.calls.length).toBeGreaterThan(historyCalls)
  })
})

describe('ClubPage history', () => {
  it('shows the transactions with signed cash changes and the summary from the API', async () => {
    const user = await renderPage()
    await openHistory(user)

    expect(listClubTransactions).toHaveBeenCalledWith(2, { types: [] })
    const sale = rowOf('Paredão')
    expect(sale.getByText('Venda')).toBeInTheDocument()
    expect(sale.getByText(/^15\/10\/2026,? 09:05$/)).toBeInTheDocument()
    expect(sale.getByText('+3,00')).toBeInTheDocument()
    expect(sale.getByText('+35,70')).toBeInTheDocument()
    const purchase = rowOf('Meia Lua')
    expect(purchase.getByText('Compra')).toBeInTheDocument()
    expect(purchase.getByText('—')).toBeInTheDocument()
    expect(purchase.getByText('-38,85')).toBeInTheDocument()

    expect(summaryValue('Total pago em compras')).toBe('138,85')
    expect(summaryValue('Total recebido em vendas')).toBe('135,70')
    expect(summaryValue('Total de taxas e comissões')).toBe('12,15')
    expect(summaryValue('Total de multas')).toBe('14,00')
    expect(summaryValue('Lucro total')).toBe('-3,00')
  })

  it('sends the chosen types and player, offering the players of the history', async () => {
    const user = await renderPage()
    await openHistory(user)

    const playerSelect = screen.getByLabelText('Jogador')
    expect(
      within(playerSelect)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Todos', 'Meia Lua', 'Paredão'])

    vi.mocked(listClubTransactions).mockResolvedValue(makeHistory([SALE]))
    await user.click(screen.getByLabelText('Venda'))
    await user.selectOptions(playerSelect, 'Paredão')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() => expect(lastHistoryQuery()).toEqual([2, { types: ['VENDA'], player_id: 7 }]))
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: 'Meia Lua' })).not.toBeInTheDocument(),
    )
    expect(within(playerSelect).getAllByRole('option')).toHaveLength(3)
  })

  it('shows the API message when the filter is refused', async () => {
    const user = await renderPage()
    await openHistory(user)
    vi.mocked(listClubTransactions).mockRejectedValueOnce(
      new ApiError('Jogador não encontrado.', 404),
    )

    await user.selectOptions(screen.getByLabelText('Jogador'), 'Meia Lua')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Jogador não encontrado.')
    expect(screen.queryByText('Lucro total')).not.toBeInTheDocument()
  })

  it('downloads the CSV with the applied filters', async () => {
    vi.mocked(exportClubTransactions).mockResolvedValue('transacoes-clube-2.csv')
    const user = await renderPage()
    await openHistory(user)

    await user.click(screen.getByLabelText('Compra'))
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    await screen.findByRole('cell', { name: 'Paredão' })
    await user.dblClick(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(exportClubTransactions).toHaveBeenCalledOnce()
    expect(exportClubTransactions).toHaveBeenCalledWith(2, { types: ['COMPRA'] })
    expect(await screen.findByText('Arquivo "transacoes-clube-2.csv" baixado.')).toBeInTheDocument()
  })

  it('shows the API message when the export is refused', async () => {
    vi.mocked(exportClubTransactions).mockRejectedValue(
      new ApiError('Jogador não encontrado.', 404),
    )
    const user = await renderPage()
    await openHistory(user)

    await user.click(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Jogador não encontrado.')
  })
})
