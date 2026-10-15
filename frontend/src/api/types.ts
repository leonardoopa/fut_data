export const POSITIONS = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const
export type Position = (typeof POSITIONS)[number]

export const CONDITIONS = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const
export type Condition = (typeof CONDITIONS)[number]

export const PLAYER_SORTS = [
  'name',
  'value_desc',
  'value_asc',
  'age_asc',
  'age_desc',
  'position',
] as const
export type PlayerSort = (typeof PLAYER_SORTS)[number]

export interface PageMeta {
  page: number
  limit: number
  total_items: number
  total_pages: number
}

export interface Page<T> {
  data: T[]
  meta: PageMeta
}

export interface Player {
  id: number
  name: string
  position: Position
  agility: number
  age: number
  condition: Condition
  base_value: number
  market_value: number
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
  potential: number
  overall: number
  club_id: number | null
}

export interface Club {
  id: number
  name: string
  acronym: string
  cash: number
  squad_value: number
  net_worth: number
}

export type PlayerFilters = {
  search?: string
  position?: Position
  condition?: Condition
  free?: boolean
  club_id?: number
  min_age?: number
  max_age?: number
  min_value?: number
  max_value?: number
}

export type PlayerListQuery = PlayerFilters & {
  sort?: PlayerSort
  page: number
  limit: number
}

export interface PlayerProfilePayload {
  name: string
  position: Position
  agility: number
  age: number
}

export interface PlayerRegistrationPayload extends PlayerProfilePayload {
  pace: number
  shooting: number
  passing: number
  dribbling: number
  defending: number
  physical: number
  potential: number
}

export interface PlayerConditionPayload {
  condition: Condition
}
