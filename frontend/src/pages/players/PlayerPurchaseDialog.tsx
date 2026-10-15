import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Club, Player, Purchase, PurchasePayload } from '../../api/types'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { ResultDialog } from '../../components/ResultDialog'
import { formatDateTime } from '../../format/dateTime'
import { formatMoney } from '../../format/money'
import { playerPurchaseSchema } from './playerSchemas'

interface PlayerPurchaseDialogProps {
  player: Player
  clubs: Club[] | undefined
  clubsError: string | undefined
  isPending: boolean
  onBuy: (payload: PurchasePayload) => Promise<Purchase | undefined>
  onClose: () => void
}

export function PlayerPurchaseDialog({
  player,
  clubs,
  clubsError,
  isPending,
  onBuy,
  onClose,
}: PlayerPurchaseDialogProps) {
  const [purchase, setPurchase] = useState<Purchase>()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(playerPurchaseSchema),
    defaultValues: { club_id: '', loyalty_until: '' },
  })

  async function buy(payload: PurchasePayload) {
    const result = await onBuy(payload)
    if (result) setPurchase(result)
  }

  if (purchase) {
    const buyer = clubs?.find((club) => club.id === purchase.club_id)
    return (
      <ResultDialog
        title="Compra concluída"
        description={
          <>
            <strong>{purchase.player_name}</strong> foi comprado
            {buyer && ` por ${buyer.name}`}. Valores calculados pela API:
          </>
        }
        items={[
          { label: 'Valor', value: formatMoney(purchase.value) },
          { label: 'Taxa', value: formatMoney(purchase.fee) },
          { label: 'Custo total', value: formatMoney(purchase.value + purchase.fee) },
          { label: 'Fim da fidelidade', value: formatDateTime(purchase.contract.loyalty_until) },
          { label: 'Novo caixa', value: formatMoney(purchase.club_cash) },
        ]}
        onClose={onClose}
      />
    )
  }

  return (
    <Modal title={`Comprar ${player.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit(buy)} noValidate aria-label="Compra de jogador">
        <p className="form-intro">
          Valor de mercado atual: <strong>{formatMoney(player.market_value)}</strong>
        </p>
        <div className="form-grid">
          <SelectField
            label="Clube comprador"
            hint={clubsError && `Clubes indisponíveis: ${clubsError}`}
            error={errors.club_id?.message}
            {...register('club_id')}
          >
            <option value="">Selecione…</option>
            {clubs?.map((club) => (
              <option key={club.id} value={club.id}>
                {club.acronym} — {club.name}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Fim da fidelidade"
            type="datetime-local"
            hint="Data e hora no horário de Brasília."
            error={errors.loyalty_until?.message}
            {...register('loyalty_until')}
          />
        </div>
        <div className="form-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isPending={isPending}>
            {isPending ? 'Comprando…' : 'Confirmar compra'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
