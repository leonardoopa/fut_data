import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import type { PlayerRegistrationPayload } from '../../api/types'
import { Button } from '../../components/Button'
import { InputField } from '../../components/FormField'
import { PlayerProfileFields } from './PlayerProfileFields'
import { playerRegistrationSchema, type PlayerRegistrationFormValues } from './playerSchemas'

const INDICATOR_FIELDS = [
  { name: 'pace', label: 'Velocidade' },
  { name: 'shooting', label: 'Finalização' },
  { name: 'passing', label: 'Passe' },
  { name: 'dribbling', label: 'Drible' },
  { name: 'defending', label: 'Defesa' },
  { name: 'physical', label: 'Físico' },
  { name: 'potential', label: 'Potencial' },
] as const

const EMPTY_PLAYER: PlayerRegistrationFormValues = {
  name: '',
  position: '',
  agility: '',
  age: '',
  pace: '',
  shooting: '',
  passing: '',
  dribbling: '',
  defending: '',
  physical: '',
  potential: '',
}

function PlayerIndicatorFields() {
  const {
    register,
    formState: { errors },
  } = useFormContext<PlayerRegistrationFormValues>()

  return (
    <fieldset className="form-fieldset">
      <legend>Indicadores (1 a 99)</legend>
      <div className="form-grid form-grid--compact">
        {INDICATOR_FIELDS.map(({ name, label }) => (
          <InputField
            key={name}
            label={label}
            type="number"
            inputMode="numeric"
            error={errors[name]?.message}
            {...register(name)}
          />
        ))}
      </div>
    </fieldset>
  )
}

interface PlayerCreateFormProps {
  isPending: boolean
  onSubmit: (payload: PlayerRegistrationPayload) => void
  onCancel: () => void
}

export function PlayerCreateForm({ isPending, onSubmit, onCancel }: PlayerCreateFormProps) {
  const form = useForm({
    resolver: zodResolver(playerRegistrationSchema),
    defaultValues: EMPTY_PLAYER,
  })
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate aria-label="Cadastro de jogador">
        <PlayerProfileFields />
        <PlayerIndicatorFields />
        <div className="form-actions">
          <Button variant="secondary" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" isPending={isPending}>
            {isPending ? 'Cadastrando…' : 'Cadastrar'}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}
