import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, buildUrl, httpClient } from './client'

function mockFetch(response: Response | Error) {
  const fetchMock =
    response instanceof Error
      ? vi.fn().mockRejectedValue(response)
      : vi.fn().mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildUrl', () => {
  it('never sends empty query params', () => {
    const url = new URL(
      buildUrl('/players', {
        search: '',
        position: undefined,
        club_id: null,
        free: true,
        page: 2,
        limit: 10,
      }),
    )
    expect(url.pathname).toMatch(/\/players$/)
    expect(url.search).toBe('?free=true&page=2&limit=10')
  })

  it('omits the question mark when there is no param', () => {
    expect(buildUrl('/clubs', { sort: undefined })).toMatch(/\/clubs$/)
  })
})

describe('httpClient', () => {
  it('sends a JSON body and parses the JSON answer', async () => {
    const fetchMock = mockFetch(Response.json({ id: 7 }, { status: 201 }))
    await expect(httpClient.post('/players', { name: 'Ana' })).resolves.toEqual({ id: 7 })
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/players$/),
      expect.objectContaining({ method: 'POST', body: '{"name":"Ana"}' }),
    )
  })

  it('turns a refusal into an ApiError with the API message', async () => {
    mockFetch(Response.json({ message: 'Jogador não encontrado.' }, { status: 404 }))
    const request = httpClient.get('/players/99')
    await expect(request).rejects.toBeInstanceOf(ApiError)
    await expect(request).rejects.toMatchObject({ status: 404, message: 'Jogador não encontrado.' })
  })

  it('returns nothing for answers without a body', async () => {
    mockFetch(new Response(null, { status: 204 }))
    await expect(httpClient.delete('/players/1')).resolves.toBeUndefined()
    mockFetch(new Response('', { status: 200 }))
    await expect(httpClient.post('/players/1/sell')).resolves.toBeUndefined()
  })

  it('sends a POST without body when there is nothing to send', async () => {
    const fetchMock = mockFetch(Response.json({ id: 3 }))
    await httpClient.post('/players/1/sell')
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/players\/1\/sell$/),
      expect.objectContaining({ method: 'POST', body: undefined, headers: undefined }),
    )
  })

  it('downloads a CSV answer as a file named by the API', async () => {
    const csv = 'data_hora;tipo\n2026-10-14T16:22:59-03:00;VENDA\n'
    const fetchMock = mockFetch(
      new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="transacoes-clube-1.csv"',
        },
      }),
    )
    const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:csv')
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const fileName = await httpClient.download(
      '/clubs/1/transactions/export',
      { type: 'VENDA' },
      'fallback.csv',
    )

    expect(fileName).toBe('transacoes-clube-1.csv')
    expect(fetchMock.mock.lastCall?.[0]).toMatch(/\/clubs\/1\/transactions\/export\?type=VENDA$/)
    await expect(createObjectURL.mock.lastCall?.[0].text()).resolves.toBe(csv)
    expect(click.mock.contexts[0]).toMatchObject({ download: fileName, href: 'blob:csv' })
    click.mockRestore()
  })

  it('shows the JSON message when the download is refused', async () => {
    mockFetch(Response.json({ message: 'Jogador não encontrado.' }, { status: 404 }))
    await expect(
      httpClient.download('/clubs/1/transactions/export', { player_id: 9 }, 'fallback.csv'),
    ).rejects.toMatchObject({ status: 404, message: 'Jogador não encontrado.' })
  })

  it('explains when the API cannot be reached', async () => {
    mockFetch(new TypeError('Failed to fetch'))
    await expect(httpClient.get('/players')).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('Não foi possível conectar à API'),
    })
  })
})
