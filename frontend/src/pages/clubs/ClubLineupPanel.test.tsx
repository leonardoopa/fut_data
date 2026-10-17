import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { getClub, getClubLineup, listClubTransactions, saveClubLineup } from '../../api/clubs'
import type { Lineup } from '../../api/types'
import { makeClubDetails, makeHistory, makeLineup, makeSquadPlayer } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { ClubPage } from './ClubPage'

vi.mock('../../api/clubs')
vi.mock('../../api/players')
vi.mock('../../api/matches')

const GOALKEEPER = makeSquadPlayer({ id: 7, name: 'Paredão', position: 'GOL' })
const SICK_GOALKEEPER = makeSquadPlayer({
  id: 8,
  name: 'Muralha',
  position: 'GOL',
  condition: 'DOENTE',
})
const CENTER_BACK = makeSquadPlayer({ id: 9, name: 'Zagueiro Forte', position: 'ZAG' })
const FULL_BACK = makeSquadPlayer({
  id: 10,
  name: 'Lateral Veloz',
  position: 'LAT',
  condition: 'MAL_CONDICIONADO',
})
const SICK_CENTER_BACK = makeSquadPlayer({
  id: 11,
  name: 'Xerife',
  position: 'ZAG',
  condition: 'DOENTE',
})
const MIDFIELDER = makeSquadPlayer({ id: 1, name: 'Meia Lua', position: 'MEI' })
const STRIKER = makeSquadPlayer({ id: 12, name: 'Artilheiro', position: 'ATA' })
const SECOND_STRIKER = makeSquadPlayer({ id: 13, name: 'Centroavante', position: 'ATA' })
const SQUAD = [
  GOALKEEPER,
  SICK_GOALKEEPER,
  CENTER_BACK,
  FULL_BACK,
  SICK_CENTER_BACK,
  MIDFIELDER,
  STRIKER,
  SECOND_STRIKER,
]
const SAVED_LINEUP: Lineup = makeLineup({
  formation: '2-1-1',
  complete: true,
  players: [GOALKEEPER, CENTER_BACK, FULL_BACK, MIDFIELDER, STRIKER],
})

type User = ReturnType<typeof userEvent.setup>

async function openLineup() {
  const user = userEvent.setup()
  renderWithProviders(<ClubPage />, { path: '/clubs/:clubId', url: '/clubs/2' })
  await user.click(await screen.findByRole('tab', { name: 'Escalação' }))
  await screen.findByRole('form', { name: 'Edição da escalação' })
  return user
}

function optionNames(label: string) {
  return within(screen.getByLabelText(label))
    .getAllByRole('option')
    .map((option) => option.textContent)
}

function fieldNames() {
  return within(screen.getByRole('list', { name: 'Em campo' }))
    .getAllByRole('listitem')
    .map((item) => item.textContent)
}

async function chooseFormation(user: User, formation: string) {
  await user.click(screen.getByRole('radio', { name: new RegExp(`^${formation}`) }))
}

beforeEach(() => {
  vi.mocked(getClub).mockResolvedValue(makeClubDetails(SQUAD))
  vi.mocked(listClubTransactions).mockResolvedValue(makeHistory([]))
  vi.mocked(getClubLineup).mockResolvedValue(makeLineup())
})

describe('ClubPage lineup', () => {
  it('warns that a club without a complete lineup cannot play and draws the saved starters', async () => {
    vi.mocked(getClubLineup).mockResolvedValue(
      makeLineup({ formation: '2-1-1', players: [GOALKEEPER, CENTER_BACK] }),
    )
    await openLineup()

    expect(getClubLineup).toHaveBeenCalledWith(2)
    expect(
      screen.getByText('Escalação incompleta: o Alfa FC não pode jogar partidas'),
    ).toBeInTheDocument()
    expect(screen.getByText('Incompleta')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked()
    expect(fieldNames()).toEqual([
      'PParedãoGOL · 75',
      'ZFZagueiro ForteZAG · 75',
      'VagaDefesa',
      'VagaMeio',
      'VagaAtaque',
    ])
  })

  it('shows an empty lineup and every player as a reserve when the club has none', async () => {
    await openLineup()

    expect(fieldNames()).toEqual(['VagaGoleiro'])
    expect(screen.queryByLabelText('Defesa 1')).not.toBeInTheDocument()
    expect(screen.getByText('Escolha a formação para ver as vagas de linha.')).toBeInTheDocument()
    const reserves = within(screen.getByRole('list', { name: 'Reservas' }))
    expect(reserves.getAllByRole('listitem')).toHaveLength(SQUAD.length)
    expect(reserves.getAllByText('Doente não pode ser escalado.')).toHaveLength(2)
  })

  it('offers only squad players of the slot sector, never sick ones and never twice', async () => {
    const user = await openLineup()

    expect(optionNames('Goleiro')).toEqual(['Selecione…', 'Paredão (GOL)'])
    await chooseFormation(user, '2-1-1')

    expect(optionNames('Defesa 1')).toEqual([
      'Selecione…',
      'Zagueiro Forte (ZAG)',
      'Lateral Veloz (LAT)',
    ])
    expect(optionNames('Meio 1')).toEqual(['Selecione…', 'Meia Lua (MEI)'])
    expect(optionNames('Ataque 1')).toEqual([
      'Selecione…',
      'Artilheiro (ATA)',
      'Centroavante (ATA)',
    ])

    await user.selectOptions(screen.getByLabelText('Defesa 1'), String(CENTER_BACK.id))
    expect(optionNames('Defesa 2')).toEqual(['Selecione…', 'Lateral Veloz (LAT)'])
  })

  it('starts from the saved lineup and keeps only the starters that fit a new formation', async () => {
    vi.mocked(getClubLineup).mockResolvedValue(SAVED_LINEUP)
    const user = await openLineup()

    expect(screen.queryByText(/Escalação incompleta/)).not.toBeInTheDocument()
    expect(screen.getByText('Completa')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked()
    expect(screen.getByLabelText('Meio 1')).toHaveValue(String(MIDFIELDER.id))
    expect(screen.getByText('Lateral Veloz está mal condicionado')).toBeInTheDocument()
    expect(screen.getByText('Passe 82')).toBeInTheDocument()

    await chooseFormation(user, '3-1')

    expect(screen.getByLabelText('Defesa 2')).toHaveValue(String(FULL_BACK.id))
    expect(screen.getByLabelText('Defesa 3')).toHaveValue('')
    expect(screen.getByLabelText('Ataque 1')).toHaveValue(String(STRIKER.id))

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked()
    expect(screen.getByLabelText('Meio 1')).toHaveValue(String(MIDFIELDER.id))
  })

  it('requires the formation and the five starters before sending', async () => {
    const user = await openLineup()

    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }))
    expect(await screen.findByLabelText('Formação')).toHaveAccessibleDescription(
      'Selecione uma opção.',
    )

    await chooseFormation(user, '1-2-1')
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }))

    for (const label of ['Goleiro', 'Defesa 1', 'Meio 1', 'Meio 2', 'Ataque 1']) {
      await waitFor(() =>
        expect(screen.getByLabelText(label)).toHaveAccessibleDescription('Selecione uma opção.'),
      )
    }
    expect(saveClubLineup).not.toHaveBeenCalled()
  })

  it('sends the formation and the five ids once and keeps showing the saved lineup', async () => {
    vi.mocked(saveClubLineup).mockResolvedValue(SAVED_LINEUP)
    const user = await openLineup()

    await chooseFormation(user, '2-1-1')
    await user.selectOptions(screen.getByLabelText('Goleiro'), String(GOALKEEPER.id))
    await user.selectOptions(screen.getByLabelText('Defesa 1'), String(CENTER_BACK.id))
    await user.selectOptions(screen.getByLabelText('Defesa 2'), String(FULL_BACK.id))
    await user.selectOptions(screen.getByLabelText('Meio 1'), String(MIDFIELDER.id))
    await user.selectOptions(screen.getByLabelText('Ataque 1'), String(STRIKER.id))
    vi.mocked(getClubLineup).mockResolvedValue(SAVED_LINEUP)
    await user.dblClick(screen.getByRole('button', { name: 'Salvar escalação' }))

    expect(saveClubLineup).toHaveBeenCalledOnce()
    expect(saveClubLineup).toHaveBeenCalledWith(2, {
      formation: '2-1-1',
      player_ids: [7, 9, 10, 1, 12],
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Escalação salva')
    await waitFor(() => expect(screen.getByText('Completa')).toBeInTheDocument())
    expect(screen.queryByText(/Escalação incompleta/)).not.toBeInTheDocument()
    expect(fieldNames().map((name) => name.split(/[A-Z]{3} ·/)[0])).toEqual([
      'PParedão',
      'ZFZagueiro Forte',
      'LVLateral Veloz',
      'MLMeia Lua',
      'AArtilheiro',
    ])
    expect(screen.getByRole('radio', { name: /^2-1-1/ })).toBeChecked()
    expect(screen.getByLabelText('Goleiro')).toHaveValue(String(GOALKEEPER.id))
    expect(screen.getByLabelText('Defesa 2')).toHaveValue(String(FULL_BACK.id))
    expect(screen.getByLabelText('Ataque 1')).toHaveValue(String(STRIKER.id))
  })

  it('shows the API message when the lineup is refused', async () => {
    vi.mocked(getClubLineup).mockResolvedValue(SAVED_LINEUP)
    vi.mocked(saveClubLineup).mockRejectedValue(
      new ApiError('Jogador doente não pode ser escalado.', 409),
    )
    const user = await openLineup()

    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('A escalação foi recusada')
    expect(alert).toHaveTextContent('Jogador doente não pode ser escalado.')
  })
})
