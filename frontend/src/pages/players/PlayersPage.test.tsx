import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { listClubs } from '../../api/clubs'
import {
  changePlayerCondition,
  createPlayer,
  deletePlayer,
  listPlayers,
  updatePlayer,
} from '../../api/players'
import { CLUBS, makePage, makePlayer } from '../../test/fixtures'
import { renderWithProviders } from '../../test/render'
import { PlayersPage } from './PlayersPage'

vi.mock('../../api/players')
vi.mock('../../api/clubs')

const FREE_PLAYER = makePlayer()
const CLUB_PLAYER = makePlayer({
  id: 2,
  name: 'Zagueiro Forte',
  position: 'ZAG',
  condition: 'DOENTE',
  club_id: 2,
})

function lastQuery() {
  return vi.mocked(listPlayers).mock.lastCall?.[0]
}

async function renderPage() {
  const user = userEvent.setup()
  renderWithProviders(<PlayersPage />)
  await screen.findByRole('cell', { name: FREE_PLAYER.name })
  return user
}

function rowOf(name: string) {
  const row = screen.getByRole('cell', { name }).closest('tr')
  if (!row) throw new Error(`Linha de ${name} não encontrada.`)
  return within(row)
}

beforeEach(() => {
  vi.mocked(listPlayers).mockResolvedValue(makePage([FREE_PLAYER, CLUB_PLAYER], 12))
  vi.mocked(listClubs).mockResolvedValue(CLUBS)
})

describe('PlayersPage', () => {
  it('renders the players with formatted values, the club acronym and "Livre"', async () => {
    await renderPage()

    expect(lastQuery()).toEqual({ page: 1, limit: 10 })
    const freeRow = rowOf(FREE_PLAYER.name)
    expect(freeRow.getByText('Meio-campista')).toBeInTheDocument()
    expect(freeRow.getByText('40,00')).toBeInTheDocument()
    expect(freeRow.getByText('1.234,50')).toBeInTheDocument()
    expect(freeRow.getByText('Livre')).toBeInTheDocument()
    expect(freeRow.getByRole('button', { name: `Excluir ${FREE_PLAYER.name}` })).toBeInTheDocument()

    const clubRow = rowOf(CLUB_PLAYER.name)
    expect(clubRow.getByTitle('Alfa FC')).toHaveTextContent('ALF')
    expect(clubRow.queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()

    expect(screen.getByText('12 jogadores encontrados')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  })

  it('sends the combined filters, the sort and the page to the API', async () => {
    const user = await renderPage()

    await user.type(screen.getByLabelText('Buscar por nome'), 'Lua')
    await user.selectOptions(screen.getByLabelText('Posição'), 'MEI')
    await user.selectOptions(screen.getByLabelText('Condição'), 'APTO')
    await user.click(screen.getByLabelText('Só livres'))
    await user.type(screen.getByLabelText('Idade mínima'), '20')
    await user.type(screen.getByLabelText('Valor de mercado máximo'), '99,5')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    await waitFor(() =>
      expect(lastQuery()).toEqual({
        search: 'Lua',
        position: 'MEI',
        condition: 'APTO',
        free: true,
        min_age: 20,
        max_value: 99.5,
        page: 1,
        limit: 10,
      }),
    )

    await user.click(await screen.findByRole('button', { name: 'Próxima' }))
    await waitFor(() => expect(lastQuery()).toMatchObject({ free: true, page: 2 }))

    await user.selectOptions(screen.getByLabelText('Ordenar por'), 'value_desc')
    await waitFor(() => expect(lastQuery()).toMatchObject({ sort: 'value_desc', page: 1 }))
  })

  it('prevents combining "Só livres" with the club filter, showing why', async () => {
    const user = await renderPage()

    await user.click(screen.getByLabelText('Só livres'))
    expect(screen.getByLabelText('Clube')).toBeDisabled()
    expect(screen.getByLabelText('Clube')).toHaveAccessibleDescription(
      'Indisponível com "Só livres": jogador livre não tem clube.',
    )

    await user.click(screen.getByLabelText('Só livres'))
    await user.selectOptions(screen.getByLabelText('Clube'), '2')
    expect(screen.getByLabelText('Só livres')).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Filtrar' }))
    await waitFor(() => expect(lastQuery()).toEqual({ club_id: 2, page: 1, limit: 10 }))
  })

  it('validates the filters before sending them', async () => {
    const user = await renderPage()
    const callsBefore = vi.mocked(listPlayers).mock.calls.length

    await user.type(screen.getByLabelText('Buscar por nome'), 'L')
    await user.type(screen.getByLabelText('Idade máxima'), '50')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    expect(screen.getByLabelText('Buscar por nome')).toHaveAccessibleDescription(
      'Use de 2 a 100 caracteres.',
    )
    expect(screen.getByLabelText('Idade máxima')).toHaveAccessibleDescription(
      'Informe um número inteiro de 16 a 45.',
    )
    expect(vi.mocked(listPlayers).mock.calls).toHaveLength(callsBefore)
  })

  it('shows the API message when the list is refused', async () => {
    const user = await renderPage()
    const message = 'A idade mínima (min_age) não pode ser maior que a máxima (max_age).'
    vi.mocked(listPlayers).mockRejectedValueOnce(new ApiError(message, 400))

    await user.type(screen.getByLabelText('Idade mínima'), '40')
    await user.type(screen.getByLabelText('Idade máxima'), '20')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
  })

  it('creates a player and shows the overall and base value computed by the API', async () => {
    const created = makePlayer({ id: 9, name: 'Novo Craque', overall: 81, base_value: 52.25 })
    vi.mocked(createPlayer).mockResolvedValue(created)
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo jogador' }))
    const dialog = within(screen.getByRole('dialog'))
    await user.type(dialog.getByLabelText('Nome'), 'Novo Craque')
    await user.selectOptions(dialog.getByLabelText('Posição'), 'ATA')
    await user.type(dialog.getByLabelText('Agilidade (1 a 100)'), '80')
    await user.type(dialog.getByLabelText('Idade (16 a 45)'), '22')
    for (const label of ['Velocidade', 'Finalização', 'Passe', 'Drible', 'Defesa', 'Físico']) {
      await user.type(dialog.getByLabelText(label), '80')
    }
    await user.type(dialog.getByLabelText('Potencial'), '90')
    const callsBefore = vi.mocked(listPlayers).mock.calls.length
    await user.click(dialog.getByRole('button', { name: 'Cadastrar' }))

    expect(await dialog.findByText('81')).toBeInTheDocument()
    expect(dialog.getByText('52,25')).toBeInTheDocument()
    expect(createPlayer).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('Jogador "Novo Craque" cadastrado.')
    await waitFor(() =>
      expect(vi.mocked(listPlayers).mock.calls.length).toBeGreaterThan(callsBefore),
    )
  })

  it('edits a player with club keeping the position locked and shows the API refusal', async () => {
    vi.mocked(updatePlayer).mockRejectedValue(
      new ApiError('A idade não pode ser menor que a atual (25 anos).', 409),
    )
    const user = await renderPage()

    await user.click(rowOf(CLUB_PLAYER.name).getByRole('button', { name: /Editar/ }))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByLabelText('Posição')).toHaveAccessibleDescription(
      'Jogador com clube não pode mudar de posição.',
    )
    expect(dialog.getByRole('option', { name: 'Atacante' })).toBeDisabled()

    await user.clear(dialog.getByLabelText('Idade (16 a 45)'))
    await user.type(dialog.getByLabelText('Idade (16 a 45)'), '20')
    await user.click(dialog.getByRole('button', { name: 'Salvar' }))

    expect(updatePlayer).toHaveBeenCalledWith(CLUB_PLAYER.id, {
      name: CLUB_PLAYER.name,
      position: 'ZAG',
      agility: CLUB_PLAYER.agility,
      age: 20,
    })
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A idade não pode ser menor que a atual (25 anos).',
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not offer APTO to a sick player and sends the chosen condition', async () => {
    vi.mocked(changePlayerCondition).mockResolvedValue({
      ...CLUB_PLAYER,
      condition: 'MAL_CONDICIONADO',
    })
    const user = await renderPage()

    await user.click(rowOf(CLUB_PLAYER.name).getByRole('button', { name: /Alterar condição/ }))
    const dialog = within(screen.getByRole('dialog'))
    expect(dialog.getByRole('option', { name: 'Apto' })).toBeDisabled()

    await user.selectOptions(dialog.getByLabelText('Nova condição'), 'MAL_CONDICIONADO')
    await user.click(dialog.getByRole('button', { name: 'Salvar' }))

    expect(changePlayerCondition).toHaveBeenCalledWith(CLUB_PLAYER.id, {
      condition: 'MAL_CONDICIONADO',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Condição de "Zagueiro Forte" alterada para Mal condicionado.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deletes a free player after confirmation with a single request on double click', async () => {
    vi.mocked(deletePlayer).mockResolvedValue(undefined)
    const user = await renderPage()

    await user.click(rowOf(FREE_PLAYER.name).getByRole('button', { name: /Excluir/ }))
    const dialog = within(screen.getByRole('dialog'))
    vi.mocked(listPlayers).mockResolvedValue(makePage([CLUB_PLAYER], 11))
    await user.dblClick(dialog.getByRole('button', { name: 'Excluir' }))

    expect(deletePlayer).toHaveBeenCalledOnce()
    expect(deletePlayer).toHaveBeenCalledWith(FREE_PLAYER.id)
    expect(await screen.findByRole('status')).toHaveTextContent('Jogador "Meia Lua" excluído.')
    await waitFor(() =>
      expect(screen.queryByRole('cell', { name: FREE_PLAYER.name })).not.toBeInTheDocument(),
    )
    expect(screen.getByText('11 jogadores encontrados')).toBeInTheDocument()
  })
})
