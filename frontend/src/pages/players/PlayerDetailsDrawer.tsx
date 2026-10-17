import type { Club, Player } from '../../api/types'
import { AttributeBar } from '../../components/AttributeBar'
import { Avatar } from '../../components/Avatar'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ConditionBadge } from '../../components/ConditionBadge'
import { Modal } from '../../components/Modal'
import { StatGrid } from '../../components/StatGrid'
import { SummaryList } from '../../components/SummaryList'
import { formatMoney } from '../../format/money'
import { PlayerClub } from './PlayerCells'

const ATTRIBUTES = [
  { key: 'pace', label: 'Velocidade' },
  { key: 'shooting', label: 'Finalização' },
  { key: 'passing', label: 'Passe' },
  { key: 'dribbling', label: 'Drible' },
  { key: 'defending', label: 'Defesa' },
  { key: 'physical', label: 'Físico' },
] as const

interface PlayerDetailsDrawerProps {
  player: Player
  clubsById: Map<number, Club>
  onEdit: () => void
  onChangeCondition: () => void
  onBuy: () => void
  onClose: () => void
}

export function PlayerDetailsDrawer({
  player,
  clubsById,
  onEdit,
  onChangeCondition,
  onBuy,
  onClose,
}: PlayerDetailsDrawerProps) {
  const isFree = player.club_id === null

  return (
    <Modal
      variant="drawer"
      title={player.name}
      icon={<Avatar name={player.name} size="lg" />}
      description={
        <span className="drawer-badges">
          <Badge tone="outline">{player.position}</Badge>
          <ConditionBadge condition={player.condition} />
          {isFree && <Badge tone="neutral">Livre</Badge>}
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" icon="pencil" onClick={onEdit}>
            Editar
          </Button>
          <Button variant="secondary" icon="heartPulse" onClick={onChangeCondition}>
            Alterar condição
          </Button>
          {isFree && (
            <Button icon="cart" onClick={onBuy}>
              Comprar
            </Button>
          )}
        </>
      }
    >
      <StatGrid
        label="Valores do jogador"
        variant="cards"
        items={[
          {
            label: 'Valor de mercado',
            icon: 'tag',
            value: formatMoney(player.market_value),
            caption: 'Calculado a cada consulta',
          },
          {
            label: 'Valor base',
            icon: 'tag',
            value: formatMoney(player.base_value),
            caption: 'Calculado no cadastro',
          },
          {
            label: 'Overall',
            icon: 'barChart',
            value: player.overall,
            caption: 'Calculado pela posição',
          },
          {
            label: 'Potencial',
            icon: 'trendingUp',
            value: player.potential,
            caption: 'Informado no cadastro',
          },
        ]}
      />
      <section className="drawer-section" aria-label="Indicadores técnicos">
        <div className="drawer-section__header">
          <h3 className="drawer-section__title">Indicadores técnicos</h3>
          <span className="drawer-section__hint">Escala de 1 a 99</span>
        </div>
        <ul className="attribute-list">
          {ATTRIBUTES.map((attribute) => (
            <li key={attribute.key}>
              <span>{attribute.label}</span>
              <AttributeBar
                value={player[attribute.key]}
                ceiling={player.potential}
                tone="primary"
              />
              <strong>{player[attribute.key]}</strong>
            </li>
          ))}
        </ul>
        <p className="attribute-legend">
          <span>Valor do atributo</span>
          <span>Até o potencial ({player.potential})</span>
        </p>
      </section>
      <SummaryList
        label="Dados do jogador"
        items={[
          { label: 'Idade', value: `${player.age} anos` },
          { label: 'Agilidade', value: player.agility },
          { label: 'Clube', value: <PlayerClub clubId={player.club_id} clubsById={clubsById} /> },
        ]}
      />
    </Modal>
  )
}
