import type { MatchDetails } from '../../api/types'
import { Card } from '../../components/Card'
import { Icon } from '../../components/Icon'
import { Pitch, type PitchMarker } from '../../components/Pitch'
import { DUEL_ATTRIBUTE_LABELS } from '../../format/labels'
import { initialsOf, lowerFirst } from '../../format/names'
import { placeSidePlayers, type FieldPlayer } from './matchLineups'
import { SIDE_LABELS, type SideKey } from './matchSides'

const SHORT_ATTRIBUTE_LENGTH = 3
const SIDE_KEYS: SideKey[] = ['home', 'away']

function describeAppearances({ player, appearances }: FieldPlayer): string {
  const values = appearances.map(
    (appearance) =>
      `${DUEL_ATTRIBUTE_LABELS[appearance.attribute].slice(0, SHORT_ATTRIBUTE_LENGTH)} ${appearance.value}`,
  )
  return [player.position, ...values].join(' · ')
}

function PlayerFlags({ fieldPlayer }: { fieldPlayer: FieldPlayer }) {
  return (
    <>
      {fieldPlayer.player.condition === 'MAL_CONDICIONADO' && (
        <span className="pitch__flag pitch__flag--warning">
          <Icon name="alertTriangle" size={10} />
        </span>
      )}
      {fieldPlayer.scored && (
        <span className="pitch__flag">
          <Icon name="ball" size={12} />
        </span>
      )}
    </>
  )
}

function buildMarkers(match: MatchDetails): PitchMarker[] {
  return SIDE_KEYS.flatMap((sideKey) =>
    placeSidePlayers(match, sideKey).map((fieldPlayer) => ({
      key: `${sideKey}-${fieldPlayer.player.player_id}`,
      x: fieldPlayer.x,
      y: fieldPlayer.y,
      label: fieldPlayer.player.player_name,
      initials: initialsOf(fieldPlayer.player.player_name),
      detail: describeAppearances(fieldPlayer),
      tone: sideKey,
      flags: <PlayerFlags fieldPlayer={fieldPlayer} />,
    })),
  )
}

function TeamTag({ match, sideKey }: { match: MatchDetails; sideKey: SideKey }) {
  const side = match[sideKey]
  return (
    <p className={`pitch-team pitch-team--${sideKey}`}>
      <span className="pitch-team__dot" aria-hidden="true" />
      {side.club_name} · {side.formation} · {lowerFirst(SIDE_LABELS[sideKey])}
    </p>
  )
}

export function MatchPitchCard({ match }: { match: MatchDetails }) {
  return (
    <Card
      title="Em campo"
      description="Os titulares de cada clube na formação da partida, com o atributo e o valor usados nos duelos."
      actions={
        <ul className="pitch-legend" aria-label="Legenda do campo">
          <li>
            <span className="pitch-legend__dot" aria-hidden="true" />
            Mal condicionado
          </li>
          <li>
            <Icon name="ball" size={12} />
            Gol no duelo
          </li>
        </ul>
      }
    >
      <div className="card__body match-pitch">
        <Pitch
          label={`Titulares de ${match.home.club_name} e ${match.away.club_name}`}
          orientation="horizontal"
          markers={buildMarkers(match)}
        >
          {SIDE_KEYS.map((sideKey) => (
            <TeamTag key={sideKey} match={match} sideKey={sideKey} />
          ))}
        </Pitch>
      </div>
    </Card>
  )
}
