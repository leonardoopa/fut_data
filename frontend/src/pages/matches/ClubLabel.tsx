import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ClubBadge } from '../../components/Avatar'
import { useClubAcronym } from './matchSides'

interface ClubLabelProps {
  clubId: number
  children: ReactNode
  badgeSide?: 'start' | 'end'
  linkToClub?: boolean
}

export function ClubLabel({ clubId, children, badgeSide = 'start', linkToClub }: ClubLabelProps) {
  const acronym = useClubAcronym(clubId)
  const badge = acronym && <ClubBadge acronym={acronym} />

  return (
    <span className="club-cell">
      {badgeSide === 'start' && badge}
      {linkToClub ? (
        <Link to={`/clubs/${clubId}`} className="table-link">
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      )}
      {badgeSide === 'end' && badge}
    </span>
  )
}
