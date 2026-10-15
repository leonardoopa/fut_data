import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InputField, SelectField } from './FormField'

describe('FormField', () => {
  it('links the label to the control', () => {
    render(<InputField label="Nome" />)
    const input = screen.getByLabelText('Nome')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('shows the error next to the field and marks it invalid', () => {
    render(<InputField label="Idade" error="Informe um número inteiro de 16 a 45." />)
    const input = screen.getByLabelText('Idade')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Informe um número inteiro de 16 a 45.')
  })

  it('describes a select with its hint', () => {
    render(
      <SelectField label="Clube" hint="Indisponível com Só livres.">
        <option value="">Todos</option>
      </SelectField>,
    )
    expect(screen.getByLabelText('Clube')).toHaveAccessibleDescription(
      'Indisponível com Só livres.',
    )
  })
})
