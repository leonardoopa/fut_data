import type { Transaction } from '../../api/types'
import { Avatar, Identity } from '../../components/Avatar'
import type { Column } from '../../components/DataTable'
import { Icon } from '../../components/Icon'
import { SignedMoney } from '../../components/Money'
import { formatDateTime } from '../../format/dateTime'
import { TRANSACTION_TYPE_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'

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
      <span className="type-cell">
        <Icon name={transaction.type === 'COMPRA' ? 'cart' : 'swap'} size={14} />
        {TRANSACTION_TYPE_LABELS[transaction.type]}
      </span>
    ),
  },
  {
    key: 'player_name',
    header: 'Jogador',
    render: (transaction) => (
      <Identity
        visual={<Avatar name={transaction.player_name} size="sm" />}
        title={transaction.player_name}
      />
    ),
  },
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
    render: (transaction) => <SignedMoney value={transaction.profit} />,
  },
  {
    key: 'cash_change',
    header: 'Variação do caixa',
    align: 'end',
    render: (transaction) => <SignedMoney value={transaction.cash_change} />,
  },
]
