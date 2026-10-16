import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { getClub, getClubLineup, listClubTransactions, saveClubLineup } from '../../api/clubs'
import type { Lineup } from '../../api/types'
import { makeClubDetails, makeHistory, makeLineup, makeSquadPlayer } from '../../test/fixtures'
import { summaryValue } from '../../test/queries'
import { renderWithProviders } from '../../test/render'
import { ClubPage } from './ClubPage'

vi.mock('../../api/clubs')
vi.mock('../../api/players')

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

function lineupRows() {
  const table = screen.getByRole('table', { name: 'Titulares' })
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent)
}

beforeEach(() => {
  vi.mocked(getClub).mockResolvedValue(makeClubDetails(SQUAD))
  vi.mocked(listClubTransactions).mockResolvedValue(makeHistory([]))
  vi.mocked(getClubLineup).mockResolvedValue(makeLineup())
})

describe('ClubPage lineup', () => {
  it('warns that a club without a complete lineup cannot play', async () => {
    vi.mocked(getClubLineup).mockResolvedValue(
      makeLineup({ formation: '2-1-1', players: [GOALKEEPER, CENTER_BACK] }),
    )
    await openLineup()

    expect(getClubLineup).toHaveBeenCalledWith(2)
    expect(screen.getByText(/Escalação incompleta: o clube não pode jogar/)).toBeInTheDocument()
    expect(summaryValue('Formação')).toBe('2-1-1')
    expect(summaryValue('Situação')).toBe('Incompleta')
    expect(lineupRows()).toEqual(['Paredão', 'Zagueiro Forte'])
  })

  it('shows an empty lineup when the club has none', async () => {
    await openLineup()

    expect(summaryValue('Formação')).toBe('Não definida')
    expect(screen.getByText('Nenhum titular escalado.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Defesa 1')).not.toBeInTheDocument()
  })

  it('offers only squad players of the slot sector, never sick ones and never twice', async () => {
    const user = await openLineup()

    expect(optionNames('Goleiro')).toEqual(['Selecione…', 'Paredão (Goleiro, Apto)'])
    await user.selectOptions(screen.getByLabelText('Formação'), '2-1-1')

    expect(optionNames('Defesa 1')).toEqual([
      'Selecione…',
      'Zagueiro Forte (Zagueiro, Apto)',
      'Lateral Veloz (Lateral, Mal condicionado)',
    ])
    expect(optionNames('Meio-campo 1')).toEqual(['Selecione…', 'Meia Lua (Meio-campista, Apto)'])
    expect(optionNames('Ataque 1')).toEqual([
      'Selecione…',
      'Artilheiro (Atacante, Apto)',
      'Centroavante (Atacante, Apto)',
    ])

    await user.selectOptions(screen.getByLabelText('Defesa 1'), String(CENTER_BACK.id))
    expect(optionNames('Defesa 2')).toEqual([
      'Selecione…',
      'Lateral Veloz (Lateral, Mal condicionado)',
    ])
  })

  it('starts from the saved lineup and keeps only the starters that fit a new formation', async () => {
    vi.mocked(getClubLineup).mockResolvedValue(SAVED_LINEUP)
    const user = await openLineup()

    expect(screen.queryByText(/Escalação incompleta/)).not.toBeInTheDocument()
    expect(lineupRows()).toEqual([
      'Paredão',
      'Zagueiro Forte',
      'Lateral Veloz',
      'Meia Lua',
      'Artilheiro',
    ])
    expect(screen.getByLabelText('Formação')).toHaveValue('2-1-1')
    expect(screen.getByLabelText('Meio-campo 1')).toHaveValue(String(MIDFIELDER.id))

    await user.selectOptions(screen.getByLabelText('Formação'), '3-1')

    expect(screen.getByLabelText('Defesa 2')).toHaveValue(String(FULL_BACK.id))
    expect(screen.getByLabelText('Defesa 3')).toHaveValue('')
    expect(screen.getByLabelText('Ataque 1')).toHaveValue(String(STRIKER.id))
  })

  it('requires the formation and the five starters before sending', async () => {
    const user = await openLineup()

    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }))
    expect(await screen.findByLabelText('Formação')).toHaveAccessibleDescription(
      /Selecione uma opção\./,
    )

    await user.selectOptions(screen.getByLabelText('Formação'), '1-2-1')
    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }))

    for (const label of ['Goleiro', 'Defesa 1', 'Meio-campo 1', 'Meio-campo 2', 'Ataque 1']) {
      await waitFor(() =>
        expect(screen.getByLabelText(label)).toHaveAccessibleDescription(/Selecione uma opção\./),
      )
    }
    expect(saveClubLineup).not.toHaveBeenCalled()
  })

  it('sends the formation and the five ids once and shows the lineup returned by the API', async () => {
    vi.mocked(saveClubLineup).mockResolvedValue(SAVED_LINEUP)
    const user = await openLineup()

    await user.selectOptions(screen.getByLabelText('Formação'), '2-1-1')
    await user.selectOptions(screen.getByLabelText('Goleiro'), String(GOALKEEPER.id))
    await user.selectOptions(screen.getByLabelText('Defesa 1'), String(CENTER_BACK.id))
    await user.selectOptions(screen.getByLabelText('Defesa 2'), String(FULL_BACK.id))
    await user.selectOptions(screen.getByLabelText('Meio-campo 1'), String(MIDFIELDER.id))
    await user.selectOptions(screen.getByLabelText('Ataque 1'), String(STRIKER.id))
    vi.mocked(getClubLineup).mockResolvedValue(SAVED_LINEUP)
    await user.dblClick(screen.getByRole('button', { name: 'Salvar escalação' }))

    expect(saveClubLineup).toHaveBeenCalledOnce()
    expect(saveClubLineup).toHaveBeenCalledWith(2, {
      formation: '2-1-1',
      player_ids: [7, 9, 10, 1, 12],
    })
    expect(await screen.findByText('Escalação 2-1-1 salva.')).toBeInTheDocument()
    await waitFor(() =>
      expect(lineupRows()).toEqual([
        'Paredão',
        'Zagueiro Forte',
        'Lateral Veloz',
        'Meia Lua',
        'Artilheiro',
      ]),
    )
    expect(summaryValue('Situação')).toBe('Completa')
    expect(screen.queryByText(/Escalação incompleta/)).not.toBeInTheDocument()
  })

  it('shows the API message when the lineup is refused', async () => {
    vi.mocked(getClubLineup).mockResolvedValue(SAVED_LINEUP)
    vi.mocked(saveClubLineup).mockRejectedValue(
      new ApiError('Jogador doente não pode ser escalado.', 409),
    )
    const user = await openLineup()

    await user.click(screen.getByRole('button', { name: 'Salvar escalação' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Jogador doente não pode ser escalado.',
    )
  })
})
