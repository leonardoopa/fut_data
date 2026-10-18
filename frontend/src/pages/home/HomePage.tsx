import { Fragment, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icon, type IconName } from '../../components/Icon'
import { LEAGUE_NAME } from '../../config/league'
import { useLeague } from '../../hooks/useLeague'
import { useStandings } from '../../hooks/useStandings'

const START_PATH = '/players'

const STEPS: { icon: IconName; title: string; text: string; to: string }[] = [
  {
    icon: 'users',
    title: 'Jogadores',
    text: 'Nascem livres e Aptos; o valor de mercado vem da condição, da agilidade e da idade.',
    to: '/players',
  },
  {
    icon: 'shield',
    title: 'Clubes',
    text: 'Começam com 300,00 em caixa e sem jogadores.',
    to: '/clubs',
  },
  {
    icon: 'cart',
    title: 'Compra',
    text: 'Valor + taxa, até 50% do caixa, com contrato de fidelidade.',
    to: '/players',
  },
  {
    icon: 'swap',
    title: 'Venda',
    text: 'Multa antes do fim da fidelidade e comissão sobre o lucro.',
    to: '/clubs',
  },
  {
    icon: 'history',
    title: 'Histórico',
    text: 'Toda compra e venda fica registrada, com totais e CSV.',
    to: '/clubs',
  },
  {
    icon: 'trophy',
    title: 'Liga',
    text: 'Escale 5 titulares e jogue partidas que entram na classificação.',
    to: '/matches',
  },
]

function count(value: number | undefined, one: string, other: string): string {
  if (value === undefined) return `— ${other}`
  return `${value} ${value === 1 ? one : other}`
}

export function HomePage() {
  const navigate = useNavigate()
  const { clubs, matches, playerCount } = useLeague()
  const standings = useStandings()
  const leader = matches.data && matches.data.length > 0 ? standings.data?.[0] : undefined

  useEffect(() => {
    function startOnEnter(event: KeyboardEvent) {
      if (event.key === 'Enter' && event.target === document.body) navigate(START_PATH)
    }
    document.addEventListener('keydown', startOnEnter)
    return () => document.removeEventListener('keydown', startOnEnter)
  }, [navigate])

  return (
    <main className="home">
      <div className="home__field">
        <div className="home__hero">
          <p className="home__brand">
            <span className="brand__logo brand__logo--lg" aria-hidden="true">
              P
            </span>
            Passe
          </p>
          <p className="home__league">
            <span className="home__dot" aria-hidden="true" />
            {LEAGUE_NAME} ·{' '}
            {leader
              ? `líder: ${leader.club_name}, ${leader.points} ${leader.points === 1 ? 'ponto' : 'pontos'}`
              : 'nenhuma partida ainda'}
          </p>
          <h1 className="home__title">Gestão da liga, do mercado à classificação</h1>
          <p className="home__text">
            Cadastre jogadores, monte os clubes e negocie com contrato de fidelidade. Depois, escale
            os titulares e jogue partidas com placar calculado pelos atributos.
          </p>
          <div className="home__actions">
            <Link to={START_PATH} className="button button--primary home__start">
              Iniciar
              <Icon name="arrowRight" />
            </Link>
            <span className="home__hint">
              ou tecle <kbd>Enter</kbd>
            </span>
          </div>
          <ul className="home__stats" aria-label="Números da liga">
            <li>
              <Icon name="users" size={14} />
              {count(playerCount.data, 'jogador', 'jogadores')}
            </li>
            <li>
              <Icon name="shield" size={14} />
              {count(clubs.data?.length, 'clube', 'clubes')}
            </li>
            <li>
              <Icon name="swords" size={14} />
              {count(matches.data?.length, 'partida', 'partidas')}
            </li>
            <li>
              <Icon name="checkCircle" size={14} />
              Não precisa de login
            </li>
          </ul>
        </div>
        <ol className="home__steps">
          {STEPS.map((step, index) => (
            <Fragment key={step.title}>
              {index > 0 && (
                <li className="home__arrow" aria-hidden="true">
                  <Icon name="chevronRight" size={14} />
                </li>
              )}
              <li>
                <Link to={step.to} className="home__step">
                  <span className="home__step-head">
                    <Icon name={step.icon} />
                    <span className="home__step-number">{String(index + 1).padStart(2, '0')}</span>
                  </span>
                  <span className="home__step-title">{step.title}</span>
                  <span className="home__step-text">{step.text}</span>
                </Link>
              </li>
            </Fragment>
          ))}
        </ol>
        <p className="home__footer">
          <Icon name="clock" size={14} />
          {LEAGUE_NAME} · Horário de Brasília (UTC-3)
        </p>
      </div>
    </main>
  )
}
