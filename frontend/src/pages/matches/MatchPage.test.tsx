import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { getMatch } from '../../api/matches'
import { makeMatchDetails } from '../../test/fixtures'
import { summaryValue } from '../../test/queries'
import { renderWithProviders } from '../../test/render'
import { MatchPage } from './MatchPage'

vi.mock('../../api/matches')

function renderPage(matchId: number) {
  renderWithProviders(<MatchPage />, { path: '/matches/:matchId', url: `/matches/${matchId}` })
}

describe('MatchPage', () => {
  it('opens the match with its score and the six duels from the API', async () => {
    vi.mocked(getMatch).mockResolvedValue(makeMatchDetails({ id: 5 }))
    renderPage(5)

    expect(await screen.findByRole('heading', { name: 'Alfa FC × Beta FC' })).toBeInTheDocument()
    expect(getMatch).toHaveBeenCalledWith(5)
    expect(screen.getByText('2 × 1')).toBeInTheDocument()
    expect(summaryValue('Data e hora')).toMatch(/^14\/10\/2026,? 19:36$/)
    const table = within(screen.getByRole('table', { name: 'Duelos da partida' }))
    expect(table.getAllByRole('row').slice(1)).toHaveLength(6)
    expect(table.getAllByText('Gol', { selector: '.badge' })).toHaveLength(3)
  })

  it('shows the API message when the match does not exist', async () => {
    vi.mocked(getMatch).mockRejectedValue(new ApiError('Partida não encontrada.', 404))
    renderPage(99)

    expect(await screen.findByRole('alert')).toHaveTextContent('Partida não encontrada.')
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
