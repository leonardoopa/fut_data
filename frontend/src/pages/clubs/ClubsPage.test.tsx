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
vi.mock('../../api/players')
vi.mock('../../api/matches')

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
  renderWithProviders(<ClubsPage />, {
    url: '/clubs',
    path: '/clubs',
    routes: { '/clubs/:clubId': <p>Página do clube</p> },
  })
  await screen.findByText(RICH_CLUB.name)
  return user
}

function clubNamesInOrder() {
  return screen
    .getAllByRole('link', { name: /^Ver clube/ })
    .map((link) => link.getAttribute('aria-label'))
}

async function fillClub(user: ReturnType<typeof userEvent.setup>, name: string, acronym: string) {
  const dialog = within(screen.getByRole('dialog', { name: 'Novo clube' }))
  await user.type(dialog.getByLabelText('Nome'), name)
  await user.type(dialog.getByLabelText('Sigla'), acronym)
  return dialog
}

beforeEach(() => {
  vi.mocked(listClubs).mockResolvedValue([RICH_CLUB, POOR_CLUB])
})

describe('ClubsPage', () => {
  it('lists the clubs in the order returned by the API, sorted by name by default', async () => {
    await renderPage()

    expect(listClubs).toHaveBeenCalledOnce()
    expect(listClubs).toHaveBeenLastCalledWith('name')
    expect(clubNamesInOrder()).toEqual([
      `Ver clube ${RICH_CLUB.name}`,
      `Ver clube ${POOR_CLUB.name}`,
    ])
    const row = rowOf(RICH_CLUB.name)
    expect(row.getAllByText('ZEC')).toHaveLength(2)
    expect(row.getByText('1.500,50')).toBeInTheDocument()
    expect(row.getByText('250,00')).toBeInTheDocument()
    expect(row.getByText('1.750,50')).toBeInTheDocument()
    expect(row.getByRole('link', { name: `Ver clube ${RICH_CLUB.name}` })).toHaveAttribute(
      'href',
      '/clubs/3',
    )
    expect(screen.getByText('2 de 20')).toBeInTheDocument()
  })

  it('sends the chosen sort and shows the new order from the API', async () => {
    const user = await renderPage()
    vi.mocked(listClubs).mockResolvedValue([POOR_CLUB, RICH_CLUB])

    await user.click(screen.getByRole('button', { name: /^Ordenar: nome/ }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Patrimônio (menor para o maior)' }))

    expect(listClubs).toHaveBeenLastCalledWith('net_worth_asc')
    await waitFor(() =>
      expect(clubNamesInOrder()).toEqual([
        `Ver clube ${POOR_CLUB.name}`,
        `Ver clube ${RICH_CLUB.name}`,
      ]),
    )
  })

  it('shows the empty and the error states of the list', async () => {
    vi.mocked(listClubs).mockResolvedValueOnce([])
    renderWithProviders(<ClubsPage />)

    expect(await screen.findByText('Nenhum clube cadastrado')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Novo clube' })).toHaveLength(2)
  })

  it('shows the API error with a retry', async () => {
    vi.mocked(listClubs).mockRejectedValueOnce(new ApiError('Não foi possível conectar à API.', 0))
    const user = userEvent.setup()
    renderWithProviders(<ClubsPage />)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar os clubes')
    expect(alert).toHaveTextContent('Não foi possível conectar à API.')
    await user.click(within(alert).getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByText(RICH_CLUB.name)).toBeInTheDocument()
  })

  it('validates the new club before sending it', async () => {
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo clube' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Novo clube' }))
    await user.click(dialog.getByRole('button', { name: 'Criar clube' }))

    expect(dialog.getByLabelText('Nome')).toHaveAccessibleDescription('Campo obrigatório.')
    expect(dialog.getByLabelText('Sigla')).toHaveAccessibleDescription('Campo obrigatório.')

    await fillClub(user, 'Al', 'A1')
    await user.click(dialog.getByRole('button', { name: 'Criar clube' }))

    expect(dialog.getByLabelText('Nome')).toHaveAccessibleDescription('Use de 3 a 60 caracteres.')
    expect(dialog.getByLabelText('Sigla')).toHaveAccessibleDescription('Use 3 letras de A a Z.')
    expect(createClub).not.toHaveBeenCalled()
  })

  it('shows the API message when the club is refused and keeps the form open', async () => {
    const message = 'Já existe um clube com o nome "Alfa FC".'
    vi.mocked(createClub).mockRejectedValue(new ApiError(message, 409))
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo clube' }))
    const dialog = await fillClub(user, 'Alfa FC', 'alf')
    await user.click(dialog.getByRole('button', { name: 'Criar clube' }))

    expect(createClub).toHaveBeenCalledWith({ name: 'Alfa FC', acronym: 'ALF' })
    const alert = await dialog.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível criar o clube')
    expect(alert).toHaveTextContent(message)
    expect(screen.getByRole('dialog', { name: 'Novo clube' })).toBeInTheDocument()
  })

  it('creates a club once, reloads the clubs and opens the new club page', async () => {
    const created = makeClub({ id: 4, name: 'Gama Futebol Clube', acronym: 'GFC' })
    vi.mocked(createClub).mockResolvedValue(created)
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo clube' }))
    const dialog = await fillClub(user, created.name, created.acronym)
    await user.dblClick(dialog.getByRole('button', { name: 'Criar clube' }))

    expect(createClub).toHaveBeenCalledOnce()
    expect(await screen.findByText('Página do clube')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Clube criadoGama Futebol Clube (GFC) começa com 300,00 em caixa.',
    )
    await waitFor(() => expect(listClubs).toHaveBeenCalledTimes(2))
  })
})
