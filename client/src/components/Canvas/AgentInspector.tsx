import { useEffect } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { useUIStore } from '@/store/ui'
import { InspectorTree } from './InspectorTree'
import { InspectorContent } from './InspectorContent'

export function AgentInspector() {
  const selectedAgentId = useCanvasStore(s => s.selectedAgentId)
  const setSelectedAgent = useCanvasStore(s => s.setSelectedAgent)
  const closeInspector = useCanvasStore(s => s.closeInspector)
  const data = useCanvasStore(s => s.data)
  const inspectorActiveItem = useCanvasStore(s => s.inspectorActiveItem)
  const inspectorFileDirty = useCanvasStore(s => s.inspectorFileDirty)
  const deleteAgent = useCanvasStore(s => s.deleteAgent)
  const deletingAgentId = useCanvasStore(s => s.deletingAgentId)
  const toast = useUIStore(s => s.toast)

  // Escape to close content (clear active item), double-escape to dismiss
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectorFileDirty) return
        if (inspectorActiveItem) {
          closeInspector() // clears active item
        } else {
          setSelectedAgent(null) // dismiss the tree entirely
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeInspector, setSelectedAgent, inspectorFileDirty, inspectorActiveItem])

  if (!selectedAgentId) return null

  const agentId = selectedAgentId
  const agent = data?.agents.find(a => a.id === agentId)
  if (!agent) return null

  const isDeleting = deletingAgentId === agentId

  const files = data?.agentFiles[agentId]
  const totalFiles = (files?.instructions.length || 0) + (files?.memory.length || 0) + (files?.pm.length || 0)

  // Status bar info
  let statusPath = ''
  if (inspectorActiveItem?.kind === 'file') {
    statusPath = inspectorActiveItem.path
  } else if (inspectorActiveItem?.kind === 'skill') {
    const skill = data?.paletteSkills.find(s => s.id === inspectorActiveItem.skillId)
    statusPath = skill?.name || ''
  }

  const hasContent = !!inspectorActiveItem

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete agent "${agent.label}"?\n\nThis permanently removes its workspace, installed skills, and OpenClaw config references.`,
    )
    if (!confirmed) return

    try {
      await deleteAgent(agentId)
      toast(`Deleted ${agent.label}`, 'success')
    } catch (e) {
      toast(`Delete failed: ${e instanceof Error ? e.message : e}`, 'error')
    }
  }

  return (
    <div className={`cv-inspector${hasContent ? ' cv-inspector--expanded' : ''}`}>
      {/* Header */}
      <div className="cv-inspector-header">
        <span className="cv-inspector-header-emoji">{agent.emoji}</span>
        <div className="cv-inspector-header-info">
          <span className="cv-inspector-header-name">{agent.label}</span>
          <span className="cv-inspector-header-role">{agent.role}</span>
        </div>
        <button
          className="cv-inspector-delete"
          onClick={() => void handleDelete()}
          disabled={isDeleting}
          title={`Delete ${agent.label}`}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
        <button className="cv-inspector-close" onClick={() => setSelectedAgent(null)} title="Close inspector">
          ✕
        </button>
      </div>

      {/* Horizontal split: content left (middle of screen), tree right (pinned to edge) */}
      <div className="cv-inspector-split">
        {hasContent && (
          <div className="cv-inspector-content-wrap">
            <InspectorContent />
          </div>
        )}
        <InspectorTree agentId={agentId} />
      </div>

      {/* Status bar */}
      <div className="cv-status-bar">
        <span className="cv-status-text">{statusPath || 'No file selected'}</span>
        <span className="cv-status-text">{agent.skillCount} skills</span>
        <span className="cv-status-text">{totalFiles} docs</span>
        {inspectorFileDirty && <span className="cv-status-text cv-status-warn">Unsaved</span>}
      </div>
    </div>
  )
}
