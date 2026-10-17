import type { ReactNode } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { POSITIONS, type Position } from '../../api/types'
import { ChoiceField, InputField } from '../../components/FormField'
import { POSITION_LABELS } from '../../format/labels'
import type { PlayerProfileFormValues } from './playerSchemas'

const NAME_HINT = 'De 3 a 100 caracteres, com pelo menos duas palavras e sem números.'
const LOCKED_POSITION_HINT = 'Jogador com clube não pode mudar de posição.'

interface PlayerProfileFieldsProps {
  ageHint: string
  agilityHint: string
  lockedPosition?: Position
  extraField?: ReactNode
}

export function PlayerProfileFields({
  ageHint,
  agilityHint,
  lockedPosition,
  extraField,
}: PlayerProfileFieldsProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<PlayerProfileFormValues>()
  const { field: position } = useController({ control, name: 'position' })

  return (
    <>
      <InputField
        label="Nome"
        icon="user"
        autoComplete="off"
        hint={NAME_HINT}
        error={errors.name?.message}
        {...register('name')}
      />
      <ChoiceField
        label="Posição"
        name="position"
        layout="segmented"
        value={position.value}
        hint={lockedPosition && LOCKED_POSITION_HINT}
        error={errors.position?.message}
        onChange={position.onChange}
        onBlur={position.onBlur}
        options={POSITIONS.map((option) => ({
          value: option,
          label: option,
          description: POSITION_LABELS[option],
          disabled: lockedPosition !== undefined && option !== lockedPosition,
        }))}
      />
      <div className="form-grid">
        <InputField
          label="Idade"
          type="number"
          inputMode="numeric"
          hint={ageHint}
          error={errors.age?.message}
          {...register('age')}
        />
        <InputField
          label="Agilidade"
          type="number"
          inputMode="numeric"
          hint={agilityHint}
          error={errors.agility?.message}
          {...register('agility')}
        />
        {extraField}
      </div>
    </>
  )
}
