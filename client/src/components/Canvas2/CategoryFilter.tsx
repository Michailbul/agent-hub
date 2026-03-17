import { Button } from '@/components/ui/button'

interface CategoryFilterProps {
  tags: string[]
  activeTags: Set<string>
  onToggle: (tag: string) => void
  onClear: () => void
}

export function CategoryFilter({ tags, activeTags, onToggle, onClear }: CategoryFilterProps) {
  if (tags.length <= 1) return null

  return (
    <div className="flex flex-wrap gap-1 px-3 py-2">
      {tags.map(tag => (
        <Button
          key={tag}
          variant={activeTags.has(tag) ? 'secondary' : 'outline'}
          size="xs"
          className="text-[10px] h-5 px-2"
          onClick={() => onToggle(tag)}
        >
          {tag}
        </Button>
      ))}
      {activeTags.size > 0 && (
        <Button
          variant="ghost"
          size="xs"
          className="text-[10px] h-5 px-1.5 text-muted-foreground"
          onClick={onClear}
        >
          Clear
        </Button>
      )}
    </div>
  )
}
