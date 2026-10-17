import { useId, type KeyboardEvent } from 'react'
import { Icon, type IconName } from './Icon'

export interface MenuItem {
  key: string
  label: string
  icon?: IconName
  description?: string
  disabled?: boolean
  checked?: boolean
  tone?: 'danger'
  onSelect: () => void
}

interface MenuProps {
  label: string
  heading?: string
  items: MenuItem[]
  onClose: () => void
}

const NAVIGATION_KEYS: Record<string, number> = { ArrowDown: 1, ArrowUp: -1 }

function moveFocus(event: KeyboardEvent<HTMLDivElement>) {
  const step = NAVIGATION_KEYS[event.key]
  if (!step) return
  event.preventDefault()
  const items = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]:not(:disabled)'),
  ]
  const current = items.findIndex((item) => item === document.activeElement)
  items[(current + step + items.length) % items.length]?.focus()
}

export function Menu({ label, heading, items, onClose }: MenuProps) {
  const baseId = useId()

  return (
    <div className="menu" role="menu" aria-label={label} onKeyDown={moveFocus}>
      {heading && (
        <p className="menu__heading" role="presentation">
          {heading}
        </p>
      )}
      {items.map((item) => {
        const descriptionId = `${baseId}-${item.key}`
        return (
          <button
            key={item.key}
            type="button"
            role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
            aria-checked={item.checked}
            aria-label={item.label}
            aria-describedby={item.description ? descriptionId : undefined}
            className={item.tone ? `menu__item menu__item--${item.tone}` : 'menu__item'}
            disabled={item.disabled}
            onClick={() => {
              onClose()
              item.onSelect()
            }}
          >
            <span className="menu__icon">
              {item.checked ? <Icon name="check" /> : item.icon && <Icon name={item.icon} />}
            </span>
            <span className="menu__text">
              {item.label}
              {item.description && (
                <span id={descriptionId} className="menu__description">
                  {item.description}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
