const DEFAULT_API_URL = 'http://localhost:8000/api/v1'
const NETWORK_ERROR_MESSAGE = 'Não foi possível conectar à API. Verifique se o servidor está no ar.'

const baseUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')

export type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface RequestOptions {
  method?: HttpMethod
  query?: QueryParams
  body?: unknown
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function isFilled(value: QueryValue): value is string | number | boolean {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

export function buildUrl(path: string, query: QueryParams = {}): string {
  const params = new URLSearchParams()
  for (const [name, value] of Object.entries(query)) {
    if (isFilled(value)) params.append(name, String(value))
  }
  const search = params.toString()
  return `${baseUrl}${path}${search ? `?${search}` : ''}`
}

function isErrorBody(body: unknown): body is { message: string } {
  return (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof body.message === 'string'
  )
}

async function readErrorMessage(response: Response): Promise<string> {
  const body: unknown = await response.json().catch(() => null)
  return isErrorBody(body) ? body.message : `A API respondeu com o código ${response.status}.`
}

async function request<T>(path: string, { method = 'GET', query, body }: RequestOptions = {}) {
  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0)
  }
  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const httpClient = {
  get: <T>(path: string, query?: QueryParams) => request<T>(path, { query }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: (path: string) => request<void>(path, { method: 'DELETE' }),
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
}
