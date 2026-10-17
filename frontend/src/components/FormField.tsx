import { useId, type ComponentProps, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

interface FieldTextProps {
  label: string
  hint?: ReactNode
  error?: string
  hideLabel?: boolean
}

function describedBy(id: string, hint?: ReactNode, error?: string): string | undefined {
  if (error) return `${id}-error`
  return hint ? `${id}-hint` : undefined
}

function FieldMessage({ id, hint, error }: { id: string; hint?: ReactNode; error?: string }) {
  if (error) {
    return (
      <p id={`${id}-error`} className="form-field__error">
        <Icon name="alertCircle" size={12} />
        {error}
      </p>
    )
  }
  return hint ? (
    <p id={`${id}-hint`} className="form-field__hint">
      {hint}
    </p>
  ) : null
}

function useFieldId(id: string | undefined): string {
  const generatedId = useId()
  return id ?? generatedId
}

function fieldClass(error: string | undefined, extra?: string): string {
  return ['form-field', error && 'form-field--invalid', extra].filter(Boolean).join(' ')
}

function FieldLabel({ id, label, hidden }: { id: string; label: string; hidden?: boolean }) {
  return (
    <label htmlFor={id} className={hidden ? 'visually-hidden' : 'form-field__label'}>
      {label}
    </label>
  )
}

function ControlFrame({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return (
    <span className={icon ? 'form-field__frame form-field__frame--icon' : 'form-field__frame'}>
      {icon && <Icon name={icon} className="form-field__icon" />}
      {children}
    </span>
  )
}

type InputFieldProps = FieldTextProps & ComponentProps<'input'> & { icon?: IconName }

export function InputField({
  label,
  hint,
  error,
  hideLabel,
  icon,
  id,
  ...inputProps
}: InputFieldProps) {
  const fieldId = useFieldId(id)
  return (
    <div className={fieldClass(error)}>
      <FieldLabel id={fieldId} label={label} hidden={hideLabel} />
      <ControlFrame icon={icon}>
        <input
          id={fieldId}
          className="form-field__control"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, hint, error)}
          {...inputProps}
        />
      </ControlFrame>
      <FieldMessage id={fieldId} hint={hint} error={error} />
    </div>
  )
}

type SelectFieldProps = FieldTextProps & ComponentProps<'select'> & { icon?: IconName }

export function SelectField({
  label,
  hint,
  error,
  hideLabel,
  icon,
  id,
  children,
  ...selectProps
}: SelectFieldProps) {
  const fieldId = useFieldId(id)
  return (
    <div className={fieldClass(error)}>
      <FieldLabel id={fieldId} label={label} hidden={hideLabel} />
      <ControlFrame icon={icon}>
        <select
          id={fieldId}
          className="form-field__control form-field__control--select"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, hint, error)}
          {...selectProps}
        >
          {children}
        </select>
        <Icon name="chevronDown" className="form-field__chevron" />
      </ControlFrame>
      <FieldMessage id={fieldId} hint={hint} error={error} />
    </div>
  )
}

type CheckboxChipProps = { label: string } & Omit<ComponentProps<'input'>, 'type'>

export function CheckboxChip({ label, id, ...inputProps }: CheckboxChipProps) {
  const fieldId = useFieldId(id)
  return (
    <label htmlFor={fieldId} className="checkbox-chip">
      <input id={fieldId} type="checkbox" {...inputProps} />
      <span className="checkbox-chip__box" aria-hidden="true">
        <Icon name="check" size={12} />
      </span>
      {label}
    </label>
  )
}

export interface ChoiceOption {
  value: string
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}

interface ChoiceFieldProps extends FieldTextProps {
  name: string
  options: ChoiceOption[]
  value: string
  layout: 'segmented' | 'cards' | 'tiles'
  onChange: (value: string) => void
  onBlur?: () => void
}

export function ChoiceField({
  label,
  hint,
  error,
  hideLabel,
  name,
  options,
  value,
  layout,
  onChange,
  onBlur,
}: ChoiceFieldProps) {
  const fieldId = useFieldId(undefined)
  return (
    <div className={fieldClass(error)}>
      <p id={`${fieldId}-label`} className={hideLabel ? 'visually-hidden' : 'form-field__label'}>
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={`${fieldId}-label`}
        aria-describedby={describedBy(fieldId, hint, error)}
        aria-invalid={error ? true : undefined}
        className={`choices choices--${layout}`}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={option.disabled ? 'choice choice--disabled' : 'choice'}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              disabled={option.disabled}
              onChange={() => onChange(option.value)}
              onBlur={onBlur}
            />
            <span className="choice__label">{option.label}</span>
            {option.description && (
              <span className="choice__description">{option.description}</span>
            )}
          </label>
        ))}
      </div>
      <FieldMessage id={fieldId} hint={hint} error={error} />
    </div>
  )
}

export function ReadOnlyField({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  const fieldId = useFieldId(undefined)
  return (
    <div className="form-field">
      <FieldLabel id={fieldId} label={label} />
      <ControlFrame icon="lock">
        <input
          id={fieldId}
          className="form-field__control"
          value={value}
          readOnly
          disabled
          aria-describedby={hint ? `${fieldId}-hint` : undefined}
        />
      </ControlFrame>
      <FieldMessage id={fieldId} hint={hint} />
    </div>
  )
}
