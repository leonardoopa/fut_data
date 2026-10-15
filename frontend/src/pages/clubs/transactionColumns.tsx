import type { Transaction, TransactionType } from '../../api/types'
import { Badge, type BadgeTone } from '../../components/Badge'
import type { Column } from '../../components/DataTable'
import { formatDateTime } from '../../format/dateTime'
import { TRANSACTION_TYPE_LABELS } from '../../format/labels'
import { formatMoney, formatSignedMoney } from '../../format/money'

const TRANSACTION_TONES: Record<TransactionType, BadgeTone> = {
  COMPRA: 'neutral',
  VENDA: 'success',
}

export const TRANSACTION_COLUMNS: Column<Transaction>[] = [
  {
    key: 'created_at',
    header: 'Data e hora',
    render: (transaction) => formatDateTime(transaction.created_at),
  },
  {
    key: 'type',
    header: 'Tipo',
    render: (transaction) => (
      <Badge tone={TRANSACTION_TONES[transaction.type]}>
        {TRANSACTION_TYPE_LABELS[transaction.type]}
      </Badge>
    ),
  },
  { key: 'player_name', header: 'Jogador', render: (transaction) => transaction.player_name },
  {
    key: 'value',
    header: 'Valor',
    align: 'end',
    render: (transaction) => formatMoney(transaction.value),
  },
  {
    key: 'fee',
    header: 'Taxa ou comissão',
    align: 'end',
    render: (transaction) => formatMoney(transaction.fee),
  },
  {
    key: 'penalty',
    header: 'Multa',
    align: 'end',
    render: (transaction) => formatMoney(transaction.penalty),
  },
  {
    key: 'profit',
    header: 'Lucro',
    align: 'end',
    render: (transaction) => formatSignedMoney(transaction.profit),
  },
  {
    key: 'cash_change',
    header: 'Variação do caixa',
    align: 'end',
    render: (transaction) => formatSignedMoney(transaction.cash_change),
  },
]
