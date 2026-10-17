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
vi.mock('../../api/matches')

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

type User = ReturnType<typeof userEvent.setup>

async function renderPage() {
  const user = userEvent.setup()
  renderWithProviders(<ClubPage />, { path: '/clubs/:clubId', url: '/clubs/2' })
  await screen.findByRole('button', { name: `Vender ${MIDFIELDER.name}` })
  return user
}

async function openHistory(user: User) {
  await user.click(screen.getByRole('tab', { name: /^Histórico/ }))
  await screen.findAllByText('Paredão')
}

function historyTable() {
  return within(screen.getByRole('table', { name: 'Histórico de transações' }))
}

function lastHistoryQuery() {
  return vi.mocked(listClubTransactions).mock.lastCall
}

async function sellMidfielder(user: User) {
  await user.click(screen.getByRole('button', { name: `Vender ${MIDFIELDER.name}` }))
  return within(screen.getByRole('dialog', { name: `Vender ${MIDFIELDER.name}?` }))
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
    expect(screen.getByRole('heading', { name: 'Alfa FC' })).toBeInTheDocument()
    expect(summaryValue('Caixa')).toBe('282,00 moedas')
    expect(summaryValue('Valor do elenco')).toBe('18,00 moedas')
    expect(summaryValue('Patrimônio')).toBe('300,00 moedas')
    expect(summaryValue('Elenco')).toBe('2 de 12')
    expect(screen.getByRole('tab', { name: 'Elenco 2' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Histórico 2' })).toBeInTheDocument()

    expect(
      screen
        .getAllByRole('button', { name: /^Vender/ })
        .map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Vender Paredão', 'Vender Meia Lua'])
    const row = rowOf(MIDFIELDER.name)
    expect(row.getByText('3,50')).toBeInTheDocument()
    expect(row.getByText('3,00')).toBeInTheDocument()
    expect(row.getByText('10/01/2027')).toBeInTheDocument()
    expect(row.getByText('10:00')).toBeInTheDocument()
    expect(row.getByText('87')).toBeInTheDocument()
    expect(row.getByText('10%')).toBeInTheDocument()
  })

  it('shows the API message when the club does not exist', async () => {
    vi.mocked(getClub).mockRejectedValue(new ApiError('Clube não encontrado.', 404))
    renderWithProviders(<ClubPage />, { path: '/clubs/:clubId', url: '/clubs/99' })

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Clube não encontrado.')
    expect(within(alert).getByRole('button', { name: 'Voltar para clubes' })).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  it('sells after confirmation with one request and shows the result from the API', async () => {
    vi.mocked(sellPlayer).mockResolvedValue(makeSale())
    const user = await renderPage()
    const clubCalls = vi.mocked(getClub).mock.calls.length
    const historyCalls = vi.mocked(listClubTransactions).mock.calls.length

    const dialog = await sellMidfielder(user)
    const confirmation = screen.getByRole('dialog')
    expect(summaryValue('Valor de compra', confirmation)).toBe('3,00')
    expect(summaryValue('Dias restantes', confirmation)).toBe('87')
    expect(summaryValue('% de multa se vender agora', confirmation)).toBe('10%')
    expect(dialog.queryByText(/é titular/)).not.toBeInTheDocument()
    expect(sellPlayer).not.toHaveBeenCalled()
    vi.mocked(getClub).mockResolvedValue(makeClubDetails([GOALKEEPER]))
    await user.dblClick(dialog.getByRole('button', { name: 'Confirmar venda' }))

    expect(sellPlayer).toHaveBeenCalledOnce()
    expect(sellPlayer).toHaveBeenCalledWith(MIDFIELDER.id)
    const result = await screen.findByRole('dialog', { name: 'Venda concluída' })
    expect(summaryValue('Valor de compra', result)).toBe('37,00')
    expect(summaryValue('Valor de venda', result)).toBe('40,00')
    expect(summaryValue('Dias restantes', result)).toBe('87')
    expect(summaryValue('Multa', result)).toBe('4,00')
    expect(within(result).getByText('10% do valor de venda, com teto de 10,00')).toBeVisible()
    expect(summaryValue('Lucro', result)).toBe('+3,00')
    expect(summaryValue('Comissão', result)).toBe('0,30')
    expect(summaryValue('Crédito no caixa', result)).toBe('+35,70')
    expect(summaryValue('Contrato', result)).toBe('RESCINDIDO')
    expect(summaryValue('Novo caixa', result)).toBe('317,70')
    expect(screen.getByRole('status')).toHaveTextContent('Venda concluída')

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: `Vender ${MIDFIELDER.name}` }),
      ).not.toBeInTheDocument(),
    )
    expect(vi.mocked(getClub).mock.calls.length).toBeGreaterThan(clubCalls)
    expect(vi.mocked(listClubTransactions).mock.calls.length).toBeGreaterThan(historyCalls)

    await user.click(within(result).getByRole('button', { name: 'Ver histórico' }))
    expect(screen.getByRole('tab', { name: /^Histórico/ })).toHaveAttribute('aria-selected', 'true')
  })

  it('warns when the player is a starter and shows a sale without penalty as ENCERRADO', async () => {
    vi.mocked(getClubLineup).mockResolvedValue(
      makeLineup({ formation: '2-1-1', players: [GOALKEEPER, MIDFIELDER] }),
    )
    vi.mocked(sellPlayer).mockResolvedValue(
      makeSale({ penalty: 0, penalty_rate: 0, remaining_days: 0, contract_status: 'ENCERRADO' }),
    )
    const user = await renderPage()

    const dialog = await sellMidfielder(user)
    expect(await dialog.findByText('Meia Lua é titular')).toBeInTheDocument()
    await user.click(dialog.getByRole('button', { name: 'Confirmar venda' }))

    const result = await screen.findByRole('dialog', { name: 'Venda concluída' })
    expect(result).toHaveAccessibleDescription(/não houve multa/)
    expect(summaryValue('Contrato', result)).toBe('ENCERRADO')
    expect(within(result).getByText('Fidelidade cumprida: sem multa')).toBeVisible()
  })

  it('shows the API refusal of a sale inside the confirmation', async () => {
    vi.mocked(sellPlayer).mockRejectedValue(new ApiError('Meia Lua já está livre.', 409))
    const user = await renderPage()

    const dialog = await sellMidfielder(user)
    await user.click(dialog.getByRole('button', { name: 'Confirmar venda' }))

    const alert = await dialog.findByRole('alert')
    expect(alert).toHaveTextContent('A venda foi recusada')
    expect(alert).toHaveTextContent('Meia Lua já está livre.')
  })
})

describe('ClubPage history', () => {
  it('shows the transactions with signed cash changes and the summary from the API', async () => {
    const user = await renderPage()
    await openHistory(user)

    expect(listClubTransactions).toHaveBeenCalledWith(2, { types: ['COMPRA', 'VENDA'] })
    const sale = rowOf('Paredão', screen.getByRole('table', { name: 'Histórico de transações' }))
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
    expect(summaryValue('Taxas e comissões')).toBe('12,15')
    expect(summaryValue('Multas')).toBe('14,00')
    expect(summaryValue('Lucro total')).toBe('-3,00')
  })

  it('filters by type and by a player of the history, then clears the filters', async () => {
    const user = await renderPage()
    await openHistory(user)

    const playerSelect = screen.getByLabelText('Jogador')
    expect(
      within(playerSelect)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Todos', 'Meia Lua', 'Paredão'])

    vi.mocked(listClubTransactions).mockResolvedValue(makeHistory([SALE]))
    await user.click(screen.getByLabelText('Compra'))
    expect(screen.getByLabelText('Venda')).toBeDisabled()
    await user.selectOptions(playerSelect, 'Paredão')

    await waitFor(() => expect(lastHistoryQuery()).toEqual([2, { types: ['VENDA'], player_id: 7 }]))
    await waitFor(() => expect(historyTable().queryByText('Meia Lua')).not.toBeInTheDocument())
    expect(within(playerSelect).getAllByRole('option')).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))
    await waitFor(() => expect(lastHistoryQuery()).toEqual([2, { types: ['COMPRA', 'VENDA'] }]))
  })

  it('shows the API message when the filter is refused', async () => {
    const user = await renderPage()
    await openHistory(user)
    vi.mocked(listClubTransactions).mockRejectedValueOnce(
      new ApiError('Jogador não encontrado.', 404),
    )

    await user.selectOptions(screen.getByLabelText('Jogador'), 'Meia Lua')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('O filtro foi recusado')
    expect(alert).toHaveTextContent('Jogador não encontrado.')
    expect(screen.queryByText('Lucro total')).not.toBeInTheDocument()
  })

  it('shows an empty history with the totals from the API', async () => {
    vi.mocked(listClubTransactions).mockResolvedValue({
      data: [],
      summary: {
        total_spent: 0,
        total_received: 0,
        total_fees: 0,
        total_penalties: 0,
        total_profit: 0,
      },
    })
    const user = await renderPage()

    await user.click(screen.getByRole('tab', { name: /^Histórico/ }))

    expect(await screen.findByText('Nenhuma transação ainda')).toBeInTheDocument()
    expect(summaryValue('Lucro total')).toBe('0,00')
  })

  it('downloads the CSV with the applied filters', async () => {
    vi.mocked(exportClubTransactions).mockResolvedValue('transacoes-clube-2.csv')
    const user = await renderPage()
    await openHistory(user)

    await user.click(screen.getByLabelText('Venda'))
    await waitFor(() => expect(lastHistoryQuery()).toEqual([2, { types: ['COMPRA'] }]))
    await user.dblClick(screen.getByRole('button', { name: 'Exportar CSV' }))

    expect(exportClubTransactions).toHaveBeenCalledOnce()
    expect(exportClubTransactions).toHaveBeenCalledWith(2, { types: ['COMPRA'] })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'CSV baixadotransacoes-clube-2.csv, com os filtros aplicados.',
    )
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
