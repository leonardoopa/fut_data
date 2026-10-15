import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlayerCreateForm } from './PlayerCreateForm'

function renderForm() {
  const onSubmit = vi.fn()
  render(<PlayerCreateForm isPending={false} onSubmit={onSubmit} onCancel={vi.fn()} />)
  return { onSubmit, user: userEvent.setup() }
}

const VALID_INDICATORS: Record<string, string> = {
  Velocidade: '70',
  Finalização: '68',
  Passe: '82',
  Drible: '79',
  Defesa: '55',
  Físico: '64',
  Potencial: '86',
}

describe('PlayerCreateForm', () => {
  it('shows the required messages and does not submit an empty form', async () => {
    const { onSubmit, user } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(screen.getByLabelText('Nome')).toHaveAccessibleDescription('Campo obrigatório.')
    expect(screen.getByLabelText('Nome')).toHaveFocus()
    expect(screen.getByLabelText('Posição')).toHaveAccessibleDescription('Selecione uma opção.')
    expect(screen.getByLabelText('Potencial')).toHaveAccessibleDescription('Campo obrigatório.')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('checks text length and numeric ranges next to each field', async () => {
    const { onSubmit, user } = renderForm()

    await user.type(screen.getByLabelText('Nome'), 'Al')
    await user.type(screen.getByLabelText('Agilidade (1 a 100)'), '101')
    await user.type(screen.getByLabelText('Idade (16 a 45)'), '15')
    await user.type(screen.getByLabelText('Velocidade'), '100')
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(screen.getByLabelText('Nome')).toHaveAccessibleDescription('Use de 3 a 100 caracteres.')
    expect(screen.getByLabelText('Agilidade (1 a 100)')).toHaveAccessibleDescription(
      'Informe um número inteiro de 1 a 100.',
    )
    expect(screen.getByLabelText('Idade (16 a 45)')).toHaveAccessibleDescription(
      'Informe um número inteiro de 16 a 45.',
    )
    expect(screen.getByLabelText('Velocidade')).toHaveAccessibleDescription(
      'Informe um número inteiro de 1 a 99.',
    )
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the eleven fields as numbers once they are valid', async () => {
    const { onSubmit, user } = renderForm()

    await user.type(screen.getByLabelText('Nome'), '  Meia Lua ')
    await user.selectOptions(screen.getByLabelText('Posição'), 'MEI')
    await user.type(screen.getByLabelText('Agilidade (1 a 100)'), '85')
    await user.type(screen.getByLabelText('Idade (16 a 45)'), '25')
    for (const [label, value] of Object.entries(VALID_INDICATORS)) {
      await user.type(screen.getByLabelText(label), value)
    }
    await user.click(screen.getByRole('button', { name: 'Cadastrar' }))

    expect(onSubmit).toHaveBeenCalledWith(
      {
        name: 'Meia Lua',
        position: 'MEI',
        agility: 85,
        age: 25,
        pace: 70,
        shooting: 68,
        passing: 82,
        dribbling: 79,
        defending: 55,
        physical: 64,
        potential: 86,
      },
      expect.anything(),
    )
  })
})
