import type { Condition, PlayerSort, Position } from '../api/types'

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
