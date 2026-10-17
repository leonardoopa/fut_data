import { zodResolver } from '@hookform/resolvers/zod'
import { useController, useForm, useWatch } from 'react-hook-form'
import {
  FORMATIONS,
  type Formation,
  type Lineup,
  type LineupPayload,
  type Player,
} from '../../api/types'
import { Identity } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { ConditionBadge } from '../../components/ConditionBadge'
import { DataTable, type Column } from '../../components/DataTable'
import { ChoiceField, SelectField } from '../../components/FormField'
import { Icon } from '../../components/Icon'
import { ActionErrorNotice, Notice } from '../../components/Notice'
import { Pitch } from '../../components/Pitch'
import {
  GOALKEEPER_SLOT,
  LINEUP_SIZE,
  POSITION_DUEL_ATTRIBUTES,
  SECTOR_POSITIONS,
  arrangeOnField,
  buildLineupSlots,
  canStart,
  describeFormation,
  fitsSlot,
  type LineupSlot,
} from '../../config/formations'
import { DUEL_ATTRIBUTE_LABELS, SECTOR_LABELS } from '../../format/labels'
import type { ActionError } from '../../hooks/useAction'
import { lineupSchema, type LineupFormValues } from './clubSchemas'

interface SlotRow {
  slot: LineupSlot
  index: number
}

function knownFormation(formation: string): Formation | undefined {
  return FORMATIONS.find((option) => option === formation)
}

function slotsOf(formation: string): LineupSlot[] {
  const known = knownFormation(formation)
  return known ? buildLineupSlots(known) : [GOALKEEPER_SLOT]
}

function slotLabel(slot: LineupSlot): string {
  const sectorLabel = SECTOR_LABELS[slot.sector]
  return slot.sector === 'goalkeeper' ? sectorLabel : `${sectorLabel} ${slot.number}`
}

function assignStarters(slots: LineupSlot[], starters: Player[]): string[] {
  const remaining = [...starters]
  return Array.from({ length: LINEUP_SIZE }, (_, index) => {
    const slot = slots[index]
    const starterIndex = slot ? remaining.findIndex((player) => fitsSlot(player, slot)) : -1
    return starterIndex === -1 ? '' : String(remaining.splice(starterIndex, 1)[0].id)
  })
}

function lineupFormValues(lineup: Lineup, squad: Player[]): LineupFormValues {
  const formation = lineup.formation ?? ''
  const eligibleIds = new Set(squad.filter(canStart).map((player) => player.id))
  const starters = lineup.players.filter((player) => eligibleIds.has(player.id))
  return { formation, player_ids: assignStarters(slotsOf(formation), starters) }
}

function FormationThumbnail({ formation }: { formation: Formation }) {
  const spots = arrangeOnField(
    buildLineupSlots(formation).map((slot, index) => ({ item: index, sector: slot.sector })),
  )
  return (
    <span aria-hidden="true">
      <Pitch
        label={formation}
        orientation="vertical"
        size="mini"
        markers={spots.map((spot) => ({
          key: String(spot.item),
          x: spot.spread * 100,
          y: 100 - spot.depth * 100,
          label: '',
          tone: 'home',
        }))}
      />
    </span>
  )
}

function usedAttributes(player: Player): string {
  return POSITION_DUEL_ATTRIBUTES[player.position]
    .map((attribute) => `${DUEL_ATTRIBUTE_LABELS[attribute]} ${player[attribute]}`)
    .join(' · ')
}

interface ClubLineupFormProps {
  lineup: Lineup
  squad: Player[]
  isPending: boolean
  error: ActionError | undefined
  onSave: (payload: LineupPayload) => void
}

export function ClubLineupForm({ lineup, squad, isPending, error, onSave }: ClubLineupFormProps) {
  const eligiblePlayers = squad.filter(canStart)
  const savedValues = lineupFormValues(lineup, squad)
  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(lineupSchema),
    defaultValues: savedValues,
  })
  const { field: formationField } = useController({ control, name: 'formation' })
  const [formation, selectedIds] = useWatch({ control, name: ['formation', 'player_ids'] })
  const slots = slotsOf(formation)
  const playersById = new Map(squad.map((player) => [String(player.id), player]))
  const selectedPlayers = selectedIds
    .slice(0, slots.length)
    .flatMap((id) => playersById.get(id) ?? [])
  const unfitStarters = selectedPlayers.filter((player) => player.condition === 'MAL_CONDICIONADO')

  function changeFormation(nextFormation: string) {
    formationField.onChange(nextFormation)
    const nextSlots = slotsOf(nextFormation)
    getValues('player_ids').forEach((playerId, index) => {
      const player = playersById.get(playerId)
      const slot = nextSlots[index]
      if (!player || !slot || !fitsSlot(player, slot)) {
        setValue(`player_ids.${index}`, '', { shouldDirty: true })
      }
    })
  }

  function optionsFor(slot: LineupSlot, slotIndex: number): Player[] {
    const takenElsewhere = new Set(selectedIds.filter((_, index) => index !== slotIndex))
    return eligiblePlayers.filter(
      (player) => fitsSlot(player, slot) && !takenElsewhere.has(String(player.id)),
    )
  }

  const columns: Column<SlotRow>[] = [
    {
      key: 'slot',
      header: 'Vaga',
      render: ({ slot }) => (
        <Identity
          visual={null}
          title={SECTOR_LABELS[slot.sector]}
          subtitle={SECTOR_POSITIONS[slot.sector].join(' ou ')}
        />
      ),
    },
    {
      key: 'starter',
      header: 'Titular',
      render: ({ slot, index }) => {
        const options = optionsFor(slot, index)
        return (
          <SelectField
            label={slotLabel(slot)}
            hideLabel
            error={errors.player_ids?.[index]?.message}
            {...register(`player_ids.${index}`)}
          >
            <option value="">
              {options.length > 0
                ? 'Selecione…'
                : `Sem ${SECTOR_POSITIONS[slot.sector].join(' ou ')}`}
            </option>
            {options.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name} ({player.position})
              </option>
            ))}
          </SelectField>
        )
      },
    },
    {
      key: 'condition',
      header: 'Condição',
      render: ({ index }) => {
        const player = playersById.get(selectedIds[index])
        return player ? <ConditionBadge condition={player.condition} /> : '—'
      },
    },
    {
      key: 'overall',
      header: 'Overall',
      align: 'end',
      render: ({ index }) => playersById.get(selectedIds[index])?.overall ?? '—',
    },
    {
      key: 'attributes',
      header: 'Atributos usados',
      render: ({ index }) => {
        const player = playersById.get(selectedIds[index])
        return player ? usedAttributes(player) : '—'
      },
    },
  ]

  return (
    <form
      className="lineup-form"
      onSubmit={handleSubmit(onSave)}
      noValidate
      aria-label="Edição da escalação"
    >
      <div className="card__body">
        <ActionErrorNotice error={error} title="A escalação foi recusada" />
        <ChoiceField
          label="Formação"
          name="formation"
          layout="tiles"
          hint="Os números contam os jogadores de linha da defesa para frente. O goleiro é fixo."
          value={formationField.value}
          error={errors.formation?.message}
          onChange={changeFormation}
          onBlur={formationField.onBlur}
          options={FORMATIONS.map((option) => ({
            value: option,
            label: (
              <>
                <FormationThumbnail formation={option} />
                {option}
              </>
            ),
            description: describeFormation(option),
          }))}
        />
      </div>
      <DataTable
        caption="Vagas da escalação"
        columns={columns}
        rows={slots.map((slot, index) => ({ slot, index }))}
        getRowKey={({ index }) => index}
        isLoading={false}
        empty={{ icon: 'clipboard', title: 'Escolha a formação' }}
      />
      <div className="card__body">
        {slots.length < LINEUP_SIZE && (
          <p className="form-field__hint">Escolha a formação para ver as vagas de linha.</p>
        )}
        {unfitStarters.length > 0 && (
          <Notice
            tone="warning"
            title={`${unfitStarters.map((player) => player.name).join(' e ')} ${
              unfitStarters.length === 1 ? 'está mal condicionado' : 'estão mal condicionados'
            }`}
          >
            Podem jogar, mas cada atributo vale 15% a menos durante a partida.
          </Notice>
        )}
      </div>
      <footer className="card__footer lineup-form__footer">
        <p className="modal__footer-note">
          <Icon name="info" size={14} />
          Titular vendido ou que fica Doente sai da escalação; o clube só volta a jogar depois de
          escalar de novo.
        </p>
        <Button
          variant="secondary"
          disabled={!isDirty || isPending}
          onClick={() => reset(savedValues)}
        >
          Cancelar
        </Button>
        <Button type="submit" icon="check" isPending={isPending}>
          {isPending ? 'Salvando…' : 'Salvar escalação'}
        </Button>
      </footer>
    </form>
  )
}
