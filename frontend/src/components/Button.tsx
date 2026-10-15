import type { ComponentProps, MouseEvent } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'md' | 'sm'

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  isPending?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  isPending,
  disabled,
  type = 'button',
  className,
  onClick,
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
    />
  )
}
