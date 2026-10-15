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

  it('returns nothing for 204 answers', async () => {
    mockFetch(new Response(null, { status: 204 }))
    await expect(httpClient.delete('/players/1')).resolves.toBeUndefined()
  })

  it('explains when the API cannot be reached', async () => {
    mockFetch(new TypeError('Failed to fetch'))
    await expect(httpClient.get('/players')).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('Não foi possível conectar à API'),
    })
  })
})
