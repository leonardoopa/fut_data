import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LeagueProvider } from './components/LeagueProvider'
import { NotificationsProvider } from './components/NotificationsProvider'
import { RefreshProvider } from './components/RefreshProvider'
import { ClubPage } from './pages/clubs/ClubPage'
import { ClubsPage } from './pages/clubs/ClubsPage'
import { HomePage } from './pages/home/HomePage'
import { MatchPage } from './pages/matches/MatchPage'
import { MatchesPage } from './pages/matches/MatchesPage'
import { PlayersPage } from './pages/players/PlayersPage'
import { StandingsPage } from './pages/standings/StandingsPage'

export function App() {
  return (
    <NotificationsProvider>
      <BrowserRouter>
        <RefreshProvider>
          <LeagueProvider>
            <Routes>
              <Route index element={<HomePage />} />
              <Route element={<Layout />}>
                <Route path="/players" element={<PlayersPage />} />
                <Route path="/clubs" element={<ClubsPage />} />
                <Route path="/clubs/:clubId" element={<ClubPage />} />
                <Route path="/matches" element={<MatchesPage />} />
                <Route path="/matches/:matchId" element={<MatchPage />} />
                <Route path="/standings" element={<StandingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </LeagueProvider>
        </RefreshProvider>
      </BrowserRouter>
    </NotificationsProvider>
  )
}
