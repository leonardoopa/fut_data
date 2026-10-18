import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LeagueProvider } from '../components/LeagueProvider'
import { NotificationsProvider } from '../components/NotificationsProvider'
import { RefreshProvider } from '../components/RefreshProvider'

interface RouteOptions {
  path?: string
  url?: string
  routes?: Record<string, ReactElement>
}

export function renderWithProviders(
  ui: ReactElement,
  { path = '*', url = '/', routes = {} }: RouteOptions = {},
) {
  return render(
    <NotificationsProvider>
      <MemoryRouter initialEntries={[url]}>
        <RefreshProvider>
          <LeagueProvider>
            <Routes>
              <Route path={path} element={ui} />
              {Object.entries(routes).map(([routePath, element]) => (
                <Route key={routePath} path={routePath} element={element} />
              ))}
            </Routes>
          </LeagueProvider>
        </RefreshProvider>
      </MemoryRouter>
    </NotificationsProvider>,
  )
}
