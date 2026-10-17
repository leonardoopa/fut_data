import { useCallback, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PLAYER_SORTS, type Player } from '../../api/types'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { DataTable } from '../../components/DataTable'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { PlayerCard } from '../../components/PlayerCard'
import { SegmentedControl } from '../../components/SegmentedControl'
import { SortMenu } from '../../components/SortMenu'
import { PLAYER_SORT_LABELS } from '../../format/labels'
import { hasIntent } from '../../hooks/useIntent'
import { useLeague } from '../../hooks/useLeague'
import { usePlayerActions } from '../../hooks/usePlayerActions'
import { PLAYERS_PER_PAGE, usePlayers, type MarketStatus } from '../../hooks/usePlayers'
import { PlayerConditionDialog } from './PlayerConditionDialog'
import { PlayerCreateDialog } from './PlayerCreateDialog'
import { PlayerDetailsDrawer } from './PlayerDetailsDrawer'
import { PlayerEditDialog } from './PlayerEditDialog'
import { PlayerFiltersBar } from './PlayerFiltersBar'
import { PlayerPurchaseDialog } from './PlayerPurchaseDialog'
import { buildPlayerColumns } from './playerColumns'

type PlayerDialog =
  { kind: 'create' } | { kind: 'details' | 'buy' | 'edit' | 'condition' | 'delete'; player: Player }

const PLAYER_COUNT_LABEL = { one: 'jogador', other: 'jogadores' }
const FREE_WITH_CLUB_REASON = 'Com um clube filtrado, a aba Livres fica indisponível.'

export function PlayersPage() {
  const location = useLocation()
  const players = usePlayers(hasIntent(location.state, 'browseFreePlayers') ? 'free' : 'all')
  const { clubs } = useLeague()
  const actions = usePlayerActions({
    onSaved: players.reload,
    onRemoved: players.reloadAfterRemoval,
  })
  const [dialog, setDialog] = useState<PlayerDialog>()
  const closeDialog = useCallback(() => setDialog(undefined), [])

  const clubsById = useMemo(
    () => new Map((clubs.data ?? []).map((club) => [club.id, club])),
    [clubs.data],
  )
  const meta = players.data?.meta
  const counts = players.counts

  function openDialog(next: PlayerDialog) {
    Object.values(actions).forEach((action) => action.clearError())
    setDialog(next)
  }

  const columns = buildPlayerColumns({
    clubsById,
    onDetails: (player) => openDialog({ kind: 'details', player }),
    onBuy: (player) => openDialog({ kind: 'buy', player }),
    onEdit: (player) => openDialog({ kind: 'edit', player }),
    onChangeCondition: (player) => openDialog({ kind: 'condition', player }),
    onDelete: (player) => openDialog({ kind: 'delete', player }),
  })

  async function runAndClose(action: () => Promise<unknown>) {
    if (await action()) closeDialog()
  }

  function renderDialog() {
    if (!dialog) return null
    if (dialog.kind === 'create') {
      return (
        <PlayerCreateDialog
          isPending={actions.create.isPending}
          error={actions.create.error}
          onCreate={actions.create.run}
          onShowDetails={(player) => openDialog({ kind: 'details', player })}
          onClose={closeDialog}
        />
      )
    }
    const { player } = dialog
    switch (dialog.kind) {
      case 'details':
        return (
          <PlayerDetailsDrawer
            player={player}
            clubsById={clubsById}
            onEdit={() => openDialog({ kind: 'edit', player })}
            onChangeCondition={() => openDialog({ kind: 'condition', player })}
            onBuy={() => openDialog({ kind: 'buy', player })}
            onClose={closeDialog}
          />
        )
      case 'buy':
        return (
          <PlayerPurchaseDialog
            player={player}
            clubs={clubs.data}
            clubsError={clubs.error}
            isPending={actions.buy.isPending}
            error={actions.buy.error}
            onBuy={(payload) => actions.buy.run(player.id, payload)}
            onClose={closeDialog}
          />
        )
      case 'edit':
        return (
          <PlayerEditDialog
            player={player}
            isPending={actions.update.isPending}
            error={actions.update.error}
            onSave={(payload) => runAndClose(() => actions.update.run(player.id, payload))}
            onClose={closeDialog}
          />
        )
      case 'condition':
        return (
          <PlayerConditionDialog
            player={player}
            club={player.club_id === null ? undefined : clubsById.get(player.club_id)}
            isPending={actions.changeCondition.isPending}
            error={actions.changeCondition.error}
            onSave={(condition) =>
              runAndClose(() => actions.changeCondition.run(player.id, { condition }))
            }
            onClose={closeDialog}
          />
        )
      case 'delete':
        return (
          <ConfirmDialog
            title={`Excluir ${player.name}?`}
            description="O jogador sai da lista e da busca, mas as transações e as partidas antigas dele continuam como foram gravadas."
            confirmLabel="Excluir jogador"
            confirmIcon="trash"
            pendingLabel="Excluindo…"
            tone="danger"
            isPending={actions.remove.isPending}
            error={actions.remove.error}
            errorTitle="Não foi possível excluir o jogador"
            onConfirm={() => runAndClose(() => actions.remove.run(player))}
            onCancel={closeDialog}
          >
            <PlayerCard player={player} aside={<Badge tone="neutral">Livre</Badge>} />
          </ConfirmDialog>
        )
    }
  }

  return (
    <section className="page">
      <PageHeader
        icon="users"
        title="Jogadores"
        subtitle="Cadastre jogadores, acompanhe os indicadores e compre os que estão livres."
        actions={
          <Button icon="plus" onClick={() => openDialog({ kind: 'create' })}>
            Novo jogador
          </Button>
        }
      />

      <PlayerFiltersBar players={players} clubs={clubs.data} />

      <Card
        flush
        actions={
          <>
            <SegmentedControl<MarketStatus>
              label="Situação no mercado"
              value={players.status}
              onChange={players.changeStatus}
              segments={[
                {
                  value: 'all',
                  label: 'Todos',
                  count: counts && counts.free + counts.club,
                },
                {
                  value: 'free',
                  label: 'Livres',
                  count: counts?.free,
                  disabledReason:
                    players.filters.club_id === undefined ? undefined : FREE_WITH_CLUB_REASON,
                },
                { value: 'club', label: 'Em clubes', count: counts?.club },
              ]}
            />
            <SortMenu
              options={PLAYER_SORTS}
              labels={PLAYER_SORT_LABELS}
              value={players.sort}
              onChange={players.changeSort}
            />
          </>
        }
        footer={
          meta &&
          !players.isLoading &&
          meta.total_items > 0 && (
            <Pagination
              page={players.page}
              pageSize={PLAYERS_PER_PAGE}
              pageItems={players.data?.data.length ?? 0}
              totalPages={meta.total_pages}
              totalItems={meta.total_items}
              itemLabel={PLAYER_COUNT_LABEL}
              onPageChange={players.goToPage}
            />
          )
        }
      >
        <DataTable
          caption="Jogadores"
          columns={columns}
          rows={players.data?.data}
          getRowKey={(player) => player.id}
          isLoading={players.isLoading}
          loadingLabel="Carregando jogadores…"
          skeletonRows={PLAYERS_PER_PAGE}
          error={players.error}
          errorTitle="Não foi possível carregar os jogadores"
          onRetry={players.reload}
          empty={
            players.isFiltered
              ? {
                  icon: 'searchX',
                  title: players.filters.search
                    ? `Nenhum jogador encontrado para "${players.filters.search}"`
                    : 'Nenhum jogador com esses filtros',
                  description:
                    'Confira a grafia ou tire algum filtro. A busca ignora maiúsculas, minúsculas e acentos.',
                  action: (
                    <Button variant="secondary" size="sm" icon="x" onClick={players.reset}>
                      Limpar filtros
                    </Button>
                  ),
                }
              : {
                  icon: 'users',
                  title: 'Nenhum jogador cadastrado',
                  description: 'Cadastre o primeiro jogador; ele começa livre e Apto.',
                  action: (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon="plus"
                      onClick={() => openDialog({ kind: 'create' })}
                    >
                      Novo jogador
                    </Button>
                  ),
                }
          }
        />
      </Card>

      <p className="page-note">
        Overall e valor de mercado são calculados pela API a cada consulta; os filtros se combinam.
      </p>

      {renderDialog()}
    </section>
  )
}
