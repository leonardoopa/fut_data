import { within } from '@testing-library/react'

export function summaryValue(label: string, container: HTMLElement = document.body) {
  const term = within(container).getByText(label, { selector: 'dt' })
  return term.nextElementSibling?.textContent
}

export function rowOf(name: string) {
  const row = within(document.body).getByRole('cell', { name }).closest('tr')
  if (!row) throw new Error(`Linha de ${name} não encontrada.`)
  return within(row)
}
