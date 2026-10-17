import type { Club, Sale, SquadPlayer } from '../../api/types'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { SignedMoney } from '../../components/Money'
import { Notice } from '../../components/Notice'
import { MarketValueAside, PlayerCard } from '../../components/PlayerCard'
import { ResultDialog } from '../../components/ResultDialog'
import { SummaryList } from '../../components/SummaryList'
import { formatDateTime } from '../../format/dateTime'
import { CONTRACT_STATUS_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'
import { formatPercent } from '../../format/percent'
import type { ActionError } from '../../hooks/useAction'
import { penaltyTone } from './squadColumns'

interface SaleConfirmDialogProps {
  player: SquadPlayer
  club: Club
  isStarter: boolean
  isPending: boolean
  error: ActionError | undefined
  onConfirm: () => void
  onCancel: () => void
}

export function SaleConfirmDialog({
  player,
  club,
  isStarter,
  isPending,
  error,
  onConfirm,
  onCancel,
}: SaleConfirmDialogProps) {
  return (
    <ConfirmDialog
      title={`Vender ${player.name}?`}
      description={`O jogador sai do elenco do ${club.name} e volta a ficar livre.`}
      confirmLabel="Confirmar venda"
      confirmIcon="swap"
      pendingLabel="Vendendo…"
      tone="primary"
      isPending={isPending}
      error={error}
      errorTitle="A venda foi recusada"
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      {isStarter && (
        <Notice tone="warning" title={`${player.name} é titular`}>
          Ao vender, ele sai da escalação, e o {club.name} só volta a jogar partidas depois de
          escalar de novo os 5 titulares.
        </Notice>
      )}
      <PlayerCard
        player={player}
        aside={<MarketValueAside value={formatMoney(player.market_value)} />}
      />
      <SummaryList
        label="Contrato atual"
        items={[
          { label: 'Valor de compra', value: formatMoney(player.contract.purchase_value) },
          { label: 'Fim da fidelidade', value: formatDateTime(player.contract.loyalty_until) },
          { label: 'Dias restantes', value: player.contract.remaining_days },
          {
            label: '% de multa se vender agora',
            value: (
              <Badge tone={penaltyTone(player.contract.penalty_rate)}>
                {formatPercent(player.contract.penalty_rate)}
              </Badge>
            ),
          },
        ]}
      />
      <Notice tone="neutral">
        A venda é pelo valor de mercado do momento. Multa (teto de 10,00), lucro, comissão e crédito
        são calculados pela API ao confirmar.
      </Notice>
      {isPending && (
        <Notice tone="neutral" icon="clock">
          Enviando a venda. Os botões ficam desabilitados até a resposta.
        </Notice>
      )}
    </ConfirmDialog>
  )
}

interface SaleResultDialogProps {
  sale: Sale
  club: Club
  onShowHistory: () => void
  onClose: () => void
}

export function SaleResultDialog({ sale, club, onShowHistory, onClose }: SaleResultDialogProps) {
  const isTerminated = sale.contract_status === 'RESCINDIDO'
  return (
    <ResultDialog
      title="Venda concluída"
      description={
        isTerminated
          ? `${sale.player_name} voltou a ficar livre; o contrato foi rescindido antes do fim da fidelidade.`
          : `${sale.player_name} voltou a ficar livre. A fidelidade já tinha terminado, então não houve multa.`
      }
      items={[
        { label: 'Valor de compra', value: formatMoney(sale.purchase_value) },
        {
          label: 'Valor de venda',
          caption: 'Valor de mercado no momento da venda',
          value: formatMoney(sale.value),
        },
        { label: 'Dias restantes', value: sale.remaining_days },
        {
          label: 'Multa',
          caption:
            sale.penalty_rate > 0
              ? `${formatPercent(sale.penalty_rate)} do valor de venda, com teto de 10,00`
              : 'Fidelidade cumprida: sem multa',
          value: formatMoney(sale.penalty),
        },
        { label: 'Lucro', value: <SignedMoney value={sale.profit} /> },
        { label: 'Comissão', caption: 'Calculada pela API', value: formatMoney(sale.fee) },
        {
          label: 'Crédito no caixa',
          caption: 'Valor de venda − multa − comissão',
          value: <SignedMoney value={sale.cash_change} />,
          emphasis: true,
        },
        {
          label: 'Contrato',
          value: (
            <Badge tone={isTerminated ? 'warning' : 'neutral'} dot>
              {CONTRACT_STATUS_LABELS[sale.contract_status]}
            </Badge>
          ),
        },
        {
          label: 'Novo caixa',
          caption: `Caixa do ${club.name} depois da venda`,
          value: formatMoney(sale.club_cash),
          emphasis: true,
        },
      ]}
      secondaryAction={
        <Button variant="secondary" icon="history" onClick={onShowHistory}>
          Ver histórico
        </Button>
      }
      onClose={onClose}
    />
  )
}
