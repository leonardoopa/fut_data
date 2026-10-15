import type { ComponentProps } from 'react'

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
  isPending = false,
  disabled,
  type = 'button',
  className,
  ...buttonProps
}: ButtonProps) {
  const classes = ['button', `button--${variant}`, `button--${size}`, className]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isPending}
      aria-busy={isPending || undefined}
      {...buttonProps}
    />
  )
}
