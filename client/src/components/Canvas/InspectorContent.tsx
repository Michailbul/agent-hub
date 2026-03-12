import { useEffect } from 'react'
import { useCanvasStore } from '@/store/canvas'

export function InspectorContent() {
  const inspectorActiveItem = useCanvasStore(s => s.inspectorActiveItem)
  const fileContent = useCanvasStore(s => s.inspectorFileContent)
  const fileLoading = useCanvasStore(s => s.inspectorFileLoading)
  const editContent = useCanvasStore(s => s.inspectorEditContent)
  const setEditContent = useCanvasStore(s => s.setInspectorEditContent)
  const fileDirty = useCanvasStore(s => s.inspectorFileDirty)
  const saveFile = useCanvasStore(s => s.saveInspectorFile)
  const cancelEditing = useCanvasStore(s => s.cancelEditing)
  const data = useCanvasStore(s => s.data)

  const canEdit = editContent !== null

  // Cmd+S to save
  useEffect(() => {
    if (!canEdit) return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        void saveFile()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [canEdit, saveFile])

  if (!inspectorActiveItem) {
    return (
      <div className="cv-inspector-content">
        <div className="cv-inspector-empty">Select a file to edit</div>
      </div>
    )
  }

  // Resolve display info
  let displayPath = ''
  let skillInfo: { name: string; department: string; summary: string } | null = null

  if (inspectorActiveItem.kind === 'file') {
    displayPath = inspectorActiveItem.path.split('/').pop() || inspectorActiveItem.path
  } else if (inspectorActiveItem.kind === 'skill') {
    const skill = data?.paletteSkills.find(s => s.id === inspectorActiveItem.skillId)
    if (skill) {
      skillInfo = { name: skill.name, department: skill.department, summary: skill.summary }
      displayPath = 'SKILL.md'
    }
  } else if (inspectorActiveItem.kind === 'skill-file') {
    const skill = data?.paletteSkills.find(s => s.id === inspectorActiveItem.skillId)
    if (skill) {
      skillInfo = { name: skill.name, department: skill.department, summary: '' }
    }
    displayPath = inspectorActiveItem.path.split('/').pop() || inspectorActiveItem.path
  }

  return (
    <div className="cv-inspector-content">
      {/* Skill header */}
      {skillInfo && (
        <div className="cv-inspector-skill-header">
          <div className="cv-inspector-skill-title">
            <span className="cv-inspector-skill-name">{skillInfo.name}</span>
            <span className="cv-inspector-item-badge">{skillInfo.department}</span>
          </div>
          {skillInfo.summary && (
            <p className="cv-inspector-skill-summary">{skillInfo.summary}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="cv-inspector-file-toolbar">
        <span className="cv-inspector-file-path">{displayPath}</span>
        <div className="cv-inspector-file-actions">
          {fileDirty && (
            <button className="cv-btn-action cv-btn-ghost" onClick={cancelEditing}>Discard</button>
          )}
          <button
            className={`cv-btn-action ${fileDirty ? 'cv-btn-primary' : 'cv-btn-ghost'}`}
            onClick={() => void saveFile()}
            disabled={!fileDirty}
          >
            {fileDirty ? 'Save' : 'Saved'}
          </button>
        </div>
      </div>

      {/* Body — always editable */}
      <div className="cv-inspector-file-body">
        {fileLoading ? (
          <div className="cv-inspector-loading">Loading...</div>
        ) : canEdit ? (
          <textarea
            className="cv-inspector-editor"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            spellCheck={false}
          />
        ) : fileContent ? (
          <pre className="cv-inspector-preview">{fileContent}</pre>
        ) : (
          <div className="cv-inspector-empty">Could not load file</div>
        )}
      </div>
    </div>
  )
}
