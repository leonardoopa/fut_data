import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconName } from './Icon'

const GAP = 6
const PANEL_ROOM = 320

interface PanelPosition {
  top?: number
  bottom?: number
  left?: number
  right?: number
}

function positionFor(rect: DOMRect): PanelPosition {
  const opensUp = rect.bottom + PANEL_ROOM > window.innerHeight && rect.top > PANEL_ROOM
  const alignsEnd = rect.left > window.innerWidth / 2
  return {
    top: opensUp ? undefined : rect.bottom + GAP,
    bottom: opensUp ? window.innerHeight - rect.top + GAP : undefined,
    left: alignsEnd ? undefined : rect.left,
    right: alignsEnd ? window.innerWidth - rect.right : undefined,
  }
}

interface PopoverProps {
  label: ReactNode
  ariaLabel?: string
  icon?: IconName
  variant: 'chip' | 'icon' | 'select'
  isActive?: boolean
  disabled?: boolean
  describedBy?: string
  children: (close: () => void) => ReactNode
}

export function Popover({
  label,
  ariaLabel,
  icon,
  variant,
  isActive,
  disabled,
  describedBy,
  children,
}: PopoverProps) {
  const panelId = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<PanelPosition>()

  const isOpen = position !== undefined
  const close = useCallback(() => setPosition(undefined), [])

  useEffect(() => {
    if (!isOpen) return
    panelRef.current
      ?.querySelector<HTMLElement>('[role^="menuitem"]:not([disabled]), input, select, button')
      ?.focus()

    function isInside(target: EventTarget | null) {
      return (
        target instanceof Node &&
        (panelRef.current?.contains(target) || buttonRef.current?.contains(target))
      )
    }
    function closeOnOutsidePress(event: MouseEvent) {
      if (!isInside(event.target)) close()
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close()
    }
    function followButton() {
      const rect = buttonRef.current?.getBoundingClientRect()
      if (rect) setPosition(positionFor(rect))
    }
    document.addEventListener('mousedown', closeOnOutsidePress)
    document.addEventListener('keydown', closeOnEscape, true)
    window.addEventListener('scroll', followButton, true)
    window.addEventListener('resize', followButton)
    const button = buttonRef.current
    return () => {
      if (document.activeElement === document.body) button?.focus()
      document.removeEventListener('mousedown', closeOnOutsidePress)
      document.removeEventListener('keydown', closeOnEscape, true)
      window.removeEventListener('scroll', followButton, true)
      window.removeEventListener('resize', followButton)
    }
  }, [isOpen, close])

  function toggle() {
    const rect = buttonRef.current?.getBoundingClientRect()
    setPosition(position || !rect ? undefined : positionFor(rect))
  }

  const classes = ['popover-trigger', `popover-trigger--${variant}`, isActive && 'is-active']
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={classes}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={toggle}
      >
        {icon && <Icon name={icon} />}
        {label}
        {variant !== 'icon' && <Icon name="chevronDown" className="popover-trigger__chevron" />}
      </button>
      {position &&
        createPortal(
          <div ref={panelRef} id={panelId} className="popover" style={position}>
            {children(close)}
          </div>,
          document.body,
        )}
    </>
  )
}
