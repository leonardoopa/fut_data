import type {
  Club,
  ClubDetails,
  Duel,
  Lineup,
  Match,
  MatchDetails,
  Page,
  Player,
  Purchase,
  Sale,
  SquadPlayer,
  Standing,
  Transaction,
  TransactionHistory,
} from '../api/types'

export function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 1,
    name: 'Meia Lua',
    position: 'MEI',
    agility: 85,
    age: 25,
    condition: 'APTO',
    base_value: 40,
    market_value: 1234.5,
    pace: 70,
    shooting: 68,
    passing: 82,
    dribbling: 79,
    defending: 55,
    physical: 64,
    potential: 86,
    overall: 75,
    club_id: null,
    ...overrides,
  }
}

export function makePage(players: Player[], totalItems = players.length, page = 1): Page<Player> {
  return {
    data: players,
    meta: { page, limit: 10, total_items: totalItems, total_pages: Math.ceil(totalItems / 10) },
  }
}

export const CLUBS: Club[] = [
  { id: 2, name: 'Alfa FC', acronym: 'ALF', cash: 300, squad_value: 18, net_worth: 318 },
]

export function makeClub(overrides: Partial<Club> = {}): Club {
  return { ...CLUBS[0], ...overrides }
}

export function makeSquadPlayer(overrides: Partial<SquadPlayer> = {}): SquadPlayer {
  return {
    ...makePlayer({ club_id: 2, market_value: 3.5 }),
    contract: {
      purchase_value: 3,
      loyalty_until: '2027-01-10T10:00:00-03:00',
      remaining_days: 87,
      penalty_rate: 10,
    },
    ...overrides,
  }
}

export function makeClubDetails(players: SquadPlayer[]): ClubDetails {
  return { ...makeClub({ cash: 282, squad_value: 18, net_worth: 300 }), players }
}

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    club_id: 2,
    player_id: 1,
    player_name: 'Meia Lua',
    type: 'COMPRA',
    value: 37,
    fee: 1.85,
    penalty: 0,
    profit: null,
    cash_change: -38.85,
    created_at: '2026-10-14T16:22:59-03:00',
    ...overrides,
  }
}

export function makeHistory(transactions: Transaction[]): TransactionHistory {
  return {
    data: transactions,
    summary: {
      total_spent: 138.85,
      total_received: 135.7,
      total_fees: 12.15,
      total_penalties: 14,
      total_profit: -3,
    },
  }
}

export function makePurchase(overrides: Partial<Purchase> = {}): Purchase {
  return {
    ...makeTransaction(),
    contract: {
      purchase_value: 37,
      loyalty_until: '2027-01-10T10:00:00-03:00',
      status: 'ATIVO',
    },
    club_cash: 261.15,
    ...overrides,
  }
}

export function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    ...makeTransaction({
      id: 2,
      type: 'VENDA',
      value: 40,
      fee: 0.3,
      penalty: 4,
      profit: 3,
      cash_change: 35.7,
    }),
    purchase_value: 37,
    remaining_days: 87,
    penalty_rate: 10,
    contract_status: 'RESCINDIDO',
    club_cash: 317.7,
    ...overrides,
  }
}

export function makeLineup(overrides: Partial<Lineup> = {}): Lineup {
  return { club_id: 2, formation: null, complete: false, players: [], ...overrides }
}

export function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 1,
    played_at: '2026-10-14T19:36:21-03:00',
    home: { club_id: 2, club_name: 'Alfa FC', formation: '2-1-1', goals: 2 },
    away: { club_id: 3, club_name: 'Beta FC', formation: '3-1', goals: 1 },
    result: 'MANDANTE',
    ...overrides,
  }
}

function makeDuel(order: number, attackingClubId: number, goal: boolean): Duel {
  const isHomeAttack = attackingClubId === 2
  return {
    order,
    attacking_club_id: attackingClubId,
    attacker: {
      player_id: order * 10,
      player_name: `Atacante ${order}`,
      position: 'ATA',
      condition: order === 2 ? 'MAL_CONDICIONADO' : 'APTO',
      attribute: 'shooting',
      value: 60 + order,
    },
    defender: {
      player_id: order * 10 + 1,
      player_name: `Defensor ${order}`,
      position: isHomeAttack ? 'ZAG' : 'LAT',
      condition: 'APTO',
      attribute: 'defending',
      value: 50 + order,
    },
    goal,
  }
}

export function makeMatchDetails(overrides: Partial<MatchDetails> = {}): MatchDetails {
  return {
    ...makeMatch(),
    duels: [
      makeDuel(1, 2, true),
      makeDuel(2, 2, false),
      makeDuel(3, 2, true),
      makeDuel(4, 3, true),
      makeDuel(5, 3, false),
      makeDuel(6, 3, false),
    ],
    ...overrides,
  }
}

export function makeStanding(overrides: Partial<Standing> = {}): Standing {
  return {
    position: 1,
    club_id: 2,
    club_name: 'Alfa FC',
    played: 1,
    wins: 1,
    draws: 0,
    losses: 0,
    goals_for: 2,
    goals_against: 1,
    goal_difference: 1,
    points: 3,
    ...overrides,
  }
}
