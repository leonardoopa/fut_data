import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { Button } from '../components/Button'
import { ActionErrorNotice } from '../components/Notice'
import { renderWithProviders } from '../test/render'
import { useAction } from './useAction'

function SaveButton({
  action,
  errorToastTitle,
}: {
  action: () => Promise<string>
  errorToastTitle?: string
}) {
  const save = useAction(action, {
    success: (name) => ({ title: 'Salvo', message: `${name} salvo.` }),
    errorToastTitle,
    changesLeague: false,
  })
  return (
    <>
      <ActionErrorNotice error={save.error} title="Não foi possível salvar" />
      <Button isPending={save.isPending} onClick={() => save.run()}>
        Salvar
      </Button>
    </>
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
    expect(await screen.findByRole('status')).toHaveTextContent('SalvoAna salvo.')
    expect(button).toBeEnabled()
  })

  it('exposes the API message for an inline banner, without a toast', async () => {
    const action = vi.fn().mockRejectedValue(new ApiError('Jogador não encontrado.', 404))
    renderWithProviders(<SaveButton action={action} />)

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Não foi possível salvar')
    expect(alert).toHaveTextContent('Jogador não encontrado.')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
  })

  it('shows the API message in a toast when asked and flags a network failure', async () => {
    const action = vi.fn().mockRejectedValue(new ApiError('Não foi possível conectar à API.', 0))
    renderWithProviders(<SaveButton action={action} errorToastTitle="Falhou" />)

    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.map((alert) => alert.textContent)).toEqual([
      'Sem conexãoNão foi possível conectar à API.',
      'FalhouNão foi possível conectar à API.',
    ])
  })
})
