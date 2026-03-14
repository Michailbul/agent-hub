import { useState } from 'react'
import { ChevronRight, Check } from 'lucide-react'

type FacetSection = {
  id: string
  label: string
  items: FacetItem[]
  activeValue: string | null
  onSelect: (value: string | null) => void
}

type FacetToggle = {
  id: string
  label: string
  active: boolean
  onToggle: () => void
}

type FacetItem = {
  value: string
  label: string
  count?: number
  emoji?: string
  color?: string
}

type FacetedFiltersProps = {
  sections: FacetSection[]
  toggles?: FacetToggle[]
}

export function FacetedFilters({ sections, toggles }: FacetedFiltersProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      {sections.map(section => {
        const isOpen = !collapsed.has(section.id)
        const activeCount = section.activeValue ? 1 : 0

        return (
          <div key={section.id} className="kl-facet-section">
            <button
              className="kl-facet-header"
              onClick={() => toggle(section.id)}
            >
              <span className="kl-facet-label">{section.label}</span>
              {activeCount > 0 && (
                <span className="kl-facet-active-count">{activeCount}</span>
              )}
              <ChevronRight
                size={12}
                strokeWidth={1.5}
                className={`kl-facet-chevron${isOpen ? ' open' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="kl-facet-body">
                {section.items.map(item => (
                  <button
                    key={item.value}
                    className={`kl-facet-item${section.activeValue === item.value ? ' active' : ''}`}
                    onClick={() =>
                      section.onSelect(
                        section.activeValue === item.value ? null : item.value,
                      )
                    }
                  >
                    {item.color && (
                      <span
                        className="kl-facet-item-dot"
                        style={{ background: item.color }}
                      />
                    )}
                    {item.emoji && (
                      <span className="kl-facet-item-emoji">{item.emoji}</span>
                    )}
                    <span className="kl-facet-item-label">{item.label}</span>
                    {item.count !== undefined && (
                      <span className="kl-facet-item-count">{item.count}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {toggles && toggles.length > 0 && (
        <div className="kl-facet-section">
          <div className="kl-facet-header" style={{ cursor: 'default' }}>
            <span className="kl-facet-label">Special</span>
          </div>
          <div className="kl-facet-body">
            {toggles.map(t => (
              <button
                key={t.id}
                className={`kl-facet-toggle${t.active ? ' active' : ''}`}
                onClick={t.onToggle}
              >
                <span className="kl-facet-toggle-check">
                  {t.active && <Check size={10} strokeWidth={2.5} />}
                </span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
