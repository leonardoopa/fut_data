import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listClubs } from '../../api/clubs'
import { listMatches } from '../../api/matches'
import { listPlayers } from '../../api/players'
import { listStandings } from '../../api/standings'
import { CLUBS, makeMatch, makePage, makeStanding } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { HomePage } from './HomePage'

vi.mock('../../api/clubs')
vi.mock('../../api/matches')
vi.mock('../../api/players')
vi.mock('../../api/standings')

beforeEach(() => {
  vi.mocked(listClubs).mockResolvedValue(CLUBS)
  vi.mocked(listMatches).mockResolvedValue([makeMatch()])
  vi.mocked(listPlayers).mockResolvedValue(makePage([], 23))
  vi.mocked(listStandings).mockResolvedValue([makeStanding({ club_name: 'Delta FC', points: 6 })])
})

describe('HomePage', () => {
  it('shows the league numbers and the leader from the API', async () => {
    renderWithProviders(<HomePage />)

    expect(await screen.findByText('Liga Fictícia 2026 · líder: Delta FC, 6 pontos')).toBeVisible()
    expect(screen.getByText('23 jogadores')).toBeInTheDocument()
    expect(screen.getByText('1 clube')).toBeInTheDocument()
    expect(screen.getByText('1 partida')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar' })).toHaveAttribute('href', '/players')
  })

  it('starts on Enter', async () => {
    renderWithProviders(<HomePage />, {
      path: '/',
      url: '/',
      routes: { '/players': <p>Jogadores</p> },
    })
    await screen.findByText('23 jogadores')

    await userEvent.keyboard('{Enter}')

    expect(screen.getByText('Jogadores')).toBeInTheDocument()
  })
})
