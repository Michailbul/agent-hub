import { useUIStore } from '@/store/ui'
import type { FilterSource } from '@/types'

const FILTERS: { src: FilterSource; label: string }[] = [
  { src: 'all', label: 'All' },
  { src: 'studio', label: '\uD83C\uDFE0 Studio' },
  { src: 'community', label: '\uD83C\uDF10 Community' },
  { src: 'openclaw', label: '\u2699 System' },
]

export function FilterBar() {
  const filter = useUIStore(s => s.filter)
  const setFilter = useUIStore(s => s.setFilter)

  return (
    <div className="filter-bar">
      {FILTERS.map(f => (
        <button
          key={f.src}
          className={`flt${filter === f.src ? ' on' : ''}`}
          data-src={f.src}
          onClick={() => setFilter(f.src)}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
