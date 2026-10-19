import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { SelectField } from '../../components/FormField'
import { Modal } from '../../components/Modal'
import { ActionErrorNotice, Notice } from '../../components/Notice'
import { useLeague } from '../../hooks/useLeague'
import { useMatchActions } from '../../hooks/useMatchActions'
import { matchSchema, type MatchFormValues } from './matchSchemas'

const EMPTY_MATCH: MatchFormValues = { home_club_id: '', away_club_id: '' }

export function PlayMatchDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { clubs } = useLeague()
  const { play } = useMatchActions({ onPlayed: (match) => navigate(`/matches/${match.id}`) })
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(matchSchema), defaultValues: EMPTY_MATCH })

  const clubOptions = (
    <>
      <option value="">Selecione o clube</option>
      {clubs.data?.map((club) => (
        <option key={club.id} value={club.id}>
          {club.name} ({club.acronym})
        </option>
      ))}
    </>
  )

  return (
    <Modal
      title="Nova partida"
      description="Escolha o mandante e o visitante. O placar sai dos atributos dos titulares, sem sorteio."
      onClose={onClose}
      isBusy={play.isPending}
      form={{ label: 'Nova partida', onSubmit: handleSubmit((payload) => play.run(payload)) }}
      footer={
        <>
          <Button variant="secondary" disabled={play.isPending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" icon="swords" isPending={play.isPending}>
            {play.isPending ? 'Jogando…' : 'Jogar partida'}
          </Button>
        </>
      }
    >
      <ActionErrorNotice error={play.error} title="Não foi possível jogar a partida" />
      {clubs.error && (
        <Notice tone="danger" role="alert" title="Não foi possível carregar os clubes">
          {clubs.error}
        </Notice>
      )}
      <SelectField
        label="Mandante"
        icon="shield"
        hint="Faz os 3 primeiros ataques."
        error={errors.home_club_id?.message}
        {...register('home_club_id')}
      >
        {clubOptions}
      </SelectField>
      <SelectField
        label="Visitante"
        icon="shield"
        hint="Precisa ser um clube diferente do mandante."
        error={errors.away_club_id?.message}
        {...register('away_club_id')}
      >
        {clubOptions}
      </SelectField>
      <Notice tone="neutral" title="Como sai o placar">
        <p>
          Cada time faz 3 ataques. Pela ordem do elenco, os jogadores de linha vão do 1º (o mais
          recuado) ao 4º (o mais avançado): o 4º enfrenta o goleiro, o 3º enfrenta o 1º e o 2º
          enfrenta o 2º do adversário. O atacante usa finalização (ATA), passe (MEI) ou drible (ZAG
          e LAT), e quem defende usa defesa. É gol quando o ataque é maior; mal condicionado joga
          com 15% a menos.
        </p>
        <p>Os dois clubes precisam ter os 5 titulares escalados. A partida não mexe no caixa.</p>
      </Notice>
    </Modal>
  )
}
