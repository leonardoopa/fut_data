import { useCallback, useState } from 'react'
import { CLUB_SORTS, type ClubRegistrationPayload, type ClubSort } from '../../api/types'
import { Button } from '../../components/Button'
import { DataTable } from '../../components/DataTable'
import { SelectField } from '../../components/FormField'
import { CLUB_SORT_LABELS } from '../../format/labels'
import { useClubActions } from '../../hooks/useClubActions'
import { useClubs } from '../../hooks/useClubs'
import { ClubCreateDialog } from './ClubCreateDialog'
import { CLUB_COLUMNS } from './clubColumns'

export function ClubsPage() {
  const [sort, setSort] = useState<ClubSort>('name')
  const clubs = useClubs(sort)
  const actions = useClubActions({ onCreated: clubs.reload })
  const [isCreating, setIsCreating] = useState(false)
  const closeDialog = useCallback(() => setIsCreating(false), [])

  function changeSort(value: string) {
    const nextSort = CLUB_SORTS.find((clubSort) => clubSort === value)
    if (nextSort) setSort(nextSort)
  }

  async function create(payload: ClubRegistrationPayload) {
    if (await actions.create.run(payload)) closeDialog()
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1>Clubes</h1>
        <Button onClick={() => setIsCreating(true)}>Novo clube</Button>
      </header>

      <div className="toolbar">
        <SelectField
          label="Ordenar por"
          value={sort}
          onChange={(event) => changeSort(event.target.value)}
        >
          {CLUB_SORTS.map((clubSort) => (
            <option key={clubSort} value={clubSort}>
              {CLUB_SORT_LABELS[clubSort]}
            </option>
          ))}
        </SelectField>
      </div>

      <DataTable
        caption="Clubes"
        columns={CLUB_COLUMNS}
        rows={clubs.data}
        getRowKey={(club) => club.id}
        isLoading={clubs.isLoading}
        error={clubs.error}
        emptyMessage="Nenhum clube cadastrado."
        onRetry={clubs.reload}
      />

      {isCreating && (
        <ClubCreateDialog
          isPending={actions.create.isPending}
          onCreate={create}
          onClose={closeDialog}
        />
      )}
    </section>
  )
}
