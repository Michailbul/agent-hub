import { useCallback } from 'react'
import type { PaletteSkill } from '@/types/canvas'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface SkillPaletteRowProps {
  skill: PaletteSkill
  onAssign?: () => void
  onPreview?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export function SkillPaletteRow({ skill, onAssign, onPreview, onContextMenu }: SkillPaletteRowProps) {
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData(
      'application/x-canvas-skill',
      JSON.stringify({ skillId: skill.id, variantPath: skill.variantPath }),
    )
    e.dataTransfer.effectAllowed = 'copy'

    const ghost = document.createElement('div')
    ghost.textContent = skill.name
    ghost.className = 'cv-drag-ghost'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    requestAnimationFrame(() => ghost.remove())
  }, [skill])

  const handlePreview = useCallback(() => {
    onPreview?.()
  }, [onPreview])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!onPreview) return
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    onPreview()
  }, [onPreview])

  return (
    <div
      className={`group flex items-start gap-2 px-3 py-2 border-b border-border select-none transition-colors hover:bg-accent/50 ${
        onPreview ? 'cursor-pointer' : 'cursor-default'
      }`}
      draggable
      onDragStart={handleDragStart}
      onClick={handlePreview}
      onKeyDown={handleKeyDown}
      onContextMenu={onContextMenu}
      role={onPreview ? 'button' : undefined}
      tabIndex={onPreview ? 0 : undefined}
    >
      {/* Status dot */}
      <span className={`w-1.5 h-1.5 mt-1.5 rounded-full shrink-0 ${
        skill.installedAgentIds.length > 0 ? 'bg-foreground' : 'bg-muted-foreground/30'
      }`} />

      {/* Drag grip */}
      <span className="text-[8px] text-muted-foreground/30 mt-[3px] group-hover:text-muted-foreground/60 transition-opacity shrink-0 cursor-grab active:cursor-grabbing">
        &#x2801;&#x2801;
      </span>

      {/* Content */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground group-hover:text-foreground transition-colors truncate">
            {skill.name}
          </span>
          <Badge variant="secondary" className="text-[9px] h-4 px-1.5 shrink-0">
            {skill.pillarName}
          </Badge>
        </div>
        {skill.summary && (
          <div className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
            {skill.summary}
          </div>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {skill.installedAgentIds.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              installed on {skill.installedAgentIds.length} agent{skill.installedAgentIds.length !== 1 ? 's' : ''}
            </span>
          )}
          {onAssign && (
            <Button
              variant="outline"
              size="xs"
              className="ml-auto text-[10px] h-5"
              onClick={(e) => { e.stopPropagation(); onAssign() }}
              onKeyDown={(e) => e.stopPropagation()}
            >
              + Add
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
