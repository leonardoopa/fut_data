import { useId, type ComponentProps, type ReactNode } from 'react'

interface FieldTextProps {
  label: string
  hint?: string
  error?: string
}

interface FormFieldProps extends FieldTextProps {
  id: string
  children: ReactNode
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
  const ids = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean)
  return ids.length > 0 ? ids.join(' ') : undefined
}

function FieldMessages({ id, hint, error }: Omit<FormFieldProps, 'label' | 'children'>) {
  return (
    <>
      {hint && (
        <p id={`${id}-hint`} className="form-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="form-field__error">
          {error}
        </p>
      )}
    </>
  )
}

export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  return (
    <div className={error ? 'form-field form-field--invalid' : 'form-field'}>
      <label htmlFor={id} className="form-field__label">
        {label}
      </label>
      {children}
      <FieldMessages id={id} hint={hint} error={error} />
    </div>
  )
}

function useFieldId(id: string | undefined): string {
  const generatedId = useId()
  return id ?? generatedId
}

type InputFieldProps = FieldTextProps & ComponentProps<'input'>

export function InputField({ label, hint, error, id, ...inputProps }: InputFieldProps) {
  const fieldId = useFieldId(id)
  return (
    <FormField id={fieldId} label={label} hint={hint} error={error}>
      <input
        id={fieldId}
        className="form-field__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        {...inputProps}
      />
    </FormField>
  )
}

type SelectFieldProps = FieldTextProps & ComponentProps<'select'>

export function SelectField({
  label,
  hint,
  error,
  id,
  children,
  ...selectProps
}: SelectFieldProps) {
  const fieldId = useFieldId(id)
  return (
    <FormField id={fieldId} label={label} hint={hint} error={error}>
      <select
        id={fieldId}
        className="form-field__control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, hint, error)}
        {...selectProps}
      >
        {children}
      </select>
    </FormField>
  )
}

type CheckboxFieldProps = FieldTextProps & Omit<ComponentProps<'input'>, 'type'>

export function CheckboxField({ label, hint, error, id, ...inputProps }: CheckboxFieldProps) {
  const fieldId = useFieldId(id)
  return (
    <div className="form-field form-field--checkbox">
      <label htmlFor={fieldId} className="form-field__checkbox">
        <input
          id={fieldId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, hint, error)}
          {...inputProps}
        />
        {label}
      </label>
      <FieldMessages id={fieldId} hint={hint} error={error} />
    </div>
  )
}
