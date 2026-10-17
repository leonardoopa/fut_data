import { lowerFirst } from '../format/names'
import { Menu } from './Menu'
import { Popover } from './Popover'

interface SortMenuProps<Sort extends string> {
  options: readonly Sort[]
  labels: Record<Sort, string>
  value: Sort
  onChange: (sort: Sort) => void
}

export function SortMenu<Sort extends string>({
  options,
  labels,
  value,
  onChange,
}: SortMenuProps<Sort>) {
  return (
    <Popover variant="select" icon="sort" label={`Ordenar: ${lowerFirst(labels[value])}`}>
      {(close) => (
        <Menu
          label="Ordenar por"
          heading="Ordenar por"
          onClose={close}
          items={options.map((option) => ({
            key: option,
            label: labels[option],
            checked: option === value,
            onSelect: () => onChange(option),
          }))}
        />
      )}
    </Popover>
  )
}
