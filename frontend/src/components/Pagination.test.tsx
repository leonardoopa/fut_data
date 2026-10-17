import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

const LABEL = { one: 'jogador', other: 'jogadores' }

function renderPagination(props: Partial<Parameters<typeof Pagination>[0]> = {}) {
  const onPageChange = vi.fn()
  render(
    <Pagination
      page={2}
      pageSize={10}
      pageItems={10}
      totalPages={3}
      totalItems={25}
      itemLabel={LABEL}
      onPageChange={onPageChange}
      {...props}
    />,
  )
  return onPageChange
}

describe('Pagination', () => {
  it('shows the range shown and the total found', () => {
    renderPagination()
    expect(screen.getByText('Mostrando 11–20 de 25 jogadores')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })

  it('uses the singular label for one item', () => {
    renderPagination({ page: 1, pageItems: 1, totalPages: 1, totalItems: 1 })
    expect(screen.getByText('Mostrando 1–1 de 1 jogador')).toBeInTheDocument()
  })

  it('moves to the previous, next and chosen pages', async () => {
    const onPageChange = renderPagination()
    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }))
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }))
    expect(onPageChange.mock.calls).toEqual([[3], [1], [3]])
  })

  it('collapses distant pages and disables the buttons at the edges', () => {
    renderPagination({ page: 1, totalPages: 9, totalItems: 85 })
    expect(
      screen.getAllByRole('button', { name: /^Página/ }).map((page) => page.textContent),
    ).toEqual(['1', '2', '9'])
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeEnabled()
  })
})
