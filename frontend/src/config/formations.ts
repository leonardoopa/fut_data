import type { DuelAttribute, Formation, Player, Position } from '../api/types'

export type Sector = 'goalkeeper' | 'defense' | 'midfield' | 'attack'
type OutfieldSector = Exclude<Sector, 'goalkeeper'>

export const SECTOR_POSITIONS: Record<Sector, readonly Position[]> = {
  goalkeeper: ['GOL'],
  defense: ['ZAG', 'LAT'],
  midfield: ['MEI'],
  attack: ['ATA'],
}

const SECTORS: readonly Sector[] = ['goalkeeper', 'defense', 'midfield', 'attack']
const OUTFIELD_SECTORS: readonly OutfieldSector[] = ['defense', 'midfield', 'attack']

const FORMATION_SECTORS: Record<Formation, Record<OutfieldSector, number>> = {
  '3-1': { defense: 3, midfield: 0, attack: 1 },
  '2-2': { defense: 2, midfield: 0, attack: 2 },
  '2-1-1': { defense: 2, midfield: 1, attack: 1 },
  '1-2-1': { defense: 1, midfield: 2, attack: 1 },
}

const OUTFIELD_SECTOR_NAMES: Record<OutfieldSector, string> = {
  defense: 'defesa',
  midfield: 'meio',
  attack: 'ataque',
}

export const POSITION_DUEL_ATTRIBUTES: Record<Position, readonly DuelAttribute[]> = {
  GOL: ['defending'],
  ZAG: ['dribbling', 'defending'],
  LAT: ['dribbling', 'defending'],
  MEI: ['passing'],
  ATA: ['shooting'],
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

export function describeFormation(formation: Formation): string {
  const parts = OUTFIELD_SECTORS.filter((sector) => FORMATION_SECTORS[formation][sector] > 0).map(
    (sector) => `${OUTFIELD_SECTOR_NAMES[sector]} ${FORMATION_SECTORS[formation][sector]}`,
  )
  const text = parts.join(', ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function sectorOf(position: Position): Sector {
  return SECTORS.find((sector) => SECTOR_POSITIONS[sector].includes(position)) ?? 'goalkeeper'
}

export function canStart(player: Player): boolean {
  return player.condition !== 'DOENTE'
}

export function fitsSlot(player: Player, slot: LineupSlot): boolean {
  return SECTOR_POSITIONS[slot.sector].includes(player.position)
}

const SECTOR_DEPTH: Record<Sector, number> = {
  goalkeeper: 0.08,
  defense: 0.32,
  midfield: 0.56,
  attack: 0.8,
}

export interface FieldSpot<Item> {
  item: Item
  sector: Sector
  depth: number
  spread: number
}

export function arrangeOnField<Item>(entries: { item: Item; sector: Sector }[]): FieldSpot<Item>[] {
  return SECTORS.flatMap((sector) => {
    const inSector = entries.filter((entry) => entry.sector === sector)
    return inSector.map((entry, index) => ({
      item: entry.item,
      sector,
      depth: SECTOR_DEPTH[sector],
      spread: (index + 1) / (inSector.length + 1),
    }))
  })
}
