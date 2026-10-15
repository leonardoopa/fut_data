import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { TRANSACTION_TYPES, type TransactionFilters } from '../../api/types'
import { Button } from '../../components/Button'
import { CheckboxField, SelectField } from '../../components/FormField'
import { TRANSACTION_TYPE_LABELS } from '../../format/labels'
import { NO_TRANSACTION_FILTERS, type HistoryPlayer } from '../../hooks/useClubTransactions'
import { transactionFiltersSchema, type TransactionFiltersFormValues } from './clubSchemas'

const EMPTY_FILTERS: TransactionFiltersFormValues = { types: [], player_id: '' }

interface TransactionFiltersFormProps {
  players: HistoryPlayer[]
  onApply: (filters: TransactionFilters) => void
}

export function TransactionFiltersForm({ players, onApply }: TransactionFiltersFormProps) {
  const { register, handleSubmit, reset } = useForm({
    resolver: zodResolver(transactionFiltersSchema),
    defaultValues: EMPTY_FILTERS,
  })

  function clear() {
    reset(EMPTY_FILTERS)
    onApply(NO_TRANSACTION_FILTERS)
  }

  return (
    <form
      className="filters"
      onSubmit={handleSubmit(onApply)}
      noValidate
      aria-label="Filtros do histórico"
    >
      <div className="filters__grid">
        <fieldset className="checkbox-group">
          <legend className="form-field__label">Tipo</legend>
          {TRANSACTION_TYPES.map((type) => (
            <CheckboxField
              key={type}
              label={TRANSACTION_TYPE_LABELS[type]}
              value={type}
              {...register('types')}
            />
          ))}
        </fieldset>
        <SelectField label="Jogador" {...register('player_id')}>
          <option value="">Todos</option>
          {players.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name}
            </option>
          ))}
        </SelectField>
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
