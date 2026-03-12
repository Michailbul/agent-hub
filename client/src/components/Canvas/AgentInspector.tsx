import { useEffect } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { useCronsStore } from '@/store/crons'
import { InspectorTree } from './InspectorTree'
import { InspectorContent } from './InspectorContent'

export function AgentInspector() {
  const sidePanelMode = useCanvasStore(s => s.sidePanelMode)
  const closeInspector = useCanvasStore(s => s.closeInspector)
  const data = useCanvasStore(s => s.data)
  const inspectorActiveItem = useCanvasStore(s => s.inspectorActiveItem)
  const inspectorFileDirty = useCanvasStore(s => s.inspectorFileDirty)
  const loadCronJobs = useCronsStore(s => s.loadJobs)

  // Load cron jobs when inspector opens
  useEffect(() => {
    void loadCronJobs()
  }, [loadCronJobs])

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectorFileDirty) return // don't close if unsaved
        closeInspector()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeInspector, inspectorFileDirty])

  if (!sidePanelMode || sidePanelMode.kind !== 'agent-inspector') return null

  const agentId = sidePanelMode.agentId
  const agent = data?.agents.find(a => a.id === agentId)
  if (!agent) return null

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

  return (
    <div className={`cv-inspector${hasContent ? ' cv-inspector--expanded' : ''}`}>
      {/* Header */}
      <div className="cv-inspector-header">
        <span className="cv-inspector-header-emoji">{agent.emoji}</span>
        <div className="cv-inspector-header-info">
          <span className="cv-inspector-header-name">{agent.label}</span>
          <span className="cv-inspector-header-role">{agent.role}</span>
        </div>
        <button className="cv-inspector-close" onClick={closeInspector} title="Close inspector">
          ✕
        </button>
      </div>

      {/* Horizontal split: tree left, content right */}
      <div className="cv-inspector-split">
        <InspectorTree agentId={agentId} />
        {hasContent && (
          <div className="cv-inspector-content-wrap">
            <InspectorContent />
          </div>
        )}
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
