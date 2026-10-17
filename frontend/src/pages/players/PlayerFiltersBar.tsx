import { zodResolver } from '@hookform/resolvers/zod'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { CONDITIONS, POSITIONS, type Club } from '../../api/types'
import { Button } from '../../components/Button'
import { InputField } from '../../components/FormField'
import { Icon, type IconName } from '../../components/Icon'
import { Menu } from '../../components/Menu'
import { Popover } from '../../components/Popover'
import { Tooltip } from '../../components/Tooltip'
import { CONDITION_LABELS, POSITION_LABELS } from '../../format/labels'
import { formatMoney } from '../../format/money'
import type { ListFilters, PlayerList } from '../../hooks/usePlayers'
import {
  ageRangeSchema,
  playerSearchSchema,
  valueRangeSchema,
  type NumberRange,
  type RangeFormValues,
} from './playerSchemas'

const SEARCH_DELAY_MS = 400
const CLUB_WITH_FREE_REASON = '"Livres" não combina com o filtro por clube.'

interface FilterChip {
  key: string
  label: string
  clear: Partial<ListFilters>
}

function describeRange(range: NumberRange, format: (value: number) => string): string {
  if (range.min !== undefined && range.max !== undefined) {
    return `${format(range.min)} a ${format(range.max)}`
  }
  return range.min !== undefined
    ? `a partir de ${format(range.min)}`
    : `até ${format(range.max ?? 0)}`
}

function hasRange(range: NumberRange): boolean {
  return range.min !== undefined || range.max !== undefined
}

function describeFilters(filters: ListFilters, clubs: Club[] | undefined): FilterChip[] {
  const age = { min: filters.min_age, max: filters.max_age }
  const value = { min: filters.min_value, max: filters.max_value }
  const club = clubs?.find((candidate) => candidate.id === filters.club_id)
  const chips: (FilterChip | false | undefined)[] = [
    filters.search !== undefined && {
      key: 'search',
      label: `Busca: ${filters.search}`,
      clear: { search: undefined },
    },
    filters.position && {
      key: 'position',
      label: `Posição: ${POSITION_LABELS[filters.position]}`,
      clear: { position: undefined },
    },
    filters.condition && {
      key: 'condition',
      label: `Condição: ${CONDITION_LABELS[filters.condition]}`,
      clear: { condition: undefined },
    },
    filters.club_id !== undefined && {
      key: 'club',
      label: `Clube: ${club?.name ?? filters.club_id}`,
      clear: { club_id: undefined },
    },
    hasRange(age) && {
      key: 'age',
      label: `Idade: ${describeRange(age, String)}`,
      clear: { min_age: undefined, max_age: undefined },
    },
    hasRange(value) && {
      key: 'value',
      label: `Valor de mercado: ${describeRange(value, formatMoney)}`,
      clear: { min_value: undefined, max_value: undefined },
    },
  ]
  return chips.filter((chip): chip is FilterChip => Boolean(chip))
}

function SearchField({
  value,
  onSearch,
}: {
  value: string | undefined
  onSearch: (search: string | undefined) => void
}) {
  const [draft, setDraft] = useState(value ?? '')
  const [appliedValue, setAppliedValue] = useState(value)
  if (value !== appliedValue) {
    setAppliedValue(value)
    setDraft(value ?? '')
  }

  const parsed = playerSearchSchema.safeParse(draft)
  const error = parsed.success ? undefined : parsed.error.issues[0]?.message
  const nextSearch = parsed.success ? parsed.data : undefined

  useEffect(() => {
    if (error || nextSearch === value) return
    const timer = window.setTimeout(() => onSearch(nextSearch), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [error, nextSearch, value, onSearch])

  return (
    <div className="filter-bar__search">
      <InputField
        label="Buscar por nome"
        hideLabel
        icon="search"
        type="search"
        placeholder="Buscar por nome"
        autoComplete="off"
        value={draft}
        error={error}
        onChange={(event) => setDraft(event.target.value)}
      />
    </div>
  )
}

interface OptionFilterProps<Value extends string> {
  label: string
  icon: IconName
  allLabel: string
  value: Value | undefined
  options: { value: Value; label: string }[]
  disabled?: boolean
  describedBy?: string
  onChange: (value: Value | undefined) => void
}

function OptionFilter<Value extends string>({
  label,
  icon,
  allLabel,
  value,
  options,
  disabled,
  describedBy,
  onChange,
}: OptionFilterProps<Value>) {
  const selected = options.find((option) => option.value === value)
  return (
    <Popover
      variant="chip"
      icon={icon}
      label={selected ? `${label}: ${selected.label}` : label}
      isActive={Boolean(selected)}
      disabled={disabled}
      describedBy={describedBy}
    >
      {(close) => (
        <Menu
          label={label}
          onClose={close}
          items={[
            {
              key: 'all',
              label: allLabel,
              checked: value === undefined,
              onSelect: () => onChange(undefined),
            },
            ...options.map((option) => ({
              key: option.value,
              label: option.label,
              checked: option.value === value,
              onSelect: () => onChange(option.value),
            })),
          ]}
        />
      )}
    </Popover>
  )
}

interface RangeFormProps {
  schema: z.ZodType<NumberRange, RangeFormValues>
  minLabel: string
  maxLabel: string
  inputMode: 'numeric' | 'decimal'
  range: NumberRange
  onApply: (range: NumberRange) => void
  onClose: () => void
}

function RangeForm({
  schema,
  minLabel,
  maxLabel,
  inputMode,
  range,
  onApply,
  onClose,
}: RangeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { min: range.min?.toString() ?? '', max: range.max?.toString() ?? '' },
  })

  function apply(nextRange: NumberRange) {
    onApply(nextRange)
    onClose()
  }

  return (
    <form className="range-form" noValidate onSubmit={handleSubmit(apply)}>
      <div className="range-form__fields">
        <InputField
          label={minLabel}
          inputMode={inputMode}
          error={errors.min?.message}
          {...register('min')}
        />
        <InputField
          label={maxLabel}
          inputMode={inputMode}
          error={errors.max?.message}
          {...register('max')}
        />
      </div>
      <Button type="submit" size="sm">
        Aplicar
      </Button>
    </form>
  )
}

interface RangeFilterProps extends Omit<RangeFormProps, 'onClose'> {
  label: string
  icon: IconName
  format: (value: number) => string
}

function RangeFilter({ label, icon, format, ...formProps }: RangeFilterProps) {
  const isActive = hasRange(formProps.range)
  return (
    <Popover
      variant="chip"
      icon={icon}
      label={isActive ? `${label}: ${describeRange(formProps.range, format)}` : label}
      isActive={isActive}
    >
      {(close) => <RangeForm {...formProps} onClose={close} />}
    </Popover>
  )
}

interface PlayerFiltersBarProps {
  players: PlayerList
  clubs: Club[] | undefined
}

export function PlayerFiltersBar({ players, clubs }: PlayerFiltersBarProps) {
  const { filters, setFilters } = players
  const clubBlockedReason = players.status === 'free' ? CLUB_WITH_FREE_REASON : undefined
  const chips = describeFilters(filters, clubs)
  const applySearch = useCallback(
    (search: string | undefined) => setFilters({ search }),
    [setFilters],
  )

  return (
    <>
      <div className="filter-bar" role="search" aria-label="Filtros de jogadores">
        <SearchField value={filters.search} onSearch={applySearch} />
        <OptionFilter
          label="Posição"
          icon="shirt"
          allLabel="Todas as posições"
          value={filters.position}
          options={POSITIONS.map((position) => ({
            value: position,
            label: POSITION_LABELS[position],
          }))}
          onChange={(position) => setFilters({ position })}
        />
        <OptionFilter
          label="Condição"
          icon="heartPulse"
          allLabel="Todas as condições"
          value={filters.condition}
          options={CONDITIONS.map((condition) => ({
            value: condition,
            label: CONDITION_LABELS[condition],
          }))}
          onChange={(condition) => setFilters({ condition })}
        />
        <Tooltip text={clubBlockedReason}>
          {(tooltipId) => (
            <OptionFilter
              label="Clube"
              icon="shield"
              allLabel="Todos os clubes"
              value={filters.club_id === undefined ? undefined : String(filters.club_id)}
              options={(clubs ?? []).map((club) => ({ value: String(club.id), label: club.name }))}
              disabled={Boolean(clubBlockedReason)}
              describedBy={tooltipId}
              onChange={(clubId) => setFilters({ club_id: clubId ? Number(clubId) : undefined })}
            />
          )}
        </Tooltip>
        <RangeFilter
          label="Idade"
          icon="user"
          schema={ageRangeSchema}
          minLabel="Idade mínima"
          maxLabel="Idade máxima"
          inputMode="numeric"
          format={String}
          range={{ min: filters.min_age, max: filters.max_age }}
          onApply={({ min, max }) => setFilters({ min_age: min, max_age: max })}
        />
        <RangeFilter
          label="Valor de mercado"
          icon="coins"
          schema={valueRangeSchema}
          minLabel="Valor de mercado mínimo"
          maxLabel="Valor de mercado máximo"
          inputMode="decimal"
          format={formatMoney}
          range={{ min: filters.min_value, max: filters.max_value }}
          onApply={({ min, max }) => setFilters({ min_value: min, max_value: max })}
        />
      </div>

      {chips.length > 0 && (
        <div className="active-filters">
          <span className="active-filters__label">Filtros ativos:</span>
          <ul className="active-filters__list">
            {chips.map((chip) => (
              <li key={chip.key} className="filter-chip">
                {chip.label}
                <button
                  type="button"
                  className="filter-chip__remove"
                  aria-label={`Remover filtro ${chip.label}`}
                  onClick={() => setFilters(chip.clear)}
                >
                  <Icon name="x" size={12} />
                </button>
              </li>
            ))}
          </ul>
          <Button variant="link" size="sm" onClick={players.reset}>
            Limpar filtros
          </Button>
        </div>
      )}
    </>
  )
}
