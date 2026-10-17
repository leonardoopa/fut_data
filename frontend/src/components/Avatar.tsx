import type { ReactNode } from 'react'
import { initialsOf } from '../format/names'

const AVATAR_TONES = 6

function toneOf(name: string): number {
  const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0)
  return hash % AVATAR_TONES
}

interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  return (
    <span className={`avatar avatar--${size} avatar--tone-${toneOf(name)}`} aria-hidden="true">
      {initialsOf(name)}
    </span>
  )
}

interface ClubBadgeProps {
  acronym: string
  size?: 'sm' | 'md' | 'lg'
}

export function ClubBadge({ acronym, size = 'sm' }: ClubBadgeProps) {
  return <span className={`club-badge club-badge--${size}`}>{acronym}</span>
}

interface IdentityProps {
  visual: ReactNode
  title: ReactNode
  subtitle?: ReactNode
}

export function Identity({ visual, title, subtitle }: IdentityProps) {
  return (
    <span className="identity">
      {visual}
      <span className="identity__text">
        <span className="identity__title">{title}</span>
        {subtitle && <span className="identity__subtitle">{subtitle}</span>}
      </span>
    </span>
  )
}
