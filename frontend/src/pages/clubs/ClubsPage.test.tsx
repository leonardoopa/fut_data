import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { createClub, listClubs } from '../../api/clubs'
import { makeClub } from '../../test/fixtures'
import { rowOf } from '../../test/queries'
import { renderWithProviders } from '../../test/render'
import { ClubsPage } from './ClubsPage'

vi.mock('../../api/clubs')

const RICH_CLUB = makeClub({
  id: 3,
  name: 'Zeta Esporte Clube',
  acronym: 'ZEC',
  cash: 1500.5,
  squad_value: 250,
  net_worth: 1750.5,
})
const POOR_CLUB = makeClub()

async function renderPage() {
  const user = userEvent.setup()
  renderWithProviders(<ClubsPage />)
  await screen.findByRole('cell', { name: RICH_CLUB.name })
  return user
}

function clubNamesInOrder() {
  return screen
    .getAllByRole('row')
    .slice(1)
    .map((row) => within(row).getAllByRole('cell')[0].textContent)
}

beforeEach(() => {
  vi.mocked(listClubs).mockResolvedValue([RICH_CLUB, POOR_CLUB])
})

describe('ClubsPage', () => {
  it('lists the clubs in the order returned by the API, sorted by name by default', async () => {
    await renderPage()

    expect(listClubs).toHaveBeenLastCalledWith('name')
    expect(clubNamesInOrder()).toEqual([RICH_CLUB.name, POOR_CLUB.name])
    const row = rowOf(RICH_CLUB.name)
    expect(row.getByText('ZEC')).toBeInTheDocument()
    expect(row.getByText('1.500,50')).toBeInTheDocument()
    expect(row.getByText('250,00')).toBeInTheDocument()
    expect(row.getByText('1.750,50')).toBeInTheDocument()
    expect(row.getByRole('link', { name: RICH_CLUB.name })).toHaveAttribute('href', '/clubs/3')
  })

  it('sends the chosen sort and shows the new order from the API', async () => {
    const user = await renderPage()
    vi.mocked(listClubs).mockResolvedValue([POOR_CLUB, RICH_CLUB])

    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'net_worth_asc')

    expect(listClubs).toHaveBeenLastCalledWith('net_worth_asc')
    await waitFor(() => expect(clubNamesInOrder()).toEqual([POOR_CLUB.name, RICH_CLUB.name]))
  })

  it('validates the new club before sending it', async () => {
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo clube' }))
    const dialog = within(screen.getByRole('dialog'))
    await user.click(dialog.getByRole('button', { name: 'Criar clube' }))

    expect(dialog.getByLabelText('Nome')).toHaveAccessibleDescription(
      'De 3 a 60 caracteres. Campo obrigatório.',
    )
    expect(dialog.getByLabelText('Sigla')).toHaveAccessibleDescription(
      '3 letras do nome, começando pela inicial. Campo obrigatório.',
    )

    await user.type(dialog.getByLabelText('Nome'), 'Al')
    await user.type(dialog.getByLabelText('Sigla'), 'A1')
    await user.click(dialog.getByRole('button', { name: 'Criar clube' }))

    expect(dialog.getByLabelText('Nome')).toHaveAccessibleDescription(
      'De 3 a 60 caracteres. Use de 3 a 60 caracteres.',
    )
    expect(dialog.getByLabelText('Sigla')).toHaveAccessibleDescription(
      '3 letras do nome, começando pela inicial. Use 3 letras de A a Z.',
    )
    expect(createClub).not.toHaveBeenCalled()
  })

  it('shows the API message when the club is refused and keeps the form open', async () => {
    const message = 'Já existe um clube com esse nome.'
    vi.mocked(createClub).mockRejectedValue(new ApiError(message, 409))
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo clube' }))
    const dialog = within(screen.getByRole('dialog'))
    await user.type(dialog.getByLabelText('Nome'), 'Alfa FC')
    await user.type(dialog.getByLabelText('Sigla'), 'alf')
    await user.click(dialog.getByRole('button', { name: 'Criar clube' }))

    expect(createClub).toHaveBeenCalledWith({ name: 'Alfa FC', acronym: 'ALF' })
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('creates a club and reloads the list from the API', async () => {
    const created = makeClub({ id: 4, name: 'Gama Futebol Clube', acronym: 'GFC' })
    vi.mocked(createClub).mockResolvedValue(created)
    const user = await renderPage()
    vi.mocked(listClubs).mockResolvedValue([RICH_CLUB, created, POOR_CLUB])

    await user.click(screen.getByRole('button', { name: 'Novo clube' }))
    const dialog = within(screen.getByRole('dialog'))
    await user.type(dialog.getByLabelText('Nome'), created.name)
    await user.type(dialog.getByLabelText('Sigla'), created.acronym)
    await user.dblClick(dialog.getByRole('button', { name: 'Criar clube' }))

    expect(createClub).toHaveBeenCalledOnce()
    expect(await screen.findByText('Clube "Gama Futebol Clube" criado.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByRole('cell', { name: created.name })).toBeInTheDocument()
  })
})
