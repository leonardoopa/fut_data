import { useFormContext } from 'react-hook-form'
import { POSITIONS, type Position } from '../../api/types'
import { InputField, SelectField } from '../../components/FormField'
import { POSITION_LABELS } from '../../format/labels'
import type { PlayerProfileFormValues } from './playerSchemas'

interface PlayerProfileFieldsProps {
  lockedPosition?: Position
}

export function PlayerProfileFields({ lockedPosition }: PlayerProfileFieldsProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<PlayerProfileFormValues>()

  return (
    <div className="form-grid">
      <InputField
        label="Nome"
        autoComplete="off"
        error={errors.name?.message}
        {...register('name')}
      />
      <SelectField
        label="Posição"
        hint={lockedPosition && 'Jogador com clube não pode mudar de posição.'}
        error={errors.position?.message}
        {...register('position')}
      >
        <option value="" disabled={Boolean(lockedPosition)}>
          Selecione…
        </option>
        {POSITIONS.map((position) => (
          <option
            key={position}
            value={position}
            disabled={Boolean(lockedPosition) && position !== lockedPosition}
          >
            {POSITION_LABELS[position]}
          </option>
        ))}
      </SelectField>
      <InputField
        label="Agilidade (1 a 100)"
        type="number"
        inputMode="numeric"
        error={errors.agility?.message}
        {...register('agility')}
      />
      <InputField
        label="Idade (16 a 45)"
        type="number"
        inputMode="numeric"
        error={errors.age?.message}
        {...register('age')}
      />
    </div>
  )
}
