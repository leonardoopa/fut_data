const LEADER_POSITION = 1

export function Abbreviation({ short, full }: { short: string; full: string }) {
  return (
    <>
      <abbr title={full} aria-hidden="true">
        {short}
      </abbr>
      <span className="visually-hidden">{full}</span>
    </>
  )
}

export function StandingPosition({ position }: { position: number }) {
  return (
    <span
      className={
        position === LEADER_POSITION
          ? 'standing-position standing-position--leader'
          : 'standing-position'
      }
    >
      {position}
    </span>
  )
}
