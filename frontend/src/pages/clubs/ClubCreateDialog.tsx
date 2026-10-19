import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { ClubRegistrationPayload } from '../../api/types'
import { Button } from '../../components/Button'
import { InputField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { ActionErrorNotice, Notice } from '../../components/Notice'
import { INITIAL_CASH } from '../../config/league'
import { formatMoney } from '../../format/money'
import type { ActionError } from '../../hooks/useAction'
import { clubRegistrationSchema, type ClubRegistrationFormValues } from './clubSchemas'

const EMPTY_CLUB: ClubRegistrationFormValues = { name: '', acronym: '' }

interface ClubCreateDialogProps {
  isPending: boolean
  error: ActionError | undefined
  onCreate: (payload: ClubRegistrationPayload) => void
  onClose: () => void
}

export function ClubCreateDialog({ isPending, error, onCreate, onClose }: ClubCreateDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clubRegistrationSchema),
    defaultValues: EMPTY_CLUB,
  })

  return (
    <Modal
      title="Novo clube"
      description="Informe o nome e a sigla do clube."
      size="sm"
      onClose={onClose}
      isBusy={isPending}
      form={{ label: 'Cadastro de clube', onSubmit: handleSubmit(onCreate) }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" isPending={isPending}>
            {isPending ? 'Criando…' : 'Criar clube'}
          </Button>
        </>
      }
    >
      <ActionErrorNotice error={error} title="Não foi possível criar o clube" />
      <InputField
        label="Nome"
        icon="shield"
        hint="De 3 a 60 caracteres. Não pode repetir o nome de outro clube."
        autoComplete="off"
        error={errors.name?.message}
        {...register('name')}
      />
      <InputField
        label="Sigla"
        hint="3 letras do nome, na ordem em que aparecem, começando pela inicial."
        autoComplete="off"
        maxLength={3}
        error={errors.acronym?.message}
        {...register('acronym')}
      />
      <Notice tone="neutral" icon="coins">
        O clube começa com {formatMoney(INITIAL_CASH)} em caixa e sem jogadores.
      </Notice>
    </Modal>
  )
}
