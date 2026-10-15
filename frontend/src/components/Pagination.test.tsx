import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

const LABEL = { one: 'jogador encontrado', other: 'jogadores encontrados' }

describe('Pagination', () => {
  it('shows the total found and the current page', () => {
    render(
      <Pagination
        page={2}
        totalPages={3}
        totalItems={25}
        itemLabel={LABEL}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText('25 jogadores encontrados')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 3')).toBeInTheDocument()
  })

  it('uses the singular label for one item', () => {
    render(
      <Pagination
        page={1}
        totalPages={1}
        totalItems={1}
        itemLabel={LABEL}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByText('1 jogador encontrado')).toBeInTheDocument()
  })

  it('moves to the previous and next pages', async () => {
    const onPageChange = vi.fn()
    render(
      <Pagination
        page={2}
        totalPages={3}
        totalItems={25}
        itemLabel={LABEL}
        onPageChange={onPageChange}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    expect(onPageChange.mock.calls).toEqual([[3], [1]])
  })

  it('disables the buttons at the edges', () => {
    render(
      <Pagination
        page={1}
        totalPages={1}
        totalItems={4}
        itemLabel={LABEL}
        onPageChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled()
  })
})
