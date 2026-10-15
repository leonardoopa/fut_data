import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { ClubRegistrationPayload } from '../../api/types'
import { Button } from '../../components/Button'
import { InputField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { clubRegistrationSchema, type ClubRegistrationFormValues } from './clubSchemas'

const EMPTY_CLUB: ClubRegistrationFormValues = { name: '', acronym: '' }

interface ClubCreateDialogProps {
  isPending: boolean
  onCreate: (payload: ClubRegistrationPayload) => void
  onClose: () => void
}

export function ClubCreateDialog({ isPending, onCreate, onClose }: ClubCreateDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(clubRegistrationSchema),
    defaultValues: EMPTY_CLUB,
  })

  return (
    <Modal title="Novo clube" onClose={onClose}>
      <form onSubmit={handleSubmit(onCreate)} noValidate aria-label="Cadastro de clube">
        <div className="form-grid">
          <InputField
            label="Nome"
            hint="De 3 a 60 caracteres."
            autoComplete="off"
            error={errors.name?.message}
            {...register('name')}
          />
          <InputField
            label="Sigla"
            hint="3 letras do nome, começando pela inicial."
            autoComplete="off"
            maxLength={3}
            error={errors.acronym?.message}
            {...register('acronym')}
          />
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isPending={isPending}>
            {isPending ? 'Criando…' : 'Criar clube'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
