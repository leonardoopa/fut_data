import type { ComponentProps, MouseEvent } from 'react'
import { Icon, type IconName } from './Icon'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
type ButtonSize = 'md' | 'sm'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  trailingIcon?: IconName
  isPending?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  trailingIcon,
  isPending,
  disabled,
  type = 'button',
  className,
  onClick,
  children,
  ...buttonProps
}: ButtonProps) {
  const isActionButton = isPending !== undefined
  const classes = ['button', `button--${variant}`, `button--${size}`, className]
    .filter(Boolean)
    .join(' ')

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    const isRepeatedClick = event.detail > 1
    if (isActionButton && isRepeatedClick) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      onClick={handleClick}
      {...buttonProps}
    >
      {isPending ? (
        <span className="spinner" aria-hidden="true" />
      ) : (
        icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />
      )}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={size === 'sm' ? 14 : 16} />}
    </button>
  )
}
