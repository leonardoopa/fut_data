import type { Club, Page, Player } from '../api/types'

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
