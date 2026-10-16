import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { listStandings } from '../../api/standings'
import { makeStanding } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { StandingsPage } from './StandingsPage'

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

function cellTexts(row: HTMLElement) {
  return within(row)
    .getAllByRole('cell')
    .map((cell) => cell.textContent)
}

describe('StandingsPage', () => {
  it('shows every column in the order returned by the API', async () => {
    vi.mocked(listStandings).mockResolvedValue(STANDINGS)
    renderWithProviders(<StandingsPage />)
    await screen.findByRole('link', { name: 'Beta FC' })

    expect(screen.getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Posição',
      'Clube',
      'Jogos',
      'Vitórias',
      'Empates',
      'Derrotas',
      'Gols marcados',
      'Gols sofridos',
      'Saldo',
      'Pontos',
    ])
    const rows = screen.getAllByRole('row').slice(1)
    expect(rows.map((row) => cellTexts(row)[1])).toEqual(['Beta FC', 'Alfa FC', 'Gama FC'])
    expect(cellTexts(rows[1])).toEqual(['2º', 'Alfa FC', '1', '0', '1', '0', '4', '6', '-2', '1'])
    expect(screen.getByRole('link', { name: 'Alfa FC' })).toHaveAttribute('href', '/clubs/2')
  })

  it('shows the empty state', async () => {
    vi.mocked(listStandings).mockResolvedValue([])
    renderWithProviders(<StandingsPage />)

    expect(await screen.findByText('Nenhum clube cadastrado.')).toBeInTheDocument()
  })

  it('shows the API error with a retry', async () => {
    vi.mocked(listStandings).mockRejectedValue(new ApiError('Não foi possível conectar à API.', 0))
    renderWithProviders(<StandingsPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar à API.')
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })
})
