import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSkillsStore } from '@/store/skills'

export function SkillDetailPanel() {
  const skills = useSkillsStore(s => s.skills)
  const agents = useSkillsStore(s => s.agents)
  const selectedSkillId = useSkillsStore(s => s.selectedSkillId)
  const selectSkill = useSkillsStore(s => s.selectSkill)
  const editingContent = useSkillsStore(s => s.editingContent)
  const editingDirty = useSkillsStore(s => s.editingDirty)
  const setEditingContent = useSkillsStore(s => s.setEditingContent)
  const saveSkillContent = useSkillsStore(s => s.saveSkillContent)
  const deleteSkill = useSkillsStore(s => s.deleteSkill)
  const assignSkill = useSkillsStore(s => s.assignSkill)
  const unassignSkill = useSkillsStore(s => s.unassignSkill)
  const promoteSkill = useSkillsStore(s => s.promoteSkill)

  const skill = useMemo(
    () => skills.find(s => s.id === selectedSkillId),
    [skills, selectedSkillId]
  )

  const handleSave = useCallback(async () => {
    try {
      await saveSkillContent()
    } catch {
      // handled elsewhere
    }
  }, [saveSkillContent])

  // Ctrl+S handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && editingDirty) {
        e.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editingDirty, handleSave])

  if (!skill) return null

  const variant = skill.variants[0]
  const frontmatter = variant?.frontmatter || {}

  const handleDelete = async () => {
    if (!variant?.path) return
    if (!window.confirm(`Delete skill "${skill.name}"? This cannot be undone.`)) return
    try {
      await deleteSkill(variant.path)
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const [promoting, setPromoting] = useState(false)
  const [promoteError, setPromoteError] = useState<string | null>(null)

  const handlePromote = async () => {
    if (!variant?.path) return
    setPromoting(true)
    setPromoteError(null)
    try {
      await promoteSkill(variant.path)
    } catch (err) {
      setPromoteError(err instanceof Error ? err.message : 'Promote failed')
    } finally {
      setPromoting(false)
    }
  }

  const handleToggleAgent = async (agentId: string) => {
    const isInstalled = skill.installedAgentIds.includes(agentId)
    try {
      if (isInstalled) {
        await unassignSkill(agentId, skill.id)
      } else if (variant?.path) {
        await assignSkill(agentId, variant.path)
      }
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  return (
    <div className="sk-detail-inner">
      <div className="sk-detail-topbar">
        <button className="sk-detail-close" onClick={() => selectSkill(null)} title="Close">
          {'\u2715'}
        </button>
      </div>

      <div className="sk-detail-header">
        <h2 className="sk-detail-title">{skill.name}</h2>
        <span className="sk-detail-dept">{skill.grouping?.department || 'Utility'}</span>
      </div>

      <div className="sk-detail-meta">
        <div className="sk-meta-row">
          <span className="sk-meta-label">Source</span>
          <span className="sk-meta-value">{variant?.sourceLabel || '\u2014'}</span>
        </div>
        <div className="sk-meta-row">
          <span className="sk-meta-label">Author</span>
          <span className="sk-meta-value">{frontmatter.author || '\u2014'}</span>
        </div>
        <div className="sk-meta-row">
          <span className="sk-meta-label">License</span>
          <span className="sk-meta-value">{frontmatter.license || '\u2014'}</span>
        </div>
        {variant?.folder && (
          <div className="sk-meta-row">
            <span className="sk-meta-label">Folder</span>
            <span className="sk-meta-value sk-meta-folder">{variant.folder}/</span>
          </div>
        )}
        {skill.variants.length > 1 && (
          <div className="sk-meta-row">
            <span className="sk-meta-label">Variants</span>
            <span className="sk-meta-value">{skill.variants.length} sources</span>
          </div>
        )}
      </div>

      <div className="sk-detail-section">
        <div className="sk-detail-section-label">Assign to Agent</div>
        <div className="sk-detail-agents">
          {agents.map(agent => {
            const isInstalled = skill.installedAgentIds.includes(agent.id)
            return (
              <button
                key={agent.id}
                className={`sk-agent-chip${isInstalled ? ' installed' : ''}`}
                onClick={() => handleToggleAgent(agent.id)}
                title={isInstalled ? `Unassign from ${agent.label}` : `Assign to ${agent.label}`}
              >
                <span className="sk-agent-chip-emoji">{agent.emoji}</span>
                <span className="sk-agent-chip-name">{agent.label}</span>
                <span className="sk-agent-chip-status">
                  {isInstalled ? '\u2713' : '+'}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {!skill.isInMaster && (
        <div className="sk-detail-section sk-detail-sync-section">
          <div className="sk-detail-section-label">Sync Status</div>
          <div className="sk-detail-sync-info">
            <span className="sk-row-badge-unsynced" />
            <span>Not in master ({'\u007E'}/.agents/skills/)</span>
          </div>
          <button
            className="sk-btn-promote"
            onClick={handlePromote}
            disabled={promoting}
          >
            {promoting ? 'Promoting...' : 'Promote to Master'}
          </button>
          {promoteError && <div className="sk-promote-error">{promoteError}</div>}
        </div>
      )}

      <div className="sk-detail-section sk-detail-editor-section">
        <div className="sk-detail-section-label">
          SKILL.md
          {editingDirty && <span className="sk-dirty-dot" />}
        </div>
        <textarea
          className="sk-detail-editor"
          value={editingContent || ''}
          onChange={e => setEditingContent(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="sk-detail-actions">
        <button
          className="sk-btn-save"
          onClick={handleSave}
          disabled={!editingDirty}
        >
          {editingDirty ? 'Save' : 'Saved'}
        </button>
        <button className="sk-btn-delete" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  )
}
