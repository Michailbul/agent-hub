import { useEffect, useState } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { fetchFile } from '@/lib/api'

export function SkillPreview() {
  const data = useCanvasStore(s => s.data)
  const previewSkillId = useCanvasStore(s => s.previewSkillId)
  const selectedAgentId = useCanvasStore(s => s.selectedAgentId)
  const assignSkill = useCanvasStore(s => s.assignSkill)
  const unassignSkill = useCanvasStore(s => s.unassignSkill)
  const editSkillInInspector = useCanvasStore(s => s.editSkillInInspector)
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const skill = data?.paletteSkills.find(s => s.id === previewSkillId)

  useEffect(() => {
    if (!skill?.variantPath) { setContent(null); return }
    let cancelled = false
    setLoading(true)
    // Load the SKILL.md file
    const skillMdPath = skill.variantPath.endsWith('/')
      ? skill.variantPath + 'SKILL.md'
      : skill.variantPath + '/SKILL.md'
    fetchFile(skillMdPath)
      .then(text => { if (!cancelled) setContent(text) })
      .catch(() => { if (!cancelled) setContent(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [skill?.variantPath])

  if (!skill) return null

  const isInstalled = selectedAgentId
    ? skill.installedAgentIds.includes(selectedAgentId)
    : false

  const handleAssign = async () => {
    if (!selectedAgentId) return
    try {
      await assignSkill(selectedAgentId, skill.variantPath)
    } catch (err) {
      console.error('Assign failed:', err)
    }
  }

  const handleUnassign = async () => {
    if (!selectedAgentId) return
    try {
      await unassignSkill(selectedAgentId, skill.id)
    } catch (err) {
      console.error('Unassign failed:', err)
    }
  }

  const handleEdit = () => {
    if (!selectedAgentId || !skill) return
    editSkillInInspector(selectedAgentId, skill.id, skill.variantPath)
  }

  return (
    <div className="cv-skill-preview">
      <div className="cv-skill-preview-header">
        <h3 className="cv-skill-preview-name">{skill.name}</h3>
        <span className="cv-palette-row-dept">{skill.department}</span>
      </div>
      {skill.summary && (
        <p className="cv-skill-preview-summary">{skill.summary}</p>
      )}
      {skill.installedAgentIds.length > 0 && (
        <span className="cv-skill-preview-installed">
          Installed on {skill.installedAgentIds.length} agent{skill.installedAgentIds.length !== 1 ? 's' : ''}
        </span>
      )}

      <div className="cv-skill-preview-actions">
        {selectedAgentId && (
          isInstalled ? (
            <button className="cv-btn-action cv-btn-danger" onClick={handleUnassign}>
              Remove from Agent
            </button>
          ) : (
            <button className="cv-btn-action cv-btn-primary" onClick={handleAssign}>
              + Add to Agent
            </button>
          )
        )}
        <button className="cv-btn-action cv-btn-ghost" onClick={handleEdit}>
          Edit Skill
        </button>
      </div>

      <div className="cv-skill-preview-content">
        {loading ? (
          <span className="cv-skill-preview-loading">Loading...</span>
        ) : content ? (
          <pre className="cv-skill-preview-body">{content}</pre>
        ) : (
          <span className="cv-skill-preview-empty">No SKILL.md found</span>
        )}
      </div>
    </div>
  )
}
