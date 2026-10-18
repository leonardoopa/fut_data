import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { listClubs } from '../../api/clubs'
import { getMatch, listMatches } from '../../api/matches'
import { listPlayers } from '../../api/players'
import type { Condition, DuelAttribute, DuelPlayer, MatchDetails, Position } from '../../api/types'
import { makeClub, makeMatch, makePage } from '../../test/fixtures'
import { rowOf } from '../../test/queries'
import { renderWithProviders } from '../../test/render'
import { MatchPage } from './MatchPage'

vi.mock('../../api/clubs')
vi.mock('../../api/matches')
vi.mock('../../api/players')

function player(
  player_id: number,
  player_name: string,
  position: Position,
  attribute: DuelAttribute,
  value: number,
  condition: Condition = 'APTO',
): DuelPlayer {
  return { player_id, player_name, position, condition, attribute, value }
}

const ALFA_KEEPER = player(1, 'Gol Alfa', 'GOL', 'defending', 74)
const ALFA_FIRST = player(2, 'Zag Alfa', 'ZAG', 'defending', 60)
const ALFA_SECOND_ATTACK = player(3, 'Lat Alfa', 'LAT', 'dribbling', 72, 'MAL_CONDICIONADO')
const ALFA_SECOND_DEFENSE = { ...ALFA_SECOND_ATTACK, attribute: 'defending' as const, value: 63 }
const BETA_KEEPER = player(11, 'Gol Beta', 'GOL', 'defending', 70)
const BETA_FIRST = player(12, 'Zag Um', 'ZAG', 'defending', 78)
const BETA_SECOND_DEFENSE = player(13, 'Zag Dois', 'ZAG', 'defending', 65)
const BETA_SECOND_ATTACK = { ...BETA_SECOND_DEFENSE, attribute: 'dribbling' as const, value: 58 }

const MATCH: MatchDetails = {
  ...makeMatch({ id: 5 }),
  duels: [
    {
      order: 1,
      attacking_club_id: 2,
      attacker: player(5, 'Ata Alfa', 'ATA', 'shooting', 81),
      defender: BETA_KEEPER,
      goal: true,
    },
    {
      order: 2,
      attacking_club_id: 2,
      attacker: player(4, 'Mei Alfa', 'MEI', 'passing', 75),
      defender: BETA_FIRST,
      goal: false,
    },
    {
      order: 3,
      attacking_club_id: 2,
      attacker: ALFA_SECOND_ATTACK,
      defender: BETA_SECOND_DEFENSE,
      goal: true,
    },
    {
      order: 4,
      attacking_club_id: 3,
      attacker: player(15, 'Ata Beta', 'ATA', 'shooting', 73),
      defender: ALFA_KEEPER,
      goal: false,
    },
    {
      order: 5,
      attacking_club_id: 3,
      attacker: player(14, 'Lat Beta', 'LAT', 'dribbling', 69),
      defender: ALFA_FIRST,
      goal: true,
    },
    {
      order: 6,
      attacking_club_id: 3,
      attacker: BETA_SECOND_ATTACK,
      defender: ALFA_SECOND_DEFENSE,
      goal: false,
    },
  ],
}

function renderPage(matchId: number) {
  const user = userEvent.setup()
  renderWithProviders(<MatchPage />, { path: '/matches/:matchId', url: `/matches/${matchId}` })
  return user
}

beforeEach(() => {
  vi.mocked(listClubs).mockResolvedValue([
    makeClub(),
    makeClub({ id: 3, name: 'Beta FC', acronym: 'BET' }),
  ])
  vi.mocked(listMatches).mockResolvedValue([MATCH])
  vi.mocked(listPlayers).mockResolvedValue(makePage([]))
})

describe('MatchPage', () => {
  it('shows the score and both teams on the pitch from the duels of the API', async () => {
    vi.mocked(getMatch).mockResolvedValue(MATCH)
    renderPage(5)

    expect(await screen.findByRole('heading', { name: 'Alfa FC × Beta FC' })).toBeInTheDocument()
    expect(getMatch).toHaveBeenCalledWith(5)
    expect(screen.getByText('2 × 1')).toBeInTheDocument()
    expect(screen.getByText('Mandante · 2-1-1')).toBeInTheDocument()
    expect(screen.getByText('Visitante · 3-1')).toBeInTheDocument()
    expect(screen.getByText('Vitória do mandante')).toBeInTheDocument()
    expect(screen.getByText(/^14\/10\/2026,? 19:36$/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Voltar para partidas' })).toHaveAttribute(
      'href',
      '/matches',
    )

    const pitch = within(screen.getByRole('list', { name: 'Titulares de Alfa FC e Beta FC' }))
    expect(pitch.getAllByRole('listitem')).toHaveLength(10)
    expect(pitch.getByText('LAT · Dri 72 · Def 63')).toBeInTheDocument()
    expect(pitch.getByText('ZAG · Def 65 · Dri 58')).toBeInTheDocument()
    expect(pitch.getByText('GOL · Def 70')).toBeInTheDocument()
    expect(screen.getByText('Alfa FC · 2-1-1 · mandante')).toBeInTheDocument()
    expect(screen.getByText('Beta FC · 3-1 · visitante')).toBeInTheDocument()
  })

  it('lists the six duels of the API grouped by the attacking club', async () => {
    vi.mocked(getMatch).mockResolvedValue(MATCH)
    renderPage(5)

    const table = await screen.findByRole('table', { name: 'Duelos da partida' })
    const duels = within(table)
    expect(duels.getByText('Ataques do Alfa FC (mandante)')).toBeInTheDocument()
    expect(duels.getByText('Ataques do Beta FC (visitante)')).toBeInTheDocument()
    expect(duels.getByText('2 gols')).toBeInTheDocument()
    expect(duels.getByText('1 gol')).toBeInTheDocument()
    expect(duels.getAllByText('Gol', { selector: '.badge' })).toHaveLength(3)
    expect(duels.getAllByText('Sem gol', { selector: '.badge' })).toHaveLength(3)

    const firstDuel = rowOf('Ata Alfa', table)
    expect(firstDuel.getByText('ATA · Apto · Alfa FC')).toBeInTheDocument()
    expect(firstDuel.getByText('Finalização')).toBeInTheDocument()
    expect(firstDuel.getByText('81')).toBeInTheDocument()
    expect(firstDuel.getByText('Gol Beta')).toBeInTheDocument()
    expect(firstDuel.getByText('GOL · Apto · Beta FC')).toBeInTheDocument()
    expect(firstDuel.getByText('70')).toBeInTheDocument()
    expect(firstDuel.getByText('Gol', { selector: '.badge' })).toBeInTheDocument()

    const thirdDuel = rowOf('3', table)
    expect(thirdDuel.getByText('LAT · Mal condicionado · Alfa FC')).toBeInTheDocument()
    expect(thirdDuel.getByText('Drible')).toBeInTheDocument()
    expect(thirdDuel.getByText('72')).toBeInTheDocument()
  })

  it('shows the API message with a retry when the match cannot be loaded', async () => {
    vi.mocked(getMatch).mockRejectedValueOnce(new ApiError('Partida não encontrada.', 404))
    vi.mocked(getMatch).mockResolvedValueOnce(MATCH)
    const user = renderPage(99)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar a partida')
    expect(alert).toHaveTextContent('Partida não encontrada.')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    await user.click(within(alert).getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('table', { name: 'Duelos da partida' })).toBeInTheDocument()
  })
})
