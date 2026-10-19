import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Popover } from './Popover'

function renderPopover() {
  const user = userEvent.setup()
  render(
    <Popover label="Ordenar" variant="select">
      {(close) => (
        <button type="button" role="menuitem" onClick={close}>
          Maior idade
        </button>
      )}
    </Popover>,
  )
  return user
}

describe('Popover', () => {
  it('stays open and follows the button when the page or a table scrolls', async () => {
    const user = renderPopover()
    await user.click(screen.getByRole('button', { name: 'Ordenar' }))

    fireEvent.scroll(window)
    fireEvent(window, new Event('resize'))

    expect(screen.getByRole('menuitem', { name: 'Maior idade' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Ordenar' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('closes on an outside press and on Escape', async () => {
    const user = renderPopover()
    const trigger = screen.getByRole('button', { name: 'Ordenar' })

    await user.click(trigger)
    await user.click(document.body)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})
