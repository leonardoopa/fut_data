import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { FORMATIONS, type Lineup, type LineupPayload, type Player } from '../../api/types'
import { Button } from '../../components/Button'
import { SelectField } from '../../components/FormField'
import {
  GOALKEEPER_SLOT,
  LINEUP_SIZE,
  SECTOR_POSITIONS,
  buildLineupSlots,
  canStart,
  fitsSlot,
  type LineupSlot,
} from '../../config/formations'
import { CONDITION_LABELS, POSITION_LABELS, SECTOR_LABELS } from '../../format/labels'
import { lineupSchema, type LineupFormValues } from './clubSchemas'

function slotsOf(formation: string): LineupSlot[] {
  const knownFormation = FORMATIONS.find((option) => option === formation)
  return knownFormation ? buildLineupSlots(knownFormation) : [GOALKEEPER_SLOT]
}

function slotLabel(slot: LineupSlot): string {
  const sectorLabel = SECTOR_LABELS[slot.sector]
  return slot.sector === 'goalkeeper' ? sectorLabel : `${sectorLabel} ${slot.number}`
}

function slotHint(slot: LineupSlot, options: Player[]): string {
  if (options.length === 0) return 'Nenhum jogador do elenco disponível para esta vaga.'
  return SECTOR_POSITIONS[slot.sector].map((position) => POSITION_LABELS[position]).join(' ou ')
}

function optionLabel(player: Player): string {
  return `${player.name} (${POSITION_LABELS[player.position]}, ${CONDITION_LABELS[player.condition]})`
}

function assignStarters(slots: LineupSlot[], starters: Player[]): string[] {
  const remaining = [...starters]
  return Array.from({ length: LINEUP_SIZE }, (_, index) => {
    const slot = slots[index]
    const starterIndex = slot ? remaining.findIndex((player) => fitsSlot(player, slot)) : -1
    return starterIndex === -1 ? '' : String(remaining.splice(starterIndex, 1)[0].id)
  })
}

function buildDefaultValues(lineup: Lineup, eligiblePlayers: Player[]): LineupFormValues {
  const formation = lineup.formation ?? ''
  const eligibleIds = new Set(eligiblePlayers.map((player) => player.id))
  const starters = lineup.players.filter((player) => eligibleIds.has(player.id))
  return { formation, player_ids: assignStarters(slotsOf(formation), starters) }
}

interface ClubLineupFormProps {
  lineup: Lineup
  squad: Player[]
  isPending: boolean
  onSave: (payload: LineupPayload) => void
}

export function ClubLineupForm({ lineup, squad, isPending, onSave }: ClubLineupFormProps) {
  const eligiblePlayers = squad.filter(canStart)
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(lineupSchema),
    defaultValues: buildDefaultValues(lineup, eligiblePlayers),
  })
  const [formation, selectedIds] = useWatch({ control, name: ['formation', 'player_ids'] })
  const slots = slotsOf(formation)

  function keepFittingStarters(nextFormation: string) {
    const nextSlots = slotsOf(nextFormation)
    getValues('player_ids').forEach((playerId, index) => {
      const player = eligiblePlayers.find((candidate) => String(candidate.id) === playerId)
      const slot = nextSlots[index]
      if (!player || !slot || !fitsSlot(player, slot)) setValue(`player_ids.${index}`, '')
    })
  }

  function optionsFor(slot: LineupSlot, slotIndex: number): Player[] {
    const takenElsewhere = new Set(selectedIds.filter((_, index) => index !== slotIndex))
    return eligiblePlayers.filter(
      (player) => fitsSlot(player, slot) && !takenElsewhere.has(String(player.id)),
    )
  }

  return (
    <form
      className="card"
      onSubmit={handleSubmit(onSave)}
      noValidate
      aria-label="Edição da escalação"
    >
      <div className="form-grid">
        <SelectField
          label="Formação"
          hint="Defesa, meio-campo e ataque, sempre com 1 goleiro."
          error={errors.formation?.message}
          {...register('formation', {
            onChange: (event) => keepFittingStarters(event.target.value),
          })}
        >
          <option value="">Selecione…</option>
          {FORMATIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </SelectField>
      </div>
      <fieldset className="form-fieldset">
        <legend>Titulares</legend>
        <p className="form-field__hint form-intro">
          Só aparecem jogadores do elenco na posição da vaga. Jogadores doentes não podem ser
          escalados.
        </p>
        <div className="form-grid">
          {slots.map((slot, index) => {
            const options = optionsFor(slot, index)
            return (
              <SelectField
                key={index}
                label={slotLabel(slot)}
                hint={slotHint(slot, options)}
                error={errors.player_ids?.[index]?.message}
                {...register(`player_ids.${index}`)}
              >
                <option value="">Selecione…</option>
                {options.map((player) => (
                  <option key={player.id} value={player.id}>
                    {optionLabel(player)}
                  </option>
                ))}
              </SelectField>
            )
          })}
        </div>
        {slots.length < LINEUP_SIZE && (
          <p className="form-field__hint">Escolha a formação para ver as vagas de linha.</p>
        )}
      </fieldset>
      <div className="form-actions">
        <Button type="submit" isPending={isPending}>
          {isPending ? 'Salvando…' : 'Salvar escalação'}
        </Button>
      </div>
    </form>
  )
}
