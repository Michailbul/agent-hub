interface CategoryFilterProps {
  tags: string[]
  activeTags: Set<string>
  onSelect: (tag: string) => void
  onAdd: (tag: string) => void
  onRemove: (tag: string) => void
  onClear: () => void
}

export function CategoryFilter({ tags, activeTags, onSelect, onAdd, onRemove, onClear }: CategoryFilterProps) {
  if (tags.length <= 1) return null

  return (
    <>
      {activeTags.size > 0 && (
        <div className="cv-tag-active-bar">
          {[...activeTags].map(tag => (
            <span key={tag} className="cv-tag-chip">
              <button
                className="cv-tag-chip-label"
                onClick={() => onSelect(tag)}
                title={`Show only ${tag}`}
              >
                {tag}
              </button>
              <button
                className="cv-tag-chip-remove"
                onClick={() => onRemove(tag)}
                title={`Remove ${tag} filter`}
                aria-label={`Remove ${tag} filter`}
              >
                ×
              </button>
            </span>
          ))}
          <button className="cv-tag-clear" onClick={onClear}>
            Clear all
          </button>
        </div>
      )}
      <div className="cv-tag-bar">
        {tags.map(tag => {
          const isActive = activeTags.has(tag)
          return (
            <div key={tag} className={`cv-tag-pill${isActive ? ' active' : ''}`}>
              <button
                className="cv-tag-pill-side"
                onClick={() => onAdd(tag)}
                title={isActive ? `${tag} is already included` : `Add ${tag} to filters`}
                aria-label={isActive ? `${tag} already included` : `Add ${tag} to filters`}
              >
                {isActive ? '✓' : '+'}
              </button>
              <button
                className="cv-tag-pill-main"
                onClick={() => onSelect(tag)}
                title={`Show only ${tag}`}
                aria-label={`Show only ${tag}`}
              >
                {tag}
              </button>
              <button
                className="cv-tag-pill-side"
                onClick={() => onRemove(tag)}
                title={`Remove ${tag} from filters`}
                aria-label={`Remove ${tag} from filters`}
                disabled={!isActive}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}
