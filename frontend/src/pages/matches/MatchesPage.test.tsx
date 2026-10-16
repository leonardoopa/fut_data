import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { listClubs } from '../../api/clubs'
import { listMatches, playMatch } from '../../api/matches'
import { makeClub, makeMatch, makeMatchDetails } from '../../test/fixtures'
import { rowOf, summaryValue } from '../../test/queries'
import { renderWithProviders } from '../../test/render'
import { MatchesPage } from './MatchesPage'

vi.mock('../../api/clubs')
vi.mock('../../api/matches')

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

async function renderPage() {
  const user = userEvent.setup()
  renderWithProviders(<MatchesPage />)
  await screen.findAllByRole('option', { name: 'ALF — Alfa FC' })
  return user
}

async function chooseClubs(user: ReturnType<typeof userEvent.setup>, home: string, away: string) {
  await user.selectOptions(screen.getByLabelText('Mandante'), home)
  await user.selectOptions(screen.getByLabelText('Visitante'), away)
}

function historyTable() {
  return within(screen.getByRole('table', { name: 'Histórico de partidas' }))
}

beforeEach(() => {
  vi.mocked(listClubs).mockResolvedValue([ALFA, BETA])
  vi.mocked(listMatches).mockResolvedValue([NEWER_MATCH, OLDER_MATCH])
})

describe('MatchesPage play', () => {
  it('requires two different clubs before playing', async () => {
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Jogar partida' }))
    expect(await screen.findByLabelText('Mandante')).toHaveAccessibleDescription(
      'Selecione uma opção.',
    )
    expect(screen.getByLabelText('Visitante')).toHaveAccessibleDescription('Selecione uma opção.')

    await chooseClubs(user, 'ALF — Alfa FC', 'ALF — Alfa FC')
    await user.click(screen.getByRole('button', { name: 'Jogar partida' }))

    await waitFor(() =>
      expect(screen.getByLabelText('Visitante')).toHaveAccessibleDescription(
        'Escolha um clube diferente do mandante.',
      ),
    )
    expect(playMatch).not.toHaveBeenCalled()
  })

  it('plays once on double click and shows the score and the duels from the API', async () => {
    vi.mocked(playMatch).mockResolvedValue(makeMatchDetails())
    const user = await renderPage()
    const historyCalls = vi.mocked(listMatches).mock.calls.length

    await chooseClubs(user, 'ALF — Alfa FC', 'BET — Beta FC')
    await user.dblClick(screen.getByRole('button', { name: 'Jogar partida' }))

    expect(playMatch).toHaveBeenCalledOnce()
    expect(playMatch).toHaveBeenCalledWith({ home_club_id: 2, away_club_id: 3 })
    const result = within(await screen.findByRole('region', { name: 'Resultado da partida' }))
    expect(result.getByText('2 × 1')).toBeInTheDocument()
    expect(summaryValue('Resultado')).toBe('Vitória do mandante')
    expect(summaryValue('Formação do mandante')).toBe('2-1-1')
    expect(summaryValue('Formação do visitante')).toBe('3-1')
    expect(screen.getByText('Partida jogada: Alfa FC 2 × 1 Beta FC.')).toBeInTheDocument()

    const duels = result.getAllByRole('row').slice(1)
    expect(duels.map((row) => within(row).getAllByRole('cell')[0].textContent)).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
    ])
    const firstDuel = within(duels[0])
    expect(firstDuel.getByText('Alfa FC')).toBeInTheDocument()
    expect(firstDuel.getByText('Atacante 1')).toBeInTheDocument()
    expect(firstDuel.getByText('Finalização')).toBeInTheDocument()
    expect(firstDuel.getByText('61')).toBeInTheDocument()
    expect(firstDuel.getByText('Defensor 1')).toBeInTheDocument()
    expect(firstDuel.getByText('Zagueiro')).toBeInTheDocument()
    expect(firstDuel.getByText('51')).toBeInTheDocument()
    expect(firstDuel.getByText('Gol')).toBeInTheDocument()
    const secondDuel = within(duels[1])
    expect(secondDuel.getByText('Mal condicionado')).toBeInTheDocument()
    expect(secondDuel.getByText('Sem gol')).toBeInTheDocument()
    expect(within(duels[3]).getByText('Beta FC')).toBeInTheDocument()

    await waitFor(() =>
      expect(vi.mocked(listMatches).mock.calls.length).toBeGreaterThan(historyCalls),
    )
  })

  it('shows the API message when a club has no complete lineup', async () => {
    vi.mocked(playMatch).mockRejectedValue(
      new ApiError('O clube Beta FC não tem escalação completa.', 409),
    )
    const user = await renderPage()

    await chooseClubs(user, 'ALF — Alfa FC', 'BET — Beta FC')
    await user.click(screen.getByRole('button', { name: 'Jogar partida' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'O clube Beta FC não tem escalação completa.',
    )
    expect(screen.queryByRole('region', { name: 'Resultado da partida' })).not.toBeInTheDocument()
  })
})

describe('MatchesPage history', () => {
  it('lists the matches in API order with the date in Brasília and links to the duels', async () => {
    await renderPage()
    await historyTable().findByRole('cell', { name: '0 × 0' })

    expect(listMatches).toHaveBeenCalledWith({})
    const rows = historyTable().getAllByRole('row').slice(1)
    expect(rows.map((row) => within(row).getAllByRole('cell')[2].textContent)).toEqual([
      '0 × 0',
      '2 × 1',
    ])
    const older = rowOf('2 × 1')
    expect(older.getByText(/^14\/10\/2026,? 19:36$/)).toBeInTheDocument()
    expect(older.getByText('Vitória do mandante')).toBeInTheDocument()
    expect(older.getByRole('link', { name: /Ver duelos de Alfa FC × Beta FC/ })).toHaveAttribute(
      'href',
      '/matches/1',
    )
  })

  it('filters the history by club', async () => {
    const user = await renderPage()
    await historyTable().findByRole('cell', { name: '0 × 0' })
    vi.mocked(listMatches).mockResolvedValue([OLDER_MATCH])

    await user.selectOptions(screen.getByLabelText('Filtrar por clube'), 'BET — Beta FC')

    await waitFor(() => expect(vi.mocked(listMatches).mock.lastCall).toEqual([{ club_id: 3 }]))
    await waitFor(() => expect(historyTable().queryByText('0 × 0')).not.toBeInTheDocument())
  })

  it('shows the empty and error states of the history', async () => {
    vi.mocked(listMatches).mockResolvedValueOnce([])
    const user = await renderPage()
    expect(await screen.findByText('Nenhuma partida jogada.')).toBeInTheDocument()

    vi.mocked(listMatches).mockRejectedValueOnce(new ApiError('Falha ao listar partidas.', 0))
    await user.selectOptions(screen.getByLabelText('Filtrar por clube'), 'ALF — Alfa FC')

    expect(await screen.findByRole('alert')).toHaveTextContent('Falha ao listar partidas.')
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await historyTable().findByRole('cell', { name: '0 × 0' })).toBeInTheDocument()
  })
})
