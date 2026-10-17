import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import type { Club, Player, Purchase, PurchasePayload } from '../../api/types'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { InputField, SelectField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { ActionErrorNotice, Notice } from '../../components/Notice'
import { MarketValueAside, PlayerCard } from '../../components/PlayerCard'
import { ResultDialog } from '../../components/ResultDialog'
import { formatDateTime } from '../../format/dateTime'
import { CONTRACT_STATUS_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'
import type { ActionError } from '../../hooks/useAction'
import { playerPurchaseSchema, type PlayerPurchaseFormValues } from './playerSchemas'

const EMPTY_PURCHASE: PlayerPurchaseFormValues = { club_id: '', loyalty_date: '', loyalty_time: '' }

function PurchaseResult({
  purchase,
  buyer,
  onClose,
}: {
  purchase: Purchase
  buyer: Club | undefined
  onClose: () => void
}) {
  const navigate = useNavigate()
  const buyerName = buyer?.name ?? 'clube'
  return (
    <ResultDialog
      title="Compra concluída"
      description={`${purchase.player_name} agora é do ${buyerName}. Valores calculados pela API.`}
      items={[
        {
          label: 'Valor',
          caption: 'Valor de mercado no momento da compra',
          value: formatMoney(purchase.value),
        },
        { label: 'Taxa', caption: 'Calculada pela API', value: formatMoney(purchase.fee) },
        {
          label: 'Custo total',
          caption: 'Valor + taxa',
          value: formatMoney(purchase.value + purchase.fee),
          emphasis: true,
        },
        { label: 'Fim da fidelidade', value: formatDateTime(purchase.contract.loyalty_until) },
        {
          label: 'Contrato',
          value: (
            <Badge tone="success" dot>
              {CONTRACT_STATUS_LABELS[purchase.contract.status]}
            </Badge>
          ),
        },
        {
          label: 'Novo caixa',
          caption: `Caixa do ${buyerName} depois da compra`,
          value: formatMoney(purchase.club_cash),
          emphasis: true,
        },
      ]}
      secondaryAction={
        <Button
          variant="secondary"
          trailingIcon="arrowRight"
          onClick={() => navigate(`/clubs/${purchase.club_id}`)}
        >
          Ver clube
        </Button>
      }
      onClose={onClose}
    />
  )
}

interface PlayerPurchaseDialogProps {
  player: Player
  clubs: Club[] | undefined
  clubsError: string | undefined
  isPending: boolean
  error: ActionError | undefined
  onBuy: (payload: PurchasePayload) => Promise<Purchase | undefined>
  onClose: () => void
}

export function PlayerPurchaseDialog({
  player,
  clubs,
  clubsError,
  isPending,
  error,
  onBuy,
  onClose,
}: PlayerPurchaseDialogProps) {
  const [purchase, setPurchase] = useState<Purchase>()
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(playerPurchaseSchema),
    defaultValues: EMPTY_PURCHASE,
  })
  const clubId = useWatch({ control, name: 'club_id' })
  const buyer = clubs?.find((club) => String(club.id) === clubId)

  async function buy(payload: PurchasePayload) {
    const result = await onBuy(payload)
    if (result) setPurchase(result)
  }

  if (purchase) {
    const purchaseBuyer = clubs?.find((club) => club.id === purchase.club_id)
    return <PurchaseResult purchase={purchase} buyer={purchaseBuyer} onClose={onClose} />
  }

  function clubHint() {
    if (clubsError) return `Clubes indisponíveis: ${clubsError}`
    if (!buyer) return 'Escolha o clube que paga a compra.'
    return `Caixa atual: ${formatMoney(buyer.cash)}. O custo total (valor + taxa) pode ir até 50% do caixa.`
  }

  return (
    <Modal
      title="Comprar jogador"
      description="Escolha o clube comprador e até quando vai a fidelidade do contrato."
      onClose={onClose}
      form={{ label: 'Compra de jogador', onSubmit: handleSubmit(buy) }}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            icon={error?.isNetworkError ? 'refresh' : 'cart'}
            isPending={isPending}
          >
            {isPending
              ? 'Comprando…'
              : error?.isNetworkError
                ? 'Tentar de novo'
                : 'Confirmar compra'}
          </Button>
        </>
      }
    >
      <ActionErrorNotice error={error} title="Compra recusada" />
      <PlayerCard
        player={player}
        aside={<MarketValueAside value={formatMoney(player.market_value)} />}
      />
      <SelectField
        label="Clube comprador"
        icon="shield"
        hint={clubHint()}
        error={errors.club_id?.message}
        {...register('club_id')}
      >
        <option value="">Selecione…</option>
        {clubs?.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name} ({club.acronym}) · caixa {formatMoney(club.cash)}
          </option>
        ))}
      </SelectField>
      <fieldset className="date-time-field">
        <legend className="form-field__label">Fim da fidelidade</legend>
        <div className="date-time-field__inputs">
          <InputField
            label="Data do fim da fidelidade"
            hideLabel
            icon="calendar"
            type="date"
            error={errors.loyalty_date?.message}
            {...register('loyalty_date')}
          />
          <InputField
            label="Hora do fim da fidelidade"
            hideLabel
            icon="clock"
            type="time"
            error={errors.loyalty_time?.message}
            {...register('loyalty_time')}
          />
        </div>
        <p className="form-field__hint">
          Depois do momento da compra e até 1.095 dias. Horário de Brasília; enviado com o fuso
          -03:00.
        </p>
      </fieldset>
      <Notice tone="neutral">
        A taxa é de 5% do valor de mercado, só quando ele passa de 30,00. Taxa, custo total e novo
        caixa são calculados pela API ao confirmar.
      </Notice>
      {isPending && (
        <Notice tone="neutral" icon="clock">
          Enviando a compra. Os botões ficam desabilitados até a resposta.
        </Notice>
      )}
    </Modal>
  )
}
