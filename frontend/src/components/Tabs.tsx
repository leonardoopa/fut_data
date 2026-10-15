import { useId, useState, type ReactNode } from 'react'

export interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  label: string
  tabs: Tab[]
}

export function Tabs({ label, tabs }: TabsProps) {
  const baseId = useId()
  const [activeId, setActiveId] = useState(tabs[0].id)
  const activeTab = tabs.find((tab) => tab.id === activeId) ?? tabs[0]
  const tabId = (tab: Tab) => `${baseId}-${tab.id}-tab`
  const panelId = (tab: Tab) => `${baseId}-${tab.id}-panel`

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
            onClick={() => setActiveId(tab.id)}
          >
            {tab.label}
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
