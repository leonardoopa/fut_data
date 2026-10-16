import type { Player } from '../../api/types'
import { ConditionBadge } from '../../components/ConditionBadge'
import type { Column } from '../../components/DataTable'
import { POSITION_LABELS } from '../../format/labels'

export const LINEUP_COLUMNS: Column<Player>[] = [
  { key: 'name', header: 'Nome', render: (player) => player.name },
  { key: 'position', header: 'Posição', render: (player) => POSITION_LABELS[player.position] },
  { key: 'overall', header: 'Overall', align: 'end', render: (player) => player.overall },
  {
    key: 'condition',
    header: 'Condição',
    render: (player) => <ConditionBadge condition={player.condition} />,
  },
]
