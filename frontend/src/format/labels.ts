import type {
  ClubSort,
  Condition,
  ContractStatus,
  DuelAttribute,
  MatchResult,
  Player,
  PlayerSort,
  Position,
  TransactionType,
} from '../api/types'
import type { Sector } from '../config/formations'

export const POSITION_LABELS: Record<Position, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campo',
  ATA: 'Atacante',
}

export const CONDITION_LABELS: Record<Condition, string> = {
  APTO: 'Apto',
  MAL_CONDICIONADO: 'Mal condicionado',
  DOENTE: 'Doente',
}

export const PLAYER_SORT_LABELS: Record<PlayerSort, string> = {
  name: 'Nome',
  value_desc: 'Maior valor de mercado',
  value_asc: 'Menor valor de mercado',
  age_desc: 'Maior idade',
  age_asc: 'Menor idade',
  position: 'Posição (GOL a ATA)',
}

export const CLUB_SORT_LABELS: Record<ClubSort, string> = {
  name: 'Nome',
  net_worth_desc: 'Patrimônio (maior para o menor)',
  net_worth_asc: 'Patrimônio (menor para o maior)',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  COMPRA: 'Compra',
  VENDA: 'Venda',
}

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  ATIVO: 'ATIVO',
  ENCERRADO: 'ENCERRADO',
  RESCINDIDO: 'RESCINDIDO',
}

export const SECTOR_LABELS: Record<Sector, string> = {
  goalkeeper: 'Goleiro',
  defense: 'Defesa',
  midfield: 'Meio',
  attack: 'Ataque',
}

export const MATCH_RESULT_LABELS: Record<MatchResult, string> = {
  MANDANTE: 'Vitória do mandante',
  VISITANTE: 'Vitória do visitante',
  EMPATE: 'Empate',
}

export const DUEL_ATTRIBUTE_LABELS: Record<DuelAttribute, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  defending: 'Defesa',
}

export function describePlayer(player: Player): string {
  return `${player.position} · ${POSITION_LABELS[player.position]} · ${player.age} anos`
}
