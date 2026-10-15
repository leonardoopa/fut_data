import { NavLink, Outlet } from 'react-router-dom'

const NAVIGATION = [{ to: '/players', label: 'Jogadores' }]

export function Layout() {
  return (
    <div className="layout">
      <header className="layout__header">
        <div className="layout__bar">
          <span className="layout__brand">Passe</span>
          <nav aria-label="Principal">
            <ul className="layout__nav">
              {NAVIGATION.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} className="layout__link">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  )
}
