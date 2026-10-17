import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { listClubs } from '../../api/clubs'
import { listMatches } from '../../api/matches'
import { listPlayers } from '../../api/players'
import { listStandings } from '../../api/standings'
import { makeClub, makeMatch, makePage, makeStanding } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { MatchesPage } from '../matches/MatchesPage'
import { StandingsPage } from './StandingsPage'

vi.mock('../../api/clubs')
vi.mock('../../api/matches')
vi.mock('../../api/players')
vi.mock('../../api/standings')

const STANDINGS = [
  makeStanding({ position: 1, club_id: 3, club_name: 'Beta FC' }),
  makeStanding({
    position: 2,
    club_id: 2,
    club_name: 'Alfa FC',
    wins: 0,
    draws: 1,
    goals_for: 4,
    goals_against: 6,
    goal_difference: -2,
    points: 1,
  }),
  makeStanding({
    position: 3,
    club_id: 4,
    club_name: 'Gama FC',
    played: 0,
    wins: 0,
    goals_for: 0,
    goals_against: 0,
    goal_difference: 0,
    points: 0,
  }),
]

function renderPage() {
  const user = userEvent.setup()
  renderWithProviders(<StandingsPage />, {
    path: '/standings',
    url: '/standings',
    routes: { '/matches': <MatchesPage /> },
  })
  return user
}

function standingsTable() {
  return screen.getByRole('table', { name: 'Classificação' })
}

function numberCells(row: HTMLElement) {
  return within(row)
    .getAllByRole('cell')
    .filter((_, index) => index !== 1)
    .map((cell) => cell.textContent)
}

beforeEach(() => {
  vi.mocked(listClubs).mockResolvedValue([
    makeClub(),
    makeClub({ id: 3, name: 'Beta FC', acronym: 'BET' }),
  ])
  vi.mocked(listMatches).mockResolvedValue([makeMatch()])
  vi.mocked(listPlayers).mockResolvedValue(makePage([]))
})

describe('StandingsPage', () => {
  it('shows every column in the order returned by the API', async () => {
    vi.mocked(listStandings).mockResolvedValue(STANDINGS)
    renderPage()
    await screen.findByRole('link', { name: 'Beta FC' })

    const table = within(standingsTable())
    expect(table.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      '#Posição',
      'Clube',
      'JJogos',
      'VVitórias',
      'EEmpates',
      'DDerrotas',
      'GPGols marcados',
      'GCGols sofridos',
      'SGSaldo de gols',
      'PtsPontos',
    ])
    expect(table.getByRole('columnheader', { name: 'Saldo de gols' })).toBeInTheDocument()
    const rows = table.getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getAllByRole('link')[0].textContent)).toEqual([
      'Beta FC',
      'Alfa FC',
      'Gama FC',
    ])
    expect(numberCells(rows[0])).toEqual(['1', '1', '1', '0', '0', '2', '1', '+1', '3'])
    expect(numberCells(rows[1])).toEqual(['2', '1', '0', '1', '0', '4', '6', '-2', '1'])
    expect(within(rows[1]).getByText('ALF')).toBeInTheDocument()
    expect(table.getByRole('link', { name: 'Alfa FC' })).toHaveAttribute('href', '/clubs/2')
    expect(screen.getByText(/^J: jogos · V: vitórias/)).toBeInTheDocument()
  })

  it('shows the latest matches and the table order criteria', async () => {
    vi.mocked(listStandings).mockResolvedValue(STANDINGS)
    renderPage()

    const recent = within(await screen.findByRole('region', { name: 'Últimas partidas' }))
    expect(
      await recent.findByRole('link', { name: /^Ver duelos de Alfa FC × Beta FC/ }),
    ).toHaveAttribute('href', '/matches/1')
    expect(recent.getByText('2 × 1')).toBeInTheDocument()
    expect(recent.getByRole('link', { name: 'Ver todas as partidas' })).toHaveAttribute(
      'href',
      '/matches',
    )

    const order = within(screen.getByRole('region', { name: 'Ordem da tabela' }))
    expect(order.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Mais pontos',
      'Maior saldo de gols',
      'Mais gols marcados',
      'Nome do clube, de A a Z',
    ])
  })

  it('shows the empty state', async () => {
    vi.mocked(listStandings).mockResolvedValue([])
    renderPage()

    expect(await screen.findByText('Nenhum clube cadastrado')).toBeInTheDocument()
    expect(screen.queryByRole('table', { name: 'Classificação' })).not.toBeInTheDocument()
  })

  it('shows the API error with a retry', async () => {
    vi.mocked(listStandings).mockRejectedValueOnce(
      new ApiError('Não foi possível conectar à API.', 0),
    )
    vi.mocked(listStandings).mockResolvedValueOnce(STANDINGS)
    const user = renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar a classificação')
    expect(alert).toHaveTextContent('Não foi possível conectar à API.')

    await user.click(within(alert).getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('link', { name: 'Beta FC' })).toBeInTheDocument()
  })

  it('opens the new match dialog from the shortcut', async () => {
    vi.mocked(listStandings).mockResolvedValue(STANDINGS)
    const user = renderPage()

    await user.click(screen.getByRole('button', { name: 'Nova partida' }))

    expect(await screen.findByRole('dialog', { name: 'Nova partida' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Partidas' })).toBeInTheDocument()
  })
})
