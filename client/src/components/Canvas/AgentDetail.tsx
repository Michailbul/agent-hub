import { useMemo, useState } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { TelegramBadge } from './TelegramBadge'
import { CategoryFilter } from './CategoryFilter'

export function AgentDetail() {
  const data = useCanvasStore(s => s.data)
  const selectedAgentId = useCanvasStore(s => s.selectedAgentId)
  const dropTargetAgentId = useCanvasStore(s => s.dropTargetAgentId)
  const setDropTargetAgent = useCanvasStore(s => s.setDropTargetAgent)
  const assignSkill = useCanvasStore(s => s.assignSkill)
  const unassignSkill = useCanvasStore(s => s.unassignSkill)
  const onNavigateToFiles = useCanvasStore(s => s.onNavigateToFiles)
  const toggleBrowser = useCanvasStore(s => s.toggleBrowser)
  const browserOpen = useCanvasStore(s => s.browserOpen)
  const previewSkill = useCanvasStore(s => s.previewSkill)
  const agentSkillFilter = useCanvasStore(s => s.agentSkillFilter)
  const toggleAgentSkillFilter = useCanvasStore(s => s.toggleAgentSkillFilter)
  const clearAgentSkillFilter = useCanvasStore(s => s.clearAgentSkillFilter)
  const setSidePanelMode = useCanvasStore(s => s.setSidePanelMode)
  const [expanded, setExpanded] = useState(false)

  if (!data || !selectedAgentId) {
    return (
      <div className="cv-detail cv-detail-empty">
        <span className="cv-detail-empty-icon">←</span>
        <span className="cv-detail-empty-text">Select an agent</span>
      </div>
    )
  }

  const agent = data.agents.find(a => a.id === selectedAgentId)
  if (!agent) return null

  const files = data.agentFiles[agent.id]
  const isDropTarget = dropTargetAgentId === agent.id
  const modelShort = agent.model.primary
    ? agent.model.primary.split('/').pop() || agent.model.primary
    : 'default'

  // Enrich skills with department from palette
  const agentSkillsWithDept = useMemo(() => {
    return agent.skills.map(pill => {
      const palette = data.paletteSkills.find(p => p.id === pill.id)
      return { ...pill, department: palette?.department || 'Utility' }
    })
  }, [agent.skills, data.paletteSkills])

  const agentDeptTags = useMemo(() =>
    [...new Set(agentSkillsWithDept.map(s => s.department))].sort(),
    [agentSkillsWithDept],
  )

  const filteredSkills = useMemo(() => {
    if (agentSkillFilter.size === 0) return agentSkillsWithDept
    return agentSkillsWithDept.filter(s => agentSkillFilter.has(s.department))
  }, [agentSkillsWithDept, agentSkillFilter])

  const MAX_VISIBLE = 12
  const visibleSkills = expanded ? filteredSkills : filteredSkills.slice(0, MAX_VISIBLE)
  const hiddenCount = filteredSkills.length - MAX_VISIBLE

  const handleDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes('application/x-canvas-skill')) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropTargetAgent(agent.id)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const { clientX, clientY } = e
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDropTargetAgent(null)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDropTargetAgent(null)
    const raw = e.dataTransfer.getData('application/x-canvas-skill')
    if (!raw) return
    try {
      const { variantPath } = JSON.parse(raw)
      await assignSkill(agent.id, variantPath)
    } catch (err) {
      console.error('Skill assign failed:', err)
    }
  }

  const handleRemoveSkill = async (skillId: string) => {
    try {
      await unassignSkill(agent.id, skillId)
    } catch (err) {
      console.error('Skill unassign failed:', err)
    }
  }

  const allFiles = [
    ...(files?.instructions || []).map(f => ({ ...f, kind: 'instructions' as const })),
    ...(files?.memory || []).map(f => ({ ...f, kind: 'memory' as const })),
    ...(files?.pm || []).map(f => ({ ...f, kind: 'pm' as const })),
  ]

  return (
    <div className="cv-detail">
      {/* Pane Header */}
      <div className="cv-pane-header">
        <span className="cv-pane-header-icon">{agent.emoji}</span>
        <span className="cv-pane-header-label">{agent.label} · IDENTITY</span>
        <div className="cv-pane-header-right">
          <span className="cv-status-text">{modelShort}</span>
        </div>
      </div>

      <div className="cv-detail-scroll">
        {/* Header */}
        <div className="cv-detail-header">
          <span className="cv-detail-emoji">{agent.emoji}</span>
          <div className="cv-detail-header-info">
            <h2 className="cv-detail-name">{agent.label}</h2>
            <p className="cv-detail-role">{agent.role}</p>
          </div>
        </div>
        <div className="cv-detail-meta">
          <span className="cv-pill cv-pill-model">{modelShort}</span>
          {agent.subagents.length > 0 && (
            <span className="cv-pill cv-pill-sub">{agent.subagents.length} subagent{agent.subagents.length !== 1 ? 's' : ''}</span>
          )}
          {agent.telegram && <TelegramBadge telegram={agent.telegram} />}
        </div>

        {/* Skills */}
        <div
          className={`cv-section${isDropTarget ? ' cv-drop-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="cv-section-header">
            <span className="cv-section-label">Skills</span>
            <span className="cv-section-count">{agent.skills.length}</span>
            <button
              className={`cv-btn-sm${browserOpen ? ' active' : ''}`}
              onClick={toggleBrowser}
            >
              {browserOpen ? 'Close browser' : '+ Add'}
            </button>
          </div>

          <CategoryFilter
            tags={agentDeptTags}
            activeTags={agentSkillFilter}
            onToggle={toggleAgentSkillFilter}
            onClear={clearAgentSkillFilter}
          />

          {filteredSkills.length > 0 ? (
            <div className="cv-skill-list">
              {visibleSkills.map(skill => (
                <div
                  key={skill.id}
                  className="cv-skill-row"
                  onClick={() => previewSkill(skill.id)}
                >
                  <span className="cv-skill-dot" />
                  <span className="cv-skill-row-name">{skill.name}</span>
                  <span className="cv-skill-row-dept">{skill.department}</span>
                  <button
                    className="cv-skill-row-remove"
                    onClick={(e) => { e.stopPropagation(); void handleRemoveSkill(skill.id) }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {!expanded && hiddenCount > 0 && (
                <button className="cv-skill-more" onClick={() => setExpanded(true)}>
                  +{hiddenCount} more
                </button>
              )}
              {expanded && hiddenCount > 0 && (
                <button className="cv-skill-more" onClick={() => setExpanded(false)}>
                  show less
                </button>
              )}
            </div>
          ) : (
            <span className="cv-drop-hint">
              {agentSkillFilter.size > 0 ? 'No skills match this filter' : 'Drag skills here to assign'}
            </span>
          )}
        </div>

        {/* Documents */}
        {allFiles.length > 0 && (
          <div className="cv-section">
            <div className="cv-section-header">
              <span className="cv-section-label">Documents</span>
              <span className="cv-section-count">{allFiles.length}</span>
            </div>
            <div className="cv-files">
              {allFiles.map(file => (
                <div
                  key={file.path}
                  className="cv-file-row"
                  onClick={() => setSidePanelMode({ kind: 'agent-inspector', agentId: agent.id })}
                >
                  <span className="cv-file-name">{file.label || file.name}</span>
                  <span className="cv-file-kind">{file.kind}</span>
                  <button
                    className="cv-file-edit"
                    onClick={(e) => { e.stopPropagation(); onNavigateToFiles?.(agent.id) }}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="cv-status-bar">
        <span className="cv-status-text">{agent.skills.length} skills</span>
        <span className="cv-status-text">{allFiles.length} docs</span>
        {agent.skills.length > 0 && <span className="cv-status-text cv-status-green">All active</span>}
      </div>
    </div>
  )
}
