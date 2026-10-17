import { zodResolver } from '@hookform/resolvers/zod'
import { useId } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import type { PlayerRegistrationPayload } from '../../api/types'
import { AttributeBar } from '../../components/AttributeBar'
import { Button } from '../../components/Button'
import { InputField, ReadOnlyField } from '../../components/FormField'
import { Icon } from '../../components/Icon'
import { Modal } from '../../components/Modal'
import { ActionErrorNotice } from '../../components/Notice'
import type { ActionError } from '../../hooks/useAction'
import { PlayerProfileFields } from './PlayerProfileFields'
import { playerRegistrationSchema, type PlayerRegistrationFormValues } from './playerSchemas'

const AFTER_SAVE = 'Após salvar'
const ATTRIBUTE_PATTERN = /^\d{1,2}$/

const INDICATOR_FIELDS = [
  { name: 'pace', label: 'Velocidade' },
  { name: 'shooting', label: 'Finalização' },
  { name: 'passing', label: 'Passe' },
  { name: 'dribbling', label: 'Drible' },
  { name: 'defending', label: 'Defesa' },
  { name: 'physical', label: 'Físico' },
  { name: 'potential', label: 'Potencial' },
] as const

const PREVIEW_FIELDS = INDICATOR_FIELDS.filter((field) => field.name !== 'potential')
const PREVIEW_NAMES = PREVIEW_FIELDS.map((field) => field.name)

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

function typedAttribute(value: string): number | undefined {
  const number = Number(value)
  return ATTRIBUTE_PATTERN.test(value) && number >= 1 ? number : undefined
}

function AttributePreview() {
  const {
    control,
    formState: { errors },
  } = useFormContext<PlayerRegistrationFormValues>()
  const values = useWatch({ control, name: PREVIEW_NAMES })
  const hasErrors = PREVIEW_NAMES.some((name) => errors[name])

  return (
    <aside className="attribute-preview" aria-label="Prévia dos atributos">
      <p className="attribute-preview__title">
        <Icon name="barChart" size={14} />
        Prévia dos atributos
      </p>
      {hasErrors ? (
        <p className="attribute-preview__empty">Corrija os valores destacados para ver a prévia.</p>
      ) : (
        <ul className="attribute-list">
          {PREVIEW_FIELDS.map((field, index) => {
            const value = typedAttribute(values[index])
            return (
              <li key={field.name}>
                <span>{field.label}</span>
                <AttributeBar value={value ?? 0} tone="primary" />
                <strong>{value ?? '—'}</strong>
              </li>
            )
          })}
        </ul>
      )}
      <p className="form-field__hint">
        Só os valores digitados. Overall e valor base são calculados pela API ao salvar.
      </p>
    </aside>
  )
}

function IndicatorFields() {
  const titleId = useId()
  const {
    register,
    formState: { errors },
  } = useFormContext<PlayerRegistrationFormValues>()

  return (
    <section className="form-section" aria-labelledby={titleId}>
      <div>
        <h3 id={titleId} className="form-section__title">
          Indicadores técnicos
        </h3>
        <p className="form-section__description">
          Seis atributos e o potencial, de 1 a 99. Não mudam depois do cadastro; a soma dos seis
          atributos não pode passar de 480.
        </p>
      </div>
      <div className="player-form__attributes">
        <div className="player-form__indicators">
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
          <ReadOnlyField label="Overall" value={AFTER_SAVE} hint="Calculado pela API." />
        </div>
        <AttributePreview />
      </div>
    </section>
  )
}

interface PlayerCreateFormProps {
  isPending: boolean
  error: ActionError | undefined
  onSubmit: (payload: PlayerRegistrationPayload) => void
  onCancel: () => void
}

export function PlayerCreateForm({ isPending, error, onSubmit, onCancel }: PlayerCreateFormProps) {
  const form = useForm({
    resolver: zodResolver(playerRegistrationSchema),
    defaultValues: EMPTY_PLAYER,
  })
  const hasErrors = Object.keys(form.formState.errors).length > 0

  return (
    <FormProvider {...form}>
      <Modal
        title="Novo jogador"
        description={
          hasErrors
            ? 'Corrija os campos destacados para salvar.'
            : 'Preencha os dados e os indicadores técnicos. O valor base, o overall e o valor de mercado são calculados ao salvar.'
        }
        size="lg"
        onClose={onCancel}
        form={{ label: 'Cadastro de jogador', onSubmit: form.handleSubmit(onSubmit) }}
        footer={
          <>
            <span className="modal__footer-note">
              <Icon name="info" size={14} />O jogador começa livre e Apto.
            </span>
            <Button variant="secondary" onClick={onCancel} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" isPending={isPending}>
              {isPending ? 'Salvando…' : 'Salvar jogador'}
            </Button>
          </>
        }
      >
        <ActionErrorNotice error={error} title="Não foi possível cadastrar o jogador" />
        <PlayerProfileFields
          ageHint="De 16 a 45 anos."
          agilityHint="De 1 a 100."
          extraField={
            <ReadOnlyField
              label="Valor base (moedas)"
              value={AFTER_SAVE}
              hint="Calculado no cadastro."
            />
          }
        />
        <IndicatorFields />
      </Modal>
    </FormProvider>
  )
}
