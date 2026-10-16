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

export const CLUB_SORTS = ['name', 'net_worth_desc', 'net_worth_asc'] as const
export type ClubSort = (typeof CLUB_SORTS)[number]

export const TRANSACTION_TYPES = ['COMPRA', 'VENDA'] as const
export type TransactionType = (typeof TRANSACTION_TYPES)[number]

export type ContractStatus = 'ATIVO' | 'ENCERRADO' | 'RESCINDIDO'

export interface Club {
  id: number
  name: string
  acronym: string
  cash: number
  squad_value: number
  net_worth: number
}

export interface ContractTerms {
  purchase_value: number
  loyalty_until: string
  remaining_days: number
  penalty_rate: number
}

export interface SquadPlayer extends Player {
  contract: ContractTerms
}

export interface ClubDetails extends Club {
  players: SquadPlayer[]
}

export interface ClubRegistrationPayload {
  name: string
  acronym: string
}

export interface Transaction {
  id: number
  club_id: number
  player_id: number
  player_name: string
  type: TransactionType
  value: number
  fee: number
  penalty: number
  profit: number | null
  cash_change: number
  created_at: string
}

export interface TransactionSummary {
  total_spent: number
  total_received: number
  total_fees: number
  total_penalties: number
  total_profit: number
}

export interface TransactionHistory {
  data: Transaction[]
  summary: TransactionSummary
}

export interface TransactionFilters {
  types: TransactionType[]
  player_id?: number
}

export interface PurchasePayload {
  club_id: number
  loyalty_until: string
}

export interface Purchase extends Transaction {
  contract: {
    purchase_value: number
    loyalty_until: string
    status: ContractStatus
  }
  club_cash: number
}

export interface Sale extends Transaction {
  purchase_value: number
  remaining_days: number
  penalty_rate: number
  contract_status: ContractStatus
  club_cash: number
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

export const FORMATIONS = ['3-1', '2-2', '2-1-1', '1-2-1'] as const
export type Formation = (typeof FORMATIONS)[number]

export interface Lineup {
  club_id: number
  formation: Formation | null
  complete: boolean
  players: Player[]
}

export interface LineupPayload {
  formation: Formation
  player_ids: number[]
}

export type MatchResult = 'MANDANTE' | 'VISITANTE' | 'EMPATE'
export type DuelAttribute = 'shooting' | 'passing' | 'dribbling' | 'defending'

export interface MatchSide {
  club_id: number
  club_name: string
  formation: Formation
  goals: number
}

export interface Match {
  id: number
  played_at: string
  home: MatchSide
  away: MatchSide
  result: MatchResult
}

export interface DuelPlayer {
  player_id: number
  player_name: string
  position: Position
  condition: Condition
  attribute: DuelAttribute
  value: number
}

export interface Duel {
  order: number
  attacking_club_id: number
  attacker: DuelPlayer
  defender: DuelPlayer
  goal: boolean
}

export interface MatchDetails extends Match {
  duels: Duel[]
}

export interface MatchPayload {
  home_club_id: number
  away_club_id: number
}

export type MatchFilters = {
  club_id?: number
}

export interface Standing {
  position: number
  club_id: number
  club_name: string
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}
