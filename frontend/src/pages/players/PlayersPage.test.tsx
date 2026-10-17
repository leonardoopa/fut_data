import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/client'
import { getClubLineup, listClubs } from '../../api/clubs'
import {
  buyPlayer,
  changePlayerCondition,
  createPlayer,
  deletePlayer,
  listPlayers,
  updatePlayer,
} from '../../api/players'
import type { Page, Player, PlayerListQuery } from '../../api/types'
import { CLUBS, makeLineup, makePage, makePlayer, makePurchase } from '../../test/fixtures'
import { rowOf, summaryValue } from '../../test/queries'
import { renderWithProviders } from '../../test/render'
import { PlayersPage } from './PlayersPage'

vi.mock('../../api/players')
vi.mock('../../api/clubs')
vi.mock('../../api/matches')

const FREE_PLAYER = makePlayer()
const CLUB_PLAYER = makePlayer({
  id: 2,
  name: 'Zagueiro Forte',
  position: 'ZAG',
  condition: 'DOENTE',
  club_id: 2,
})
const FREE_COUNT = 5
const CLUB_COUNT = 7

type User = ReturnType<typeof userEvent.setup>

function answerList(page: Page<Player>) {
  vi.mocked(listPlayers).mockImplementation(async (query: PlayerListQuery) => {
    if (query.limit === 1 && query.free === true) return makePage([], FREE_COUNT)
    if (query.limit === 1 && query.free === false) return makePage([], CLUB_COUNT)
    if (query.limit === 1) return makePage([], FREE_COUNT + CLUB_COUNT)
    return page
  })
}

function listQueries() {
  return vi.mocked(listPlayers).mock.calls.flatMap(([query]) => (query.limit === 10 ? [query] : []))
}

function lastListQuery() {
  return listQueries().at(-1)
}

async function renderPage() {
  const user = userEvent.setup()
  renderWithProviders(<PlayersPage />)
  await screen.findByText(FREE_PLAYER.name)
  return user
}

async function openRowAction(user: User, playerName: string, action: string) {
  await user.click(screen.getByRole('button', { name: `Ações de ${playerName}` }))
  await user.click(screen.getByRole('menuitem', { name: action }))
}

async function chooseOption(user: User, chip: RegExp, option: string) {
  await user.click(screen.getByRole('button', { name: chip }))
  await user.click(screen.getByRole('menuitemradio', { name: option }))
}

beforeEach(() => {
  answerList(makePage([FREE_PLAYER, CLUB_PLAYER], 12))
  vi.mocked(listClubs).mockResolvedValue(CLUBS)
  vi.mocked(getClubLineup).mockResolvedValue(makeLineup())
})

describe('PlayersPage list', () => {
  it('renders the players with formatted values, the club and "Livre", loading the list once', async () => {
    await renderPage()

    expect(listQueries()).toEqual([{ sort: 'name', page: 1, limit: 10 }])
    const freeRow = rowOf(FREE_PLAYER.name)
    expect(freeRow.getByText('Meio-campo')).toBeInTheDocument()
    expect(freeRow.getByText('40,00')).toBeInTheDocument()
    expect(freeRow.getByText('1.234,50')).toBeInTheDocument()
    expect(freeRow.getByText('Livre')).toBeInTheDocument()
    expect(freeRow.getByRole('button', { name: `Comprar ${FREE_PLAYER.name}` })).toBeInTheDocument()

    const clubRow = rowOf(CLUB_PLAYER.name)
    expect(clubRow.getByText('ALF')).toBeInTheDocument()
    expect(clubRow.getByRole('link', { name: 'Alfa FC' })).toHaveAttribute('href', '/clubs/2')
    expect(clubRow.queryByRole('button', { name: /Comprar/ })).not.toBeInTheDocument()

    expect(screen.getByText('Mostrando 1–2 de 12 jogadores')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Todos 12' })).toBeChecked()
    expect(screen.getByRole('radio', { name: `Livres ${FREE_COUNT}` })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: `Em clubes ${CLUB_COUNT}` })).toBeInTheDocument()
  })

  it('sends the combined filters, the market tab, the sort and the page to the API', async () => {
    const user = await renderPage()

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nome' }), 'Lua')
    await waitFor(() => expect(lastListQuery()).toMatchObject({ search: 'Lua' }))
    await chooseOption(user, /^Posição/, 'Meio-campo')
    await chooseOption(user, /^Condição/, 'Apto')
    await user.click(screen.getByRole('radio', { name: /^Livres/ }))
    await user.click(screen.getByRole('button', { name: /^Idade/ }))
    await user.type(screen.getByLabelText('Idade mínima'), '20')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))
    await user.click(screen.getByRole('button', { name: /^Valor de mercado/ }))
    await user.type(screen.getByLabelText('Valor de mercado máximo'), '99,5')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    await waitFor(() =>
      expect(lastListQuery()).toEqual({
        search: 'Lua',
        position: 'MEI',
        condition: 'APTO',
        free: true,
        min_age: 20,
        max_value: 99.5,
        sort: 'name',
        page: 1,
        limit: 10,
      }),
    )
    expect(
      screen.getByRole('button', { name: 'Remover filtro Idade: a partir de 20' }),
    ).toBeVisible()

    await user.click(await screen.findByRole('button', { name: 'Próxima' }))
    await waitFor(() => expect(lastListQuery()).toMatchObject({ free: true, page: 2 }))

    await chooseOption(user, /^Ordenar/, 'Maior valor de mercado')
    await waitFor(() => expect(lastListQuery()).toMatchObject({ sort: 'value_desc', page: 1 }))
  })

  it('clears filters, search, tab, sort and page with "Limpar filtros"', async () => {
    const user = await renderPage()

    await chooseOption(user, /^Ordenar/, 'Menor idade')
    await chooseOption(user, /^Posição/, 'Atacante')
    await user.click(screen.getByRole('radio', { name: /^Em clubes/ }))
    await waitFor(() =>
      expect(lastListQuery()).toMatchObject({ sort: 'age_asc', position: 'ATA', free: false }),
    )

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    await waitFor(() => expect(lastListQuery()).toEqual({ sort: 'name', page: 1, limit: 10 }))
    expect(screen.getByRole('button', { name: /^Ordenar: nome/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Todos/ })).toBeChecked()
  })

  it('prevents combining the free tab with the club filter, showing why', async () => {
    const user = await renderPage()

    await user.click(screen.getByRole('radio', { name: /^Livres/ }))
    expect(screen.getByRole('button', { name: /^Clube/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Clube/ })).toHaveAccessibleDescription(
      '"Livres" não combina com o filtro por clube.',
    )

    await user.click(screen.getByRole('radio', { name: /^Todos/ }))
    await chooseOption(user, /^Clube/, 'Alfa FC')
    expect(screen.getByRole('radio', { name: /^Livres/ })).toBeDisabled()
    await waitFor(() =>
      expect(lastListQuery()).toEqual({ club_id: 2, sort: 'name', page: 1, limit: 10 }),
    )
  })

  it('validates the search and the ranges before sending them', async () => {
    const user = await renderPage()
    const callsBefore = listQueries().length

    await user.type(screen.getByRole('searchbox', { name: 'Buscar por nome' }), 'L')
    expect(screen.getByRole('searchbox', { name: 'Buscar por nome' })).toHaveAccessibleDescription(
      'Use de 2 a 100 caracteres.',
    )
    await user.click(screen.getByRole('button', { name: /^Idade/ }))
    await user.type(screen.getByLabelText('Idade máxima'), '50')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    expect(screen.getByLabelText('Idade máxima')).toHaveAccessibleDescription(
      'Informe um número inteiro de 16 a 45.',
    )
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(listQueries()).toHaveLength(callsBefore)
  })

  it('shows the API message when the list is refused', async () => {
    const user = await renderPage()
    const message = 'A idade mínima (min_age) não pode ser maior que a máxima (max_age).'
    vi.mocked(listPlayers).mockRejectedValue(new ApiError(message, 400))

    await user.click(screen.getByRole('button', { name: /^Idade/ }))
    await user.type(screen.getByLabelText('Idade mínima'), '40')
    await user.type(screen.getByLabelText('Idade máxima'), '20')
    await user.click(screen.getByRole('button', { name: 'Aplicar' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível carregar os jogadores')
    expect(alert).toHaveTextContent(message)
    expect(within(alert).getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })
})

describe('PlayersPage actions', () => {
  it('creates a player and shows the overall and base value computed by the API', async () => {
    const created = makePlayer({ id: 9, name: 'Novo Craque', overall: 81, base_value: 52.25 })
    vi.mocked(createPlayer).mockResolvedValue(created)
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo jogador' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Novo jogador' }))
    await user.type(dialog.getByLabelText('Nome'), 'Novo Craque')
    await user.click(dialog.getByRole('radio', { name: /^ATA/ }))
    await user.type(dialog.getByLabelText('Agilidade'), '80')
    await user.type(dialog.getByLabelText('Idade'), '22')
    for (const label of ['Velocidade', 'Finalização', 'Passe', 'Drible', 'Defesa', 'Físico']) {
      await user.type(dialog.getByLabelText(label), '80')
    }
    await user.type(dialog.getByLabelText('Potencial'), '90')
    const callsBefore = listQueries().length
    await user.dblClick(dialog.getByRole('button', { name: 'Salvar jogador' }))

    const result = await screen.findByRole('dialog', { name: 'Jogador cadastrado' })
    expect(summaryValue('Overall', result)).toBe('81')
    expect(summaryValue('Valor base', result)).toBe('52,25')
    expect(createPlayer).toHaveBeenCalledOnce()
    expect(screen.getByRole('status')).toHaveTextContent('Jogador cadastrado')
    await waitFor(() => expect(listQueries().length).toBeGreaterThan(callsBefore))

    await user.click(within(result).getByRole('button', { name: 'Ver detalhes' }))
    expect(await screen.findByRole('dialog', { name: 'Novo Craque' })).toBeInTheDocument()
  })

  it('shows the API refusal inside the create form', async () => {
    vi.mocked(createPlayer).mockRejectedValue(
      new ApiError('O potencial não pode ser menor que o maior atributo.', 400),
    )
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: 'Novo jogador' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Novo jogador' }))
    await user.type(dialog.getByLabelText('Nome'), 'Novo Craque')
    await user.click(dialog.getByRole('radio', { name: /^ATA/ }))
    await user.type(dialog.getByLabelText('Agilidade'), '80')
    await user.type(dialog.getByLabelText('Idade'), '22')
    for (const label of ['Velocidade', 'Finalização', 'Passe', 'Drible', 'Defesa', 'Físico']) {
      await user.type(dialog.getByLabelText(label), '80')
    }
    await user.type(dialog.getByLabelText('Potencial'), '70')
    await user.click(dialog.getByRole('button', { name: 'Salvar jogador' }))

    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'O potencial não pode ser menor que o maior atributo.',
    )
  })

  it('edits a player with club keeping the position locked and shows the API refusal', async () => {
    vi.mocked(updatePlayer).mockRejectedValue(
      new ApiError('A idade não pode ser menor que a atual (25 anos).', 409),
    )
    const user = await renderPage()

    await openRowAction(user, CLUB_PLAYER.name, 'Editar')
    const dialog = within(screen.getByRole('dialog', { name: 'Editar jogador' }))
    expect(dialog.getByLabelText('Posição')).toHaveAccessibleDescription(
      'Jogador com clube não pode mudar de posição.',
    )
    expect(dialog.getByRole('radio', { name: /^ATA/ })).toBeDisabled()
    expect(dialog.getByRole('radio', { name: /^ZAG/ })).toBeChecked()

    await user.clear(dialog.getByLabelText('Idade'))
    await user.type(dialog.getByLabelText('Idade'), '20')
    await user.click(dialog.getByRole('button', { name: 'Salvar alterações' }))

    expect(updatePlayer).toHaveBeenCalledWith(CLUB_PLAYER.id, {
      name: CLUB_PLAYER.name,
      position: 'ZAG',
      agility: CLUB_PLAYER.agility,
      age: 20,
    })
    expect(await dialog.findByRole('alert')).toHaveTextContent(
      'A idade não pode ser menor que a atual (25 anos).',
    )
  })

  it('does not offer APTO to a sick player and sends the chosen condition', async () => {
    vi.mocked(changePlayerCondition).mockResolvedValue({
      ...CLUB_PLAYER,
      condition: 'MAL_CONDICIONADO',
    })
    const user = await renderPage()

    await openRowAction(user, CLUB_PLAYER.name, 'Alterar condição')
    const dialog = within(screen.getByRole('dialog', { name: 'Alterar condição física' }))
    expect(dialog.getByRole('radio', { name: /^Apto/ })).toBeDisabled()
    expect(dialog.getByRole('radio', { name: /^Apto/ })).toHaveAccessibleName(
      /De Doente não passa direto para Apto\./,
    )

    await user.click(dialog.getByRole('radio', { name: /^Mal condicionado/ }))
    await user.dblClick(dialog.getByRole('button', { name: 'Salvar condição' }))

    expect(changePlayerCondition).toHaveBeenCalledOnce()
    expect(changePlayerCondition).toHaveBeenCalledWith(CLUB_PLAYER.id, {
      condition: 'MAL_CONDICIONADO',
    })
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Zagueiro Forte agora está Mal condicionado.',
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('warns that a starter who becomes sick leaves the lineup, using the club lineup', async () => {
    const starter = makePlayer({ id: 3, name: 'Titular Firme', position: 'GOL', club_id: 2 })
    answerList(makePage([FREE_PLAYER, starter], 2))
    vi.mocked(getClubLineup).mockResolvedValue(
      makeLineup({ formation: '2-1-1', complete: false, players: [starter] }),
    )
    const user = await renderPage()

    await openRowAction(user, starter.name, 'Alterar condição')
    const dialog = within(screen.getByRole('dialog', { name: 'Alterar condição física' }))
    await waitFor(() => expect(getClubLineup).toHaveBeenCalledWith(2))
    await user.click(dialog.getByRole('radio', { name: /^Doente/ }))

    expect(await dialog.findByText('Titular Firme é titular')).toBeInTheDocument()
    expect(dialog.getByText(/sai da escalação, e o Alfa FC só volta a jogar/)).toBeInTheDocument()
  })

  it('deletes a free player after confirmation with a single request on double click', async () => {
    vi.mocked(deletePlayer).mockResolvedValue(undefined)
    const user = await renderPage()

    await user.click(screen.getByRole('button', { name: `Ações de ${CLUB_PLAYER.name}` }))
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toBeDisabled()
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toHaveAccessibleDescription(
      'Disponível só para jogadores livres.',
    )
    await user.keyboard('{Escape}')

    await openRowAction(user, FREE_PLAYER.name, 'Excluir')
    const dialog = within(screen.getByRole('dialog', { name: `Excluir ${FREE_PLAYER.name}?` }))
    answerList(makePage([CLUB_PLAYER], 11))
    await user.dblClick(dialog.getByRole('button', { name: 'Excluir jogador' }))

    expect(deletePlayer).toHaveBeenCalledOnce()
    expect(deletePlayer).toHaveBeenCalledWith(FREE_PLAYER.id)
    expect(await screen.findByRole('status')).toHaveTextContent('Jogador excluído')
    await waitFor(() => expect(screen.queryByText(FREE_PLAYER.name)).not.toBeInTheDocument())
    expect(screen.getByText('Mostrando 1–1 de 11 jogadores')).toBeInTheDocument()
  })

  it('buys a free player: validates, sends the Brasília offset and shows the result', async () => {
    vi.mocked(buyPlayer).mockResolvedValue(makePurchase())
    const user = await renderPage()

    await user.click(rowOf(FREE_PLAYER.name).getByRole('button', { name: /Comprar/ }))
    const dialog = within(screen.getByRole('dialog', { name: 'Comprar jogador' }))
    await user.click(dialog.getByRole('button', { name: 'Confirmar compra' }))

    expect(dialog.getByLabelText('Clube comprador')).toHaveAccessibleDescription(
      'Selecione uma opção.',
    )
    expect(dialog.getByLabelText('Data do fim da fidelidade')).toHaveAccessibleDescription(
      'Informe a data.',
    )
    expect(dialog.getByLabelText('Hora do fim da fidelidade')).toHaveAccessibleDescription(
      'Informe a hora.',
    )
    expect(buyPlayer).not.toHaveBeenCalled()

    await user.selectOptions(dialog.getByLabelText('Clube comprador'), '2')
    expect(dialog.getByLabelText('Clube comprador')).toHaveAccessibleDescription(
      'Caixa atual: 300,00. O custo total (valor + taxa) pode ir até 50% do caixa.',
    )
    await user.type(dialog.getByLabelText('Data do fim da fidelidade'), '2027-01-10')
    await user.type(dialog.getByLabelText('Hora do fim da fidelidade'), '10:00')
    const callsBefore = listQueries().length
    await user.dblClick(dialog.getByRole('button', { name: 'Confirmar compra' }))

    expect(buyPlayer).toHaveBeenCalledOnce()
    expect(buyPlayer).toHaveBeenCalledWith(FREE_PLAYER.id, {
      club_id: 2,
      loyalty_until: '2027-01-10T10:00-03:00',
    })
    const result = await screen.findByRole('dialog', { name: 'Compra concluída' })
    expect(summaryValue('Valor', result)).toBe('37,00')
    expect(summaryValue('Taxa', result)).toBe('1,85')
    expect(summaryValue('Custo total', result)).toBe('38,85')
    expect(summaryValue('Fim da fidelidade', result)).toMatch(/^10\/01\/2027,? 10:00$/)
    expect(summaryValue('Contrato', result)).toBe('ATIVO')
    expect(summaryValue('Novo caixa', result)).toBe('261,15')
    expect(screen.getByRole('status')).toHaveTextContent('Compra concluída')
    await waitFor(() => expect(listQueries().length).toBeGreaterThan(callsBefore))
  })

  it('shows the API refusal of a purchase inside the dialog', async () => {
    vi.mocked(buyPlayer).mockRejectedValue(
      new ApiError('O custo da compra (105,00) passa do limite de 50% do caixa (90,92).', 409),
    )
    const user = await renderPage()

    await user.click(rowOf(FREE_PLAYER.name).getByRole('button', { name: /Comprar/ }))
    const dialog = within(screen.getByRole('dialog', { name: 'Comprar jogador' }))
    await user.selectOptions(dialog.getByLabelText('Clube comprador'), '2')
    await user.type(dialog.getByLabelText('Data do fim da fidelidade'), '2027-01-10')
    await user.type(dialog.getByLabelText('Hora do fim da fidelidade'), '10:00')
    await user.click(dialog.getByRole('button', { name: 'Confirmar compra' }))

    const alert = await dialog.findByRole('alert')
    expect(alert).toHaveTextContent('Compra recusada')
    expect(alert).toHaveTextContent('O custo da compra (105,00) passa do limite de 50% do caixa')
  })
})
