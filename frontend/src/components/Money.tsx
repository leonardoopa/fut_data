import { formatSignedMoney } from '../format/money'

function toneOf(value: number | null): string {
  if (value === null || value === 0) return 'money'
  return value > 0 ? 'money money--positive' : 'money money--negative'
}

export function SignedMoney({ value }: { value: number | null }) {
  return <span className={toneOf(value)}>{formatSignedMoney(value)}</span>
}
