import { within } from '@testing-library/react'

export function summaryValue(label: string, container: HTMLElement = document.body) {
  const term = within(container).getByText(label, { selector: 'dt' })
  return term.nextElementSibling?.textContent
}

export function rowOf(text: string, container: HTMLElement = document.body) {
  const row = within(container)
    .getAllByRole('row')
    .find((candidate) => within(candidate).queryByText(text) !== null)
  if (!row) throw new Error(`Row for ${text} not found.`)
  return within(row)
}
