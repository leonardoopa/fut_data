import type {
  ClubSort,
  Condition,
  DuelAttribute,
  MatchResult,
  PlayerSort,
  Position,
  TransactionType,
} from '../api/types'
import type { Sector } from '../config/formations'

export const POSITION_LABELS: Record<Position, string> = {
  GOL: 'Goleiro',
  ZAG: 'Zagueiro',
  LAT: 'Lateral',
  MEI: 'Meio-campista',
  ATA: 'Atacante',
}

export const CONDITION_LABELS: Record<Condition, string> = {
  APTO: 'Apto',
  MAL_CONDICIONADO: 'Mal condicionado',
  DOENTE: 'Doente',
}

export const PLAYER_SORT_LABELS: Record<PlayerSort, string> = {
  name: 'Nome (A–Z)',
  value_desc: 'Valor de mercado (maior primeiro)',
  value_asc: 'Valor de mercado (menor primeiro)',
  age_asc: 'Idade (mais novo primeiro)',
  age_desc: 'Idade (mais velho primeiro)',
  position: 'Posição',
}

export const CLUB_SORT_LABELS: Record<ClubSort, string> = {
  name: 'Nome (A–Z)',
  net_worth_desc: 'Patrimônio (maior primeiro)',
  net_worth_asc: 'Patrimônio (menor primeiro)',
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  COMPRA: 'Compra',
  VENDA: 'Venda',
}

export const SECTOR_LABELS: Record<Sector, string> = {
  goalkeeper: 'Goleiro',
  defense: 'Defesa',
  midfield: 'Meio-campo',
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
