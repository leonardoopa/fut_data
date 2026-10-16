import type { Formation, Player, Position } from '../api/types'

export type Sector = 'goalkeeper' | 'defense' | 'midfield' | 'attack'
type OutfieldSector = Exclude<Sector, 'goalkeeper'>

export const SECTOR_POSITIONS: Record<Sector, readonly Position[]> = {
  goalkeeper: ['GOL'],
  defense: ['ZAG', 'LAT'],
  midfield: ['MEI'],
  attack: ['ATA'],
}

const OUTFIELD_SECTORS: readonly OutfieldSector[] = ['defense', 'midfield', 'attack']

const FORMATION_SECTORS: Record<Formation, Record<OutfieldSector, number>> = {
  '3-1': { defense: 3, midfield: 0, attack: 1 },
  '2-2': { defense: 2, midfield: 0, attack: 2 },
  '2-1-1': { defense: 2, midfield: 1, attack: 1 },
  '1-2-1': { defense: 1, midfield: 2, attack: 1 },
}

export const LINEUP_SIZE = 5

export interface LineupSlot {
  sector: Sector
  number: number
}

export const GOALKEEPER_SLOT: LineupSlot = { sector: 'goalkeeper', number: 1 }

export function buildLineupSlots(formation: Formation): LineupSlot[] {
  const outfieldSlots = OUTFIELD_SECTORS.flatMap((sector) =>
    Array.from({ length: FORMATION_SECTORS[formation][sector] }, (_, index) => ({
      sector,
      number: index + 1,
    })),
  )
  return [GOALKEEPER_SLOT, ...outfieldSlots]
}

export function canStart(player: Player): boolean {
  return player.condition !== 'DOENTE'
}

export function fitsSlot(player: Player, slot: LineupSlot): boolean {
  return SECTOR_POSITIONS[slot.sector].includes(player.position)
}
