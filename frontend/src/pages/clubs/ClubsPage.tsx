import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CLUB_SORTS, type ClubRegistrationPayload, type ClubSort } from '../../api/types'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { DataTable } from '../../components/DataTable'
import { PageHeader } from '../../components/PageHeader'
import { SortMenu } from '../../components/SortMenu'
import { INITIAL_CASH, MAX_CLUBS } from '../../config/league'
import { CLUB_SORT_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'
import { useClubActions } from '../../hooks/useClubActions'
import { useClubs } from '../../hooks/useClubs'
import { useIntentToggle } from '../../hooks/useIntent'
import { ClubCreateDialog } from './ClubCreateDialog'
import { CLUB_COLUMNS } from './clubColumns'

export function ClubsPage() {
  const navigate = useNavigate()
  const [sort, setSort] = useState<ClubSort>('name')
  const clubs = useClubs(sort)
  const [isCreating, setIsCreating] = useIntentToggle('createClub')
  const actions = useClubActions({ onCreated: (club) => navigate(`/clubs/${club.id}`) })
  const clubCount = clubs.data?.length

  function openCreation() {
    actions.create.clearError()
    setIsCreating(true)
  }

  function create(payload: ClubRegistrationPayload) {
    actions.create.run(payload)
  }

  return (
    <section className="page">
      <PageHeader
        icon="shield"
        title="Clubes"
        subtitle={`Cada clube começa com ${formatMoney(INITIAL_CASH)} em caixa e sem jogadores. A liga aceita no máximo ${MAX_CLUBS} clubes.`}
        actions={
          <Button icon="plus" onClick={openCreation}>
            Novo clube
          </Button>
        }
      />

      <Card
        flush
        actions={
          <>
            <span className="card__count">
              {clubCount ?? '—'} {clubCount === 1 ? 'clube' : 'clubes'}
              <Badge tone="neutral">
                {clubCount ?? '—'} de {MAX_CLUBS}
              </Badge>
            </span>
            <SortMenu
              options={CLUB_SORTS}
              labels={CLUB_SORT_LABELS}
              value={sort}
              onChange={setSort}
            />
          </>
        }
      >
        <DataTable
          caption="Clubes"
          columns={CLUB_COLUMNS}
          rows={clubs.data}
          getRowKey={(club) => club.id}
          isLoading={clubs.isLoading}
          loadingLabel="Carregando clubes…"
          error={clubs.error}
          errorTitle="Não foi possível carregar os clubes"
          onRetry={clubs.reload}
          empty={{
            icon: 'shield',
            title: 'Nenhum clube cadastrado',
            description: `Crie o primeiro clube com nome e sigla. Ele começa com ${formatMoney(INITIAL_CASH)} em caixa e sem jogadores.`,
            action: (
              <Button variant="secondary" size="sm" icon="plus" onClick={openCreation}>
                Novo clube
              </Button>
            ),
          }}
        />
      </Card>

      <p className="page-note">Clubes pelo nome ou pelo patrimônio, na ordem devolvida pela API.</p>

      {isCreating && (
        <ClubCreateDialog
          isPending={actions.create.isPending}
          error={actions.create.error}
          onCreate={create}
          onClose={() => setIsCreating(false)}
        />
      )}
    </section>
  )
}
