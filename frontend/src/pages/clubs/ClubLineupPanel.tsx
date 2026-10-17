import type { ClubDetails, Lineup, Player } from '../../api/types'
import { Avatar, Identity } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Card } from '../../components/Card'
import { ConditionBadge } from '../../components/ConditionBadge'
import { Icon } from '../../components/Icon'
import { Notice } from '../../components/Notice'
import { Pitch } from '../../components/Pitch'
import { ErrorState, LoadingState } from '../../components/StatePanel'
import {
  GOALKEEPER_SLOT,
  arrangeOnField,
  buildLineupSlots,
  fitsSlot,
  type Sector,
} from '../../config/formations'
import { POSITION_LABELS, SECTOR_LABELS } from '../../format/labels'
import { initialsOf } from '../../format/names'
import type { ClubLineup } from '../../hooks/useClubLineup'
import { ClubLineupForm } from './ClubLineupForm'

interface FieldEntry {
  key: string
  sector: Sector
  player?: Player
}

function fieldEntries(lineup: Lineup): FieldEntry[] {
  const slots = lineup.formation ? buildLineupSlots(lineup.formation) : [GOALKEEPER_SLOT]
  const remaining = [...lineup.players]
  return slots.map((slot, index) => {
    const playerIndex = remaining.findIndex((player) => fitsSlot(player, slot))
    const player = playerIndex === -1 ? undefined : remaining.splice(playerIndex, 1)[0]
    return { key: player ? String(player.id) : `slot-${index}`, sector: slot.sector, player }
  })
}

function LineupPitch({ lineup }: { lineup: Lineup }) {
  const spots = arrangeOnField(
    fieldEntries(lineup).map((entry) => ({ item: entry, sector: entry.sector })),
  )
  return (
    <Pitch
      label="Em campo"
      orientation="vertical"
      markers={spots.map(({ item, depth, spread }) => ({
        key: item.key,
        x: spread * 100,
        y: 100 - depth * 100,
        label: item.player?.name ?? 'Vaga',
        initials: item.player ? initialsOf(item.player.name) : '',
        detail: item.player
          ? `${item.player.position} · ${item.player.overall}`
          : SECTOR_LABELS[item.sector],
        tone: item.player ? 'home' : 'empty',
        flags: item.player?.condition === 'MAL_CONDICIONADO' && (
          <span className="pitch__flag pitch__flag--warning">
            <Icon name="alertTriangle" size={10} />
          </span>
        ),
      }))}
    />
  )
}

function ReservesList({ reserves }: { reserves: Player[] }) {
  if (reserves.length === 0) {
    return <p className="card__body muted">Todo o elenco está na escalação.</p>
  }
  return (
    <ul className="reserve-list" aria-label="Reservas">
      {reserves.map((player) => (
        <li key={player.id}>
          <Identity
            visual={<Avatar name={player.name} size="sm" />}
            title={player.name}
            subtitle={POSITION_LABELS[player.position]}
          />
          {player.condition !== 'APTO' && <ConditionBadge condition={player.condition} />}
          {player.condition === 'DOENTE' && (
            <p className="reserve-list__note">Doente não pode ser escalado.</p>
          )}
        </li>
      ))}
    </ul>
  )
}

function formKey(lineup: Lineup, squad: Player[]): string {
  return [
    lineup.formation,
    ...lineup.players.map((player) => player.id),
    ...squad.map((player) => `${player.id}:${player.condition}`),
  ].join('|')
}

interface ClubLineupPanelProps {
  club: ClubDetails
  lineup: ClubLineup
}

export function ClubLineupPanel({ club, lineup }: ClubLineupPanelProps) {
  const saved = lineup.data
  if (lineup.error) {
    return (
      <ErrorState
        title="Não foi possível carregar a escalação"
        error={lineup.error}
        onRetry={lineup.reload}
      />
    )
  }
  if (!saved) {
    return (
      <Card title="Titulares">
        <LoadingState label="Carregando escalação…" />
      </Card>
    )
  }

  const starterIds = new Set(saved.players.map((player) => player.id))
  const reserves = club.players.filter((player) => !starterIds.has(player.id))

  return (
    <>
      {!saved.complete && (
        <Notice
          tone="warning"
          title={`Escalação incompleta: o ${club.name} não pode jogar partidas`}
        >
          A escalação precisa de 1 goleiro e dos 4 jogadores de linha da formação. Escolha os
          titulares e salve; sem isso, a partida é recusada pela API.
        </Notice>
      )}
      <div className="lineup-layout">
        <Card
          title="Titulares"
          description="1 goleiro e 4 jogadores de linha, na formação escolhida. Salvar troca os 5 de uma vez."
          actions={
            <Badge
              tone={saved.complete ? 'success' : 'warning'}
              icon={saved.complete ? 'checkCircle' : 'alertTriangle'}
            >
              {saved.complete ? 'Completa' : 'Incompleta'}
            </Badge>
          }
        >
          <ClubLineupForm
            key={formKey(saved, club.players)}
            lineup={saved}
            squad={club.players}
            isPending={lineup.save.isPending}
            error={lineup.save.error}
            onSave={lineup.save.run}
          />
        </Card>
        <div className="lineup-side">
          <Card
            title="Em campo"
            description={
              saved.formation
                ? `Escalação salva na formação ${saved.formation}, goleiro embaixo.`
                : 'Nenhuma escalação salva ainda.'
            }
          >
            <div className="card__body">
              <LineupPitch lineup={saved} />
              <Notice tone="neutral" icon="swords">
                Na partida, atacam os 3 jogadores de linha mais avançados e defendem o goleiro e os
                2 mais recuados.
              </Notice>
            </div>
          </Card>
          <Card title="Reservas" description="Jogadores do elenco fora da escalação.">
            <ReservesList reserves={reserves} />
          </Card>
        </div>
      </div>
    </>
  )
}
