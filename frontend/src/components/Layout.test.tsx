import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { listClubs } from '../api/clubs'
import { listMatches } from '../api/matches'
import { listPlayers } from '../api/players'
import { CLUBS, makeMatch, makePage } from '../test/fixtures'
import { Layout } from './Layout'
import { LeagueProvider } from './LeagueProvider'
import { NotificationsProvider } from './NotificationsProvider'
import { RefreshProvider } from './RefreshProvider'

vi.mock('../api/clubs')
vi.mock('../api/matches')
vi.mock('../api/players')

function CurrentPage() {
  const location = useLocation()
  return <p>Página {location.pathname}</p>
}

function renderLayout(url: string) {
  render(
    <NotificationsProvider>
      <MemoryRouter initialEntries={[url]}>
        <RefreshProvider>
          <LeagueProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="*" element={<CurrentPage />} />
              </Route>
            </Routes>
          </LeagueProvider>
        </RefreshProvider>
      </MemoryRouter>
    </NotificationsProvider>,
  )
  return userEvent.setup()
}

beforeEach(() => {
  vi.mocked(listClubs).mockResolvedValue(CLUBS)
  vi.mocked(listMatches).mockResolvedValue([makeMatch()])
  vi.mocked(listPlayers).mockResolvedValue(makePage([], 23))
})

describe('Layout', () => {
  it('shows the league summary, the clubs and the breadcrumb of a club page', async () => {
    renderLayout('/clubs/2')

    const sidebar = within(screen.getByRole('complementary', { name: 'Menu' }))
    expect(await sidebar.findByRole('link', { name: 'Jogadores 23' })).toHaveAttribute(
      'href',
      '/players',
    )
    expect(sidebar.getByRole('link', { name: 'Partidas 1' })).toBeInTheDocument()
    expect(sidebar.getByText('1 clube · 23 jogadores')).toBeInTheDocument()
    expect(sidebar.getByText('Alfa FC 2 × 1 Beta FC')).toBeInTheDocument()
    expect(sidebar.getByText('Horário de Brasília (UTC-3)')).toBeInTheDocument()

    const breadcrumb = within(screen.getByRole('navigation', { name: 'Trilha' }))
    expect(breadcrumb.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Mercado',
      'Clubes',
      'Alfa FC',
    ])
    expect(breadcrumb.getByRole('link', { name: 'Clubes' })).toHaveAttribute('href', '/clubs')
  })

  it('reloads the shared data and collapses the menu', async () => {
    const user = renderLayout('/players')
    await screen.findByRole('link', { name: 'Jogadores 23' })

    await user.click(screen.getByRole('button', { name: 'Recarregar dados' }))
    await waitFor(() => expect(listClubs).toHaveBeenCalledTimes(2))
    expect(listMatches).toHaveBeenCalledTimes(2)

    await user.click(screen.getByRole('button', { name: 'Recolher menu' }))
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('opens the new club form from the sidebar', async () => {
    const user = renderLayout('/players')

    await user.click(await screen.findByRole('button', { name: 'Novo clube' }))

    expect(screen.getByText('Página /clubs')).toBeInTheDocument()
  })
})
