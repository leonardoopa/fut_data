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
