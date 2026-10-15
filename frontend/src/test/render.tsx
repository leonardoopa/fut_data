import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { NotificationsProvider } from '../components/NotificationsProvider'

export function renderWithProviders(ui: ReactElement) {
  return render(<NotificationsProvider>{ui}</NotificationsProvider>)
}
