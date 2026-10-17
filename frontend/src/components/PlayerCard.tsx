import type { ReactNode } from 'react'
import type { Player } from '../api/types'
import { describePlayer } from '../format/labels'
import { Avatar } from './Avatar'

interface PlayerCardProps {
  player: Player
  aside?: ReactNode
}

export function PlayerCard({ player, aside }: PlayerCardProps) {
  return (
    <div className="player-card">
      <Avatar name={player.name} />
      <div className="player-card__text">
        <p className="player-card__name">{player.name}</p>
        <p className="player-card__meta">{describePlayer(player)}</p>
      </div>
      {aside && <div className="player-card__aside">{aside}</div>}
    </div>
  )
}

export function MarketValueAside({ value }: { value: string }) {
  return (
    <>
      <span className="player-card__aside-label">Valor de mercado</span>
      <strong className="player-card__aside-value">{value}</strong>
    </>
  )
}
