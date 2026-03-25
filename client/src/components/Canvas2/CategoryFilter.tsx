import { Button } from '@/components/ui/button'

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
    <div className="px-3 py-2 space-y-2">
      {activeTags.size > 0 && (
        <div className="flex flex-wrap gap-1">
          {[...activeTags].map(tag => (
            <div
              key={tag}
              className="inline-flex items-center rounded-md border border-border bg-secondary/60"
            >
              <Button
                variant="ghost"
                size="xs"
                className="h-5 rounded-r-none px-2 text-[10px]"
                onClick={() => onSelect(tag)}
              >
                {tag}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-5 w-5 rounded-l-none border-l border-border text-muted-foreground hover:text-foreground"
                onClick={() => onRemove(tag)}
                aria-label={`Remove ${tag} filter`}
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="xs"
            className="text-[10px] h-5 px-1.5 text-muted-foreground"
            onClick={onClear}
          >
            Clear all
          </Button>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => {
          const isActive = activeTags.has(tag)
          return (
            <div
              key={tag}
              className={`inline-flex items-center rounded-md border ${
                isActive ? 'border-foreground/30 bg-secondary' : 'border-border bg-background'
              }`}
            >
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6 rounded-r-none border-r border-border text-[10px]"
                onClick={() => onAdd(tag)}
                aria-label={isActive ? `${tag} already included` : `Add ${tag} to filters`}
              >
                {isActive ? '✓' : '+'}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="h-6 rounded-none px-2 text-[10px]"
                onClick={() => onSelect(tag)}
              >
                {tag}
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6 rounded-l-none border-l border-border text-[10px]"
                onClick={() => onRemove(tag)}
                disabled={!isActive}
                aria-label={`Remove ${tag} from filters`}
              >
                ×
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
