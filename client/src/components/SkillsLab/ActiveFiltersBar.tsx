type FilterChip = {
  key: string
  label: string
  onRemove: () => void
}

type ActiveFiltersBarProps = {
  chips: FilterChip[]
  onClearAll: () => void
}

export function ActiveFiltersBar({ chips, onClearAll }: ActiveFiltersBarProps) {
  if (chips.length === 0) return null

  return (
    <div className="kl-active-filters">
      {chips.map(chip => (
        <span key={chip.key} className="kl-active-filter-chip">
          {chip.label}
          <button
            className="kl-active-filter-x"
            onClick={e => {
              e.stopPropagation()
              chip.onRemove()
            }}
            title={`Remove ${chip.label}`}
          >
            &times;
          </button>
        </span>
      ))}
      <button
        className="kl-active-filter-clear"
        onClick={e => {
          e.stopPropagation()
          onClearAll()
        }}
      >
        Clear all
      </button>
    </div>
  )
}
