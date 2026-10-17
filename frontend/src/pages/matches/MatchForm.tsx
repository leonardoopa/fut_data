import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { Club, MatchPayload } from '../../api/types'
import { Button } from '../../components/Button'
import { SelectField } from '../../components/FormField'
import { matchSchema, type MatchFormValues } from './matchSchemas'

const EMPTY_MATCH: MatchFormValues = { home_club_id: '', away_club_id: '' }

interface MatchFormProps {
  clubs: Club[] | undefined
  clubsError: string | undefined
  isPending: boolean
  onPlay: (payload: MatchPayload) => void
}

export function MatchForm({ clubs, clubsError, isPending, onPlay }: MatchFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(matchSchema),
    defaultValues: EMPTY_MATCH,
  })
  const clubsHint = clubsError && `Clubes indisponíveis: ${clubsError}`

  function renderClubOptions() {
    return (
      <>
        <option value="">Selecione…</option>
        {clubs?.map((club) => (
          <option key={club.id} value={club.id}>
            {club.acronym} — {club.name}
          </option>
        ))}
      </>
    )
  }

  return (
    <form className="card" onSubmit={handleSubmit(onPlay)} noValidate aria-label="Nova partida">
      <h2 className="form-intro">Nova partida</h2>
      <div className="form-grid">
        <SelectField
          label="Mandante"
          hint={clubsHint}
          error={errors.home_club_id?.message}
          {...register('home_club_id')}
        >
          {renderClubOptions()}
        </SelectField>
        <SelectField
          label="Visitante"
          hint={clubsHint}
          error={errors.away_club_id?.message}
          {...register('away_club_id')}
        >
          {renderClubOptions()}
        </SelectField>
      </div>
      <div className="form-actions">
        <Button type="submit" isPending={isPending}>
          {isPending ? 'Jogando…' : 'Jogar partida'}
        </Button>
      </div>
    </form>
  )
}
