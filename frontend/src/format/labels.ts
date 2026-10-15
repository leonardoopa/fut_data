import type { ClubSort, Condition, PlayerSort, Position, TransactionType } from '../api/types'

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
