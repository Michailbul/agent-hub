import { useCallback } from 'react'
import type { PaletteSkill } from '@/types/canvas'

interface SkillPaletteRowProps {
  skill: PaletteSkill
  onAssign?: () => void
  onPreview?: () => void
}

export function SkillPaletteRow({ skill, onAssign, onPreview }: SkillPaletteRowProps) {
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

  return (
    <div
      className="cv-palette-row"
      draggable
      onDragStart={handleDragStart}
    >
      <span className={`cv-palette-dot${skill.installedAgentIds.length > 0 ? ' active' : ''}`} />
      <span className="cv-palette-grip">&#x2801;&#x2801;</span>
      <div className="cv-palette-row-body">
        <div className="cv-palette-row-main">
          <span
            className="cv-palette-row-name cv-palette-row-name-link"
            onClick={onPreview}
            title="Preview skill"
          >
            {skill.name}
          </span>
          <span className="cv-palette-row-dept">{skill.department}</span>
        </div>
        {skill.summary && (
          <div className="cv-palette-row-summary">{skill.summary}</div>
        )}
        <div className="cv-palette-row-footer">
          {skill.installedAgentIds.length > 0 && (
            <span className="cv-palette-row-installed">
              installed on {skill.installedAgentIds.length} agent{skill.installedAgentIds.length !== 1 ? 's' : ''}
            </span>
          )}
          {onAssign && (
            <button
              className="cv-btn-assign"
              onClick={(e) => { e.stopPropagation(); onAssign() }}
              title="Add to selected agent"
            >
              + Add
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
