import { useSkillsStore } from '@/store/skills'
import type { IndexSkill } from '@/store/skills'
import { InlineRename } from './InlineRename'

interface SkillRowProps {
  skill: IndexSkill
  indented?: boolean
}

export function SkillRow({ skill, indented }: SkillRowProps) {
  const selectedSkillId = useSkillsStore(s => s.selectedSkillId)
  const selectSkill = useSkillsStore(s => s.selectSkill)
  const setDraggedSkill = useSkillsStore(s => s.setDraggedSkill)
  const renamingSkillId = useSkillsStore(s => s.renamingSkillId)
  const setRenamingSkill = useSkillsStore(s => s.setRenamingSkill)
  const renameSkill = useSkillsStore(s => s.renameSkill)

  const isActive = selectedSkillId === skill.id
  const isRenaming = renamingSkillId === skill.id
  const agentCount = skill.installedAgentIds.length
  const variant = skill.variants[0]
  const sourceLabel = variant?.ecosystem || variant?.kind || ''

  const handleDragStart = (e: React.DragEvent) => {
    const payload = JSON.stringify({ skillId: skill.id, variantPath: variant?.path || '' })
    // Set both types so it can be dropped on agents AND folders
    e.dataTransfer.setData('application/x-skill-assign', payload)
    e.dataTransfer.setData('application/x-skill-move', JSON.stringify({ skillPath: variant?.path || '' }))
    e.dataTransfer.effectAllowed = 'copyMove'
    setDraggedSkill({ id: skill.id, variantPath: variant?.path || '' })

    const ghost = document.createElement('div')
    ghost.textContent = skill.name
    ghost.className = 'sk-drag-ghost'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 0, 0)
    requestAnimationFrame(() => ghost.remove())
  }

  const handleDragEnd = () => {
    setDraggedSkill(null)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRenamingSkill(skill.id)
  }

  const handleRename = async (newName: string) => {
    if (variant?.path) {
      try {
        await renameSkill(variant.path, newName)
      } catch (err) {
        console.error('Rename failed:', err)
      }
    }
    setRenamingSkill(null)
  }

  const handleCancelRename = () => {
    setRenamingSkill(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'F2' && isActive && !isRenaming) {
      e.preventDefault()
      setRenamingSkill(skill.id)
    }
  }

  return (
    <div
      className={`sk-row${isActive ? ' active' : ''}${indented ? ' indented' : ''}`}
      onClick={() => selectSkill(skill.id)}
      onKeyDown={handleKeyDown}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      tabIndex={0}
    >
      <span className="sk-row-grip">{'\u2807'}</span>
      <div className="sk-row-main">
        {isRenaming ? (
          <InlineRename
            initialValue={skill.name}
            onCommit={handleRename}
            onCancel={handleCancelRename}
          />
        ) : (
          <span className="sk-row-name" onDoubleClick={handleDoubleClick}>{skill.name}</span>
        )}
        <span className="sk-row-summary">{skill.summary}</span>
      </div>
      <div className="sk-row-badges">
        {!skill.isInMaster && (
          <span className="sk-row-badge-unsynced" title="Not in master" />
        )}
        {variant?.kind === 'linked' && (
          <span className="sk-row-badge-repo">repo</span>
        )}
        {sourceLabel && (
          <span className="sk-row-source">{sourceLabel}</span>
        )}
        {agentCount > 0 && (
          <span className="sk-row-agents" title={`Installed on ${agentCount} agent(s)`}>
            {agentCount}
          </span>
        )}
      </div>
    </div>
  )
}
