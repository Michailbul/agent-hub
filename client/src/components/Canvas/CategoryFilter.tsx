interface CategoryFilterProps {
  tags: string[]
  activeTags: Set<string>
  onToggle: (tag: string) => void
  onClear: () => void
}

export function CategoryFilter({ tags, activeTags, onToggle, onClear }: CategoryFilterProps) {
  if (tags.length <= 1) return null

  return (
    <div className="cv-tag-bar">
      {tags.map(tag => (
        <button
          key={tag}
          className={`cv-tag-pill${activeTags.has(tag) ? ' active' : ''}`}
          onClick={() => onToggle(tag)}
        >
          {tag}
        </button>
      ))}
      {activeTags.size > 0 && (
        <button className="cv-tag-clear" onClick={onClear}>
          Clear
        </button>
      )}
    </div>
  )
}
