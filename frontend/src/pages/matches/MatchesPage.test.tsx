import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { listClubs } from '../../api/clubs'
import { getMatch, listMatches, playMatch } from '../../api/matches'
import { listPlayers } from '../../api/players'
import { makeClub, makeMatch, makeMatchDetails, makePage } from '../../test/fixtures'
import { rowOf } from '../../test/queries'
import { renderWithProviders } from '../../test/render'
import { MatchesPage } from './MatchesPage'
import { MatchPage } from './MatchPage'

vi.mock('../../api/clubs')
vi.mock('../../api/matches')
vi.mock('../../api/players')

type User = ReturnType<typeof userEvent.setup>

const ALFA = makeClub()
const BETA = makeClub({ id: 3, name: 'Beta FC', acronym: 'BET' })
const OLDER_MATCH = makeMatch()
const NEWER_MATCH = makeMatch({
  id: 2,
  played_at: '2026-10-15T21:05:00-03:00',
  home: { club_id: 3, club_name: 'Beta FC', formation: '2-2', goals: 0 },
  away: { club_id: 2, club_name: 'Alfa FC', formation: '2-1-1', goals: 0 },
  result: 'EMPATE',
})
const LINEUP_REFUSAL = 'O clube Beta FC não tem escalação completa.'

function renderPage() {
  const user = userEvent.setup()
  renderWithProviders(<MatchesPage />, {
    path: '/matches',
    url: '/matches',
    routes: { '/matches/:matchId': <MatchPage /> },
  })
  return user
}

async function openDialog(user: User) {
  await user.click(screen.getAllByRole('button', { name: 'Nova partida' })[0])
  const dialog = within(await screen.findByRole('dialog', { name: 'Nova partida' }))
  await dialog.findAllByRole('option', { name: 'Alfa FC (ALF)' })
  return dialog
}

async function chooseClubs(
  dialog: ReturnType<typeof within>,
  user: User,
  home: string,
  away: string,
) {
  await user.selectOptions(dialog.getByLabelText('Mandante'), home)
  await user.selectOptions(dialog.getByLabelText('Visitante'), away)
}

function historyTable() {
  return within(screen.getByRole('table', { name: 'Histórico de partidas' }))
}

beforeEach(() => {
  vi.mocked(listClubs).mockResolvedValue([ALFA, BETA])
  vi.mocked(listMatches).mockImplementation(async (filters) =>
    filters.club_id === 3 ? [OLDER_MATCH] : [NEWER_MATCH, OLDER_MATCH],
  )
  vi.mocked(listPlayers).mockResolvedValue(makePage([]))
})

describe('MatchesPage new match', () => {
  it('requires both clubs and two different clubs before playing', async () => {
    const user = renderPage()
    const dialog = await openDialog(user)

    await user.click(dialog.getByRole('button', { name: 'Jogar partida' }))
    expect(await dialog.findByLabelText('Mandante')).toHaveAccessibleDescription(
      'Selecione uma opção.',
    )
    expect(dialog.getByLabelText('Visitante')).toHaveAccessibleDescription('Selecione uma opção.')

    await chooseClubs(dialog, user, 'Alfa FC (ALF)', 'Alfa FC (ALF)')
    await user.click(dialog.getByRole('button', { name: 'Jogar partida' }))

    await waitFor(() =>
      expect(dialog.getByLabelText('Visitante')).toHaveAccessibleDescription(
        'Escolha um clube diferente do mandante.',
      ),
    )
    expect(playMatch).not.toHaveBeenCalled()
  })

  it('plays once on double click and opens the match returned by the API', async () => {
    vi.mocked(playMatch).mockResolvedValue(makeMatchDetails({ id: 7 }))
    vi.mocked(getMatch).mockResolvedValue(makeMatchDetails({ id: 7 }))
    const user = renderPage()
    const dialog = await openDialog(user)
    const leagueCalls = vi.mocked(listMatches).mock.calls.length

    await chooseClubs(dialog, user, 'Alfa FC (ALF)', 'Beta FC (BET)')
    await user.dblClick(dialog.getByRole('button', { name: 'Jogar partida' }))

    expect(playMatch).toHaveBeenCalledOnce()
    expect(playMatch).toHaveBeenCalledWith({ home_club_id: 2, away_club_id: 3 })
    expect(await screen.findByRole('table', { name: 'Duelos da partida' })).toBeInTheDocument()
    expect(getMatch).toHaveBeenCalledWith(7)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Partida jogada')).toBeInTheDocument()
    expect(
      screen.getByText('Alfa FC 2 × 1 Beta FC. Placar e duelos devolvidos pela API.'),
    ).toBeInTheDocument()
    expect(vi.mocked(listMatches).mock.calls.length).toBeGreaterThan(leagueCalls)
  })

  it('shows the API message on refusal and clears it when the dialog opens again', async () => {
    vi.mocked(playMatch).mockRejectedValue(new ApiError(LINEUP_REFUSAL, 409))
    const user = renderPage()
    let dialog = await openDialog(user)

    await chooseClubs(dialog, user, 'Alfa FC (ALF)', 'Beta FC (BET)')
    await user.click(dialog.getByRole('button', { name: 'Jogar partida' }))

    const alert = await dialog.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível jogar a partida')
    expect(alert).toHaveTextContent(LINEUP_REFUSAL)
    expect(screen.queryByRole('table', { name: 'Duelos da partida' })).not.toBeInTheDocument()
    expect(dialog.getByRole('button', { name: 'Jogar partida' })).toBeEnabled()

    await user.click(dialog.getByRole('button', { name: 'Cancelar' }))
    dialog = await openDialog(user)
    expect(dialog.queryByRole('alert')).not.toBeInTheDocument()
    expect(dialog.queryByText(LINEUP_REFUSAL)).not.toBeInTheDocument()
  })
})

describe('MatchesPage history', () => {
  it('shows the last match and the history in API order with dates in Brasília', async () => {
    renderPage()
    const lastMatch = within(await screen.findByRole('region', { name: 'Última partida' }))

    expect(lastMatch.getByText('0 × 0')).toBeInTheDocument()
    expect(lastMatch.getByText('Empate')).toBeInTheDocument()
    expect(lastMatch.getByText(/^15\/10\/2026,? 21:05$/)).toBeInTheDocument()
    expect(
      lastMatch.getByRole('link', { name: /^Ver duelos de Beta FC × Alfa FC/ }),
    ).toHaveAttribute('href', '/matches/2')

    expect(listMatches).toHaveBeenCalledWith({})
    const scores = historyTable()
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[2].textContent)
    expect(scores).toEqual(['0 × 0', '2 × 1'])
    const older = rowOf('2 × 1', screen.getByRole('table', { name: 'Histórico de partidas' }))
    expect(older.getByText('14/10/2026')).toBeInTheDocument()
    expect(older.getByText('19:36')).toBeInTheDocument()
    expect(older.getByText('ALF')).toBeInTheDocument()
    expect(older.getByText('Vitória do mandante')).toBeInTheDocument()
    expect(older.getByRole('link', { name: /^Ver duelos de Alfa FC × Beta FC/ })).toHaveAttribute(
      'href',
      '/matches/1',
    )
    expect(screen.getByText('2 partidas')).toBeInTheDocument()
  })

  it('filters the history by club through the API', async () => {
    const user = renderPage()
    await historyTable().findByText('0 × 0')

    await user.selectOptions(screen.getByLabelText('Filtrar por clube'), 'Beta FC (BET)')

    await waitFor(() => expect(vi.mocked(listMatches).mock.lastCall).toEqual([{ club_id: 3 }]))
    await waitFor(() => expect(historyTable().queryByText('0 × 0')).not.toBeInTheDocument())
    expect(historyTable().getByText('2 × 1')).toBeInTheDocument()
    expect(screen.getByText('1 partida')).toBeInTheDocument()
  })

  it('shows the empty state of a club without matches', async () => {
    vi.mocked(listMatches).mockImplementation(async (filters) =>
      filters.club_id === 3 ? [] : [OLDER_MATCH],
    )
    const user = renderPage()
    await historyTable().findByText('2 × 1')

    await user.selectOptions(screen.getByLabelText('Filtrar por clube'), 'Beta FC (BET)')

    expect(await screen.findByText('Nenhuma partida desse clube')).toBeInTheDocument()
  })

  it('shows the empty league state with a shortcut to play the first match', async () => {
    vi.mocked(listMatches).mockResolvedValue([])
    const user = renderPage()

    expect(await screen.findByText('Nenhuma partida jogada')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Última partida' })).not.toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Nova partida' })[1])
    expect(await screen.findByRole('dialog', { name: 'Nova partida' })).toBeInTheDocument()
  })

  it('shows the API error with a retry', async () => {
    vi.mocked(listMatches).mockRejectedValueOnce(new ApiError('Falha ao listar partidas.', 500))
    const user = renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar as partidas')
    expect(alert).toHaveTextContent('Falha ao listar partidas.')

    await user.click(within(alert).getByRole('button', { name: 'Tentar de novo' }))
    expect(await historyTable().findByText('0 × 0')).toBeInTheDocument()
  })

  it('fetches the matches again when the page is opened from the menu', async () => {
    const user = userEvent.setup()
    renderWithProviders(<MatchesPage />, {
      url: '/clubs',
      path: '/matches',
      routes: { '/clubs': <Link to="/matches">Partidas</Link> },
    })
    await waitFor(() => expect(listMatches).toHaveBeenCalledOnce())
    vi.mocked(listMatches).mockRejectedValueOnce(new ApiError('Falha ao listar partidas.', 500))

    await user.click(await screen.findByRole('link', { name: 'Partidas' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Falha ao listar partidas.')
    expect(listMatches).toHaveBeenCalledTimes(2)
  })
})
