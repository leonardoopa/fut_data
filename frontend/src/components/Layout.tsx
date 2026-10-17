import { Fragment, useState } from 'react'
import { Link, Outlet, matchPath, useLocation } from 'react-router-dom'
import { useLeague, type League } from '../hooks/useLeague'
import { useRefresh } from '../hooks/useRefresh'
import { Icon } from './Icon'
import { Sidebar } from './Sidebar'

const WIDE_SCREEN_QUERY = '(min-width: 1024px)'

interface Crumb {
  label: string
  to?: string
}

const SECTIONS: { path: string; crumbs: Crumb[] }[] = [
  { path: '/players', crumbs: [{ label: 'Mercado' }, { label: 'Jogadores' }] },
  { path: '/clubs', crumbs: [{ label: 'Mercado' }, { label: 'Clubes' }] },
  { path: '/matches', crumbs: [{ label: 'Liga' }, { label: 'Partidas' }] },
  { path: '/standings', crumbs: [{ label: 'Liga' }, { label: 'Classificação' }] },
]

function clubCrumb(clubId: string, league: League): string {
  return league.clubs.data?.find((club) => String(club.id) === clubId)?.name ?? `Clube ${clubId}`
}

function matchCrumb(matchId: string, league: League): string {
  const match = league.matches.data?.find((candidate) => String(candidate.id) === matchId)
  return match
    ? `${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}`
    : `Partida ${matchId}`
}

function buildCrumbs(pathname: string, league: League): Crumb[] {
  const club = matchPath('/clubs/:clubId', pathname)
  if (club?.params.clubId) {
    return [
      { label: 'Mercado' },
      { label: 'Clubes', to: '/clubs' },
      { label: clubCrumb(club.params.clubId, league) },
    ]
  }
  const match = matchPath('/matches/:matchId', pathname)
  if (match?.params.matchId) {
    return [
      { label: 'Liga' },
      { label: 'Partidas', to: '/matches' },
      { label: matchCrumb(match.params.matchId, league) },
    ]
  }
  return SECTIONS.find((section) => section.path === pathname)?.crumbs ?? []
}

function isWideScreen(): boolean {
  return window.matchMedia?.(WIDE_SCREEN_QUERY).matches ?? true
}

export function Layout() {
  const league = useLeague()
  const { refresh } = useRefresh()
  const { pathname } = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(isWideScreen)
  const [lastPathname, setLastPathname] = useState(pathname)

  if (pathname !== lastPathname) {
    setLastPathname(pathname)
    if (!isWideScreen()) setIsSidebarOpen(false)
  }

  const crumbs = buildCrumbs(pathname, league)

  return (
    <div className={isSidebarOpen ? 'layout layout--sidebar-open' : 'layout'}>
      <Sidebar />
      <button
        type="button"
        className="layout__scrim"
        aria-label="Fechar menu"
        tabIndex={-1}
        onClick={() => setIsSidebarOpen(false)}
      />
      <div className="layout__content">
        <header className="topbar">
          <button
            type="button"
            className="icon-button"
            aria-label={isSidebarOpen ? 'Recolher menu' : 'Abrir menu'}
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            <Icon name="panelLeft" />
          </button>
          <nav aria-label="Trilha" className="breadcrumb">
            <ol>
              {crumbs.map((crumb, index) => (
                <Fragment key={crumb.label}>
                  {index > 0 && (
                    <li className="breadcrumb__separator" aria-hidden="true">
                      <Icon name="chevronRight" size={14} />
                    </li>
                  )}
                  <li
                    className="breadcrumb__item"
                    aria-current={index === crumbs.length - 1 ? 'page' : undefined}
                  >
                    {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
                  </li>
                </Fragment>
              ))}
            </ol>
          </nav>
          <button
            type="button"
            className="icon-button topbar__refresh"
            aria-label="Recarregar dados"
            title="Recarregar dados"
            onClick={refresh}
          >
            <Icon name="refresh" />
          </button>
        </header>
        <main className="layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
