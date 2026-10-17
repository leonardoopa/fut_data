import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LEAGUE_NAME } from '../config/league'
import { intentState } from '../hooks/useIntent'
import { useLeague } from '../hooks/useLeague'
import { Icon, type IconName } from './Icon'

interface NavItem {
  to: string
  label: string
  icon: IconName
  count?: number
}

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div className="sidebar__section">
      <p className="sidebar__heading">{title}</p>
      <ul className="sidebar__list">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} className="sidebar__link">
              <Icon name={item.icon} />
              <span className="sidebar__label">{item.label}</span>
              {item.count !== undefined && (
                <>
                  {' '}
                  <span className="sidebar__count">{item.count}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

function countLabel(count: number | undefined, one: string, other: string): string {
  if (count === undefined) return `— ${other}`
  return `${count} ${count === 1 ? one : other}`
}

export function Sidebar() {
  const { clubs, matches, playerCount } = useLeague()
  const navigate = useNavigate()
  const lastMatch = matches.data?.[0]

  return (
    <aside className="sidebar" aria-label="Menu">
      <Link to="/" className="brand">
        <span className="brand__logo" aria-hidden="true">
          P
        </span>
        <span className="brand__text">
          <span className="brand__name">Passe</span>
          <span className="brand__tagline">Gestão da liga</span>
        </span>
      </Link>

      <nav aria-label="Principal" className="sidebar__nav">
        <NavSection
          title="Mercado"
          items={[
            { to: '/players', label: 'Jogadores', icon: 'users', count: playerCount.data },
            { to: '/clubs', label: 'Clubes', icon: 'shield', count: clubs.data?.length },
          ]}
        />
        <NavSection
          title="Liga"
          items={[
            { to: '/matches', label: 'Partidas', icon: 'swords', count: matches.data?.length },
            { to: '/standings', label: 'Classificação', icon: 'listOrdered' },
          ]}
        />
        <div className="sidebar__section">
          <div className="sidebar__heading sidebar__heading--action">
            <p>Clubes</p>
            <button
              type="button"
              className="icon-button icon-button--sm"
              aria-label="Novo clube"
              onClick={() => navigate('/clubs', { state: intentState('createClub') })}
            >
              <Icon name="plus" size={14} />
            </button>
          </div>
          {clubs.data && clubs.data.length > 0 ? (
            <ul className="sidebar__list">
              {clubs.data.map((club) => (
                <li key={club.id}>
                  <NavLink to={`/clubs/${club.id}`} className="sidebar__link">
                    <span className="sidebar__initial" aria-hidden="true">
                      {club.name.normalize('NFD').charAt(0)}
                    </span>
                    <span className="sidebar__label">{club.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="sidebar__empty">Nenhum clube ainda.</p>
          )}
        </div>
      </nav>

      <div className="sidebar__summary">
        <div className="sidebar__summary-row">
          <Icon name="trophy" />
          <div>
            <p className="sidebar__summary-title">{LEAGUE_NAME}</p>
            <p className="sidebar__summary-text">
              {countLabel(clubs.data?.length, 'clube', 'clubes')} ·{' '}
              {countLabel(playerCount.data, 'jogador', 'jogadores')}
            </p>
          </div>
        </div>
        <div className="sidebar__summary-row">
          <Icon name="swords" />
          <div>
            <p className="sidebar__summary-title">Última partida</p>
            <p className="sidebar__summary-text">
              {lastMatch
                ? `${lastMatch.home.club_name} ${lastMatch.home.goals} × ${lastMatch.away.goals} ${lastMatch.away.club_name}`
                : 'nenhuma ainda'}
            </p>
          </div>
        </div>
        <p className="sidebar__timezone">
          <Icon name="clock" size={14} />
          Horário de Brasília (UTC-3)
        </p>
      </div>
    </aside>
  )
}
