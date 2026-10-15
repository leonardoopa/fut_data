import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { CONDITIONS, POSITIONS, type Club, type PlayerFilters } from '../../api/types'
import { Button } from '../../components/Button'
import { CheckboxField, InputField, SelectField } from '../../components/FormField'
import { CONDITION_LABELS, POSITION_LABELS } from '../../format/labels'
import { playerFiltersSchema, type PlayerFiltersFormValues } from './playerSchemas'

const EMPTY_FILTERS: PlayerFiltersFormValues = {
  search: '',
  position: '',
  condition: '',
  club_id: '',
  free: false,
  min_age: '',
  max_age: '',
  min_value: '',
  max_value: '',
}

interface PlayerFiltersFormProps {
  clubs: Club[] | undefined
  clubsError: string | undefined
  onApply: (filters: PlayerFilters) => void
}

export function PlayerFiltersForm({ clubs, clubsError, onApply }: PlayerFiltersFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(playerFiltersSchema),
    defaultValues: EMPTY_FILTERS,
  })
  const [isFreeOnly, clubId] = useWatch({ control, name: ['free', 'club_id'] })
  const hasClub = Boolean(clubId)

  function clear() {
    reset(EMPTY_FILTERS)
    onApply({})
  }

  return (
    <form
      className="filters"
      onSubmit={handleSubmit(onApply)}
      noValidate
      aria-label="Filtros de jogadores"
    >
      <div className="filters__grid">
        <InputField
          label="Buscar por nome"
          type="search"
          placeholder="Mínimo de 2 letras"
          error={errors.search?.message}
          {...register('search')}
        />
        <SelectField label="Posição" {...register('position')}>
          <option value="">Todas</option>
          {POSITIONS.map((position) => (
            <option key={position} value={position}>
              {POSITION_LABELS[position]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Condição" {...register('condition')}>
          <option value="">Todas</option>
          {CONDITIONS.map((condition) => (
            <option key={condition} value={condition}>
              {CONDITION_LABELS[condition]}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Clube"
          hint={
            isFreeOnly
              ? 'Indisponível com "Só livres": jogador livre não tem clube.'
              : clubsError && `Clubes indisponíveis: ${clubsError}`
          }
          {...register('club_id', { disabled: isFreeOnly })}
        >
          <option value="">Todos</option>
          {clubs?.map((club) => (
            <option key={club.id} value={club.id}>
              {club.acronym} — {club.name}
            </option>
          ))}
        </SelectField>
        <CheckboxField
          label="Só livres"
          hint={
            hasClub ? 'Indisponível com filtro de clube: jogador livre não tem clube.' : undefined
          }
          {...register('free', { disabled: hasClub })}
        />
        <InputField
          label="Idade mínima"
          type="number"
          inputMode="numeric"
          error={errors.min_age?.message}
          {...register('min_age')}
        />
        <InputField
          label="Idade máxima"
          type="number"
          inputMode="numeric"
          error={errors.max_age?.message}
          {...register('max_age')}
        />
        <InputField
          label="Valor de mercado mínimo"
          inputMode="decimal"
          error={errors.min_value?.message}
          {...register('min_value')}
        />
        <InputField
          label="Valor de mercado máximo"
          inputMode="decimal"
          error={errors.max_value?.message}
          {...register('max_value')}
        />
      </div>
      <div className="filters__actions">
        <Button type="submit">Filtrar</Button>
        <Button variant="secondary" onClick={clear}>
          Limpar filtros
        </Button>
      </div>
    </form>
  )
}
