import { useId } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { StatePanel, type StateContent } from '../../components/StatePanel'
import { useIntentToggle } from '../../hooks/useIntent'
import { useLeague } from '../../hooks/useLeague'
import { MatchHistoryCard } from './MatchHistoryCard'
import { DuelsLink, MatchScoreboard } from './MatchScoreboard'
import { PlayMatchDialog } from './PlayMatchDialog'
import './matches.css'

export function MatchesPage() {
  const { matches } = useLeague()
  const [isPlaying, setIsPlaying] = useIntentToggle('playMatch')
  const lastMatchTitleId = useId()
  const lastMatch = matches.data?.[0]
  const hasNoMatches = matches.data?.length === 0

  const emptyLeague: StateContent = {
    icon: 'swords',
    title: 'Nenhuma partida jogada',
    description:
      'Escale os 5 titulares dos dois clubes e jogue a primeira partida. O resultado aparece aqui e na classificação.',
    action: (
      <Button variant="secondary" size="sm" icon="plus" onClick={() => setIsPlaying(true)}>
        Nova partida
      </Button>
    ),
  }

  return (
    <section className="page">
      <PageHeader
        icon="swords"
        title="Partidas"
        subtitle="Jogue partidas entre clubes com os 5 titulares escalados e acompanhe o histórico."
        actions={
          <Button icon="plus" onClick={() => setIsPlaying(true)}>
            Nova partida
          </Button>
        }
      />

      {hasNoMatches ? (
        <>
          <Card>
            <StatePanel {...emptyLeague} />
          </Card>
          <p className="page-note">
            Nenhuma partida jogada ainda. A classificação continua com todos os clubes, zerados.
          </p>
        </>
      ) : (
        <>
          {lastMatch && (
            <section className="last-match" aria-labelledby={lastMatchTitleId}>
              <h2 id={lastMatchTitleId} className="section-label">
                Última partida
              </h2>
              <Card>
                <div className="card__body">
                  <MatchScoreboard
                    match={lastMatch}
                    action={<DuelsLink match={lastMatch} variant="button" />}
                  />
                </div>
              </Card>
            </section>
          )}
          <MatchHistoryCard emptyLeague={emptyLeague} />
          <p className="page-note">
            Partidas da mais recente para a mais antiga, com filtro por clube. “Ver duelos” abre a
            partida.
          </p>
        </>
      )}

      {isPlaying && <PlayMatchDialog onClose={() => setIsPlaying(false)} />}
    </section>
  )
}
