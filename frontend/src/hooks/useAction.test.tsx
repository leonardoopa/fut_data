import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { Button } from '../components/Button'
import { renderWithProviders } from '../test/render'
import { useAction } from './useAction'

function SaveButton({ action }: { action: () => Promise<string> }) {
  const save = useAction(action, { successMessage: (name) => `${name} salvo.` })
  return (
    <Button isPending={save.isPending} onClick={() => save.run()}>
      Salvar
    </Button>
  )
}

describe('useAction', () => {
  it('sends a single request on double click and disables the button while pending', async () => {
    let finish: (name: string) => void = () => undefined
    const action = vi.fn(() => new Promise<string>((resolve) => (finish = resolve)))
    renderWithProviders(<SaveButton action={action} />)

    const button = screen.getByRole('button', { name: 'Salvar' })
    await userEvent.dblClick(button)

    expect(action).toHaveBeenCalledOnce()
    expect(button).toBeDisabled()

    finish('Ana')
    expect(await screen.findByRole('status')).toHaveTextContent('Ana salvo.')
    expect(button).toBeEnabled()
  })

  it('shows the API message when the action is refused', async () => {
    const action = vi.fn().mockRejectedValue(new ApiError('Jogador não encontrado.', 404))
    renderWithProviders(<SaveButton action={action} />)

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Jogador não encontrado.')
  })
})
