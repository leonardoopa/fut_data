import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { NotificationsProvider } from './components/NotificationsProvider'
import { ClubPage } from './pages/clubs/ClubPage'
import { ClubsPage } from './pages/clubs/ClubsPage'
import { MatchPage } from './pages/matches/MatchPage'
import { MatchesPage } from './pages/matches/MatchesPage'
import { PlayersPage } from './pages/players/PlayersPage'
import { StandingsPage } from './pages/standings/StandingsPage'

export function App() {
  return (
    <NotificationsProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/clubs" element={<ClubsPage />} />
            <Route path="/clubs/:clubId" element={<ClubPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/matches/:matchId" element={<MatchPage />} />
            <Route path="/standings" element={<StandingsPage />} />
            <Route path="*" element={<Navigate to="/players" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationsProvider>
  )
}
