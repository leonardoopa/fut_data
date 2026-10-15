import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { NotificationsProvider } from './components/NotificationsProvider'
import { PlayersPage } from './pages/players/PlayersPage'

export function App() {
  return (
    <NotificationsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/players" element={<PlayersPage />} />
            <Route path="*" element={<Navigate to="/players" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationsProvider>
  )
}
