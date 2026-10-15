import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CONDITIONS, type Condition, type Player } from '../../api/types'
import { Button } from '../../components/Button'
import { SelectField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { CONDITION_LABELS } from '../../format/labels'
import { playerConditionSchema } from './playerSchemas'

const SICK_TO_FIT_REASON =
  'Jogador doente não pode passar direto para Apto: altere antes para Mal condicionado.'

interface PlayerConditionDialogProps {
  player: Player
  isPending: boolean
  onSave: (condition: Condition) => void
  onClose: () => void
}

export function PlayerConditionDialog({
  player,
  isPending,
  onSave,
  onClose,
}: PlayerConditionDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(playerConditionSchema),
    defaultValues: { condition: player.condition },
  })
  const isSick = player.condition === 'DOENTE'

  return (
    <Modal title={`Condição de ${player.name}`} onClose={onClose}>
      <form
        onSubmit={handleSubmit(({ condition }) => onSave(condition))}
        noValidate
        aria-label="Alteração de condição"
      >
        <p>
          Condição atual: <strong>{CONDITION_LABELS[player.condition]}</strong>
        </p>
        <SelectField
          label="Nova condição"
          hint={isSick ? SICK_TO_FIT_REASON : undefined}
          error={errors.condition?.message}
          {...register('condition')}
        >
          {CONDITIONS.map((condition) => (
            <option key={condition} value={condition} disabled={isSick && condition === 'APTO'}>
              {CONDITION_LABELS[condition]}
            </option>
          ))}
        </SelectField>
        <div className="form-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isPending={isPending}>
            {isPending ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
