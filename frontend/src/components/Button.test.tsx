import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('ignores the second click of a double click on an action button', async () => {
    const onClick = vi.fn()
    render(
      <Button isPending={false} onClick={onClick}>
        Exportar
      </Button>,
    )

    await userEvent.dblClick(screen.getByRole('button', { name: 'Exportar' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('keeps every click on a plain button', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Próxima</Button>)

    await userEvent.dblClick(screen.getByRole('button', { name: 'Próxima' }))

    expect(onClick).toHaveBeenCalledTimes(2)
  })
})
