import { useSkillsStore } from '@/store/skills'
import type { IndexSkill, IndexFolder } from '@/store/skills'
import { SkillRow } from './SkillRow'

interface SkillFolderProps {
  folderName: string
  skills: IndexSkill[]
  folder?: IndexFolder
}

export function SkillFolder({ folderName, skills, folder }: SkillFolderProps) {
  const expandedFolders = useSkillsStore(s => s.expandedFolders)
  const toggleFolder = useSkillsStore(s => s.toggleFolder)
  const draggedSkill = useSkillsStore(s => s.draggedSkill)
  const dropTargetFolder = useSkillsStore(s => s.dropTargetFolder)
  const setDropTargetFolder = useSkillsStore(s => s.setDropTargetFolder)
  const moveSkillToFolder = useSkillsStore(s => s.moveSkillToFolder)

  const isExpanded = expandedFolders.has(folderName)
  const isDropTarget = dropTargetFolder === folderName

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-skill-move')) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'move'
      setDropTargetFolder(folderName)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the folder header, not entering a child
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const { clientX, clientY } = e
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDropTargetFolder(null)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDropTargetFolder(null)
    if (!folder?.root) return
    try {
      const raw = e.dataTransfer.getData('application/x-skill-move')
      if (!raw) return
      const data = JSON.parse(raw)
      await moveSkillToFolder(data.skillPath, folder.root)
    } catch (err) {
      console.error('Move to folder failed:', err)
    }
  }

  return (
    <div className="sk-folder-section">
      <button
        className={`sk-folder-header${isDropTarget ? ' drop-hover' : ''}${draggedSkill ? ' drag-active' : ''}`}
        onClick={() => toggleFolder(folderName)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <span className="sk-folder-icon">{isExpanded ? '\uD83D\uDCC2' : '\uD83D\uDCC1'}</span>
        <span className="sk-folder-name">{folderName}</span>
        <span className="sk-folder-count">{skills.length}</span>
        <span className={`sk-folder-chevron${isExpanded ? '' : ' collapsed'}`}>{'\u25BE'}</span>
      </button>
      {isExpanded && (
        <div className="sk-folder-children">
          {skills.map(skill => (
            <SkillRow key={skill.id} skill={skill} indented />
          ))}
        </div>
      )}
    </div>
  )
}
