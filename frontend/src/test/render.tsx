import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { NotificationsProvider } from '../components/NotificationsProvider'

interface RouteOptions {
  path?: string
  url?: string
}

export function renderWithProviders(
  ui: ReactElement,
  { path = '*', url = '/' }: RouteOptions = {},
) {
  return render(
    <NotificationsProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </NotificationsProvider>,
  )
}
