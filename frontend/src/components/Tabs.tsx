import { useId, type ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export interface Tab<Id extends string> {
  id: Id
  label: string
  icon: IconName
  count?: number
  content: ReactNode
}

interface TabsProps<Id extends string> {
  label: string
  tabs: Tab<Id>[]
  activeId: Id
  onChange: (id: Id) => void
}

export function Tabs<Id extends string>({ label, tabs, activeId, onChange }: TabsProps<Id>) {
  const baseId = useId()
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0]
  const tabId = (tab: Tab<Id>) => `${baseId}-${tab.id}-tab`
  const panelId = (tab: Tab<Id>) => `${baseId}-${tab.id}-panel`

  return (
    <div className="tabs">
      <div className="tabs__list" role="tablist" aria-label={label}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={tabId(tab)}
            type="button"
            role="tab"
            className="tabs__tab"
            aria-selected={tab.id === activeTab.id}
            aria-controls={panelId(tab)}
            onClick={() => onChange(tab.id)}
          >
            <Icon name={tab.icon} />
            {tab.label}
            {tab.count !== undefined && (
              <>
                {' '}
                <span className="tabs__count">{tab.count}</span>
              </>
            )}
          </button>
        ))}
      </div>
      <div
        id={panelId(activeTab)}
        className="tabs__panel"
        role="tabpanel"
        aria-labelledby={tabId(activeTab)}
      >
        {activeTab.content}
      </div>
    </div>
  )
}
