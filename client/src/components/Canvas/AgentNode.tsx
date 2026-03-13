import { memo, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'

// Department → color mapping (Notion-style muted)
const DEPT_COLORS: Record<string, string> = {
  Engineering: '#0b6e99',
  Marketing: '#d9730d',
  Content: '#0f7b6c',
  Support: '#cb912f',
  Operations: '#6940a5',
  Analytics: '#ad1a72',
}

function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept] || '#9b9a97'
}

export interface AgentNodeData {
  agentId: string
  label: string
  emoji: string
  role: string
  skills: { id: string; name: string; department: string; variantPath: string }[]
  skillCount: number
  subagentLabels: string[]
  isSelected: boolean
  isDropTarget: boolean
  onSelect: (agentId: string) => void
  onOpenInspector: (agentId: string) => void
  onOpenSkills: (agentId: string) => void
  onAddSkill: (agentId: string) => void
  onPreviewSkill: (skillId: string) => void
  onSkillContextMenu: (e: React.MouseEvent, skillId: string, variantPath: string) => void
  onDragOver: (e: React.DragEvent, agentId: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, agentId: string) => void
}

const MAX_VISIBLE_SKILLS = 4

export const AgentNode = memo(function AgentNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData
  const [skillsExpanded, setSkillsExpanded] = useState(false)
  const visibleSkills = skillsExpanded ? d.skills : d.skills.slice(0, MAX_VISIBLE_SKILLS)
  const remaining = d.skills.length - MAX_VISIBLE_SKILLS

  return (
    <div
      className={`cv-agent-card${d.isSelected ? ' selected' : ''}${d.isDropTarget ? ' drop-target' : ''}`}
      onDragOver={(e) => d.onDragOver(e, d.agentId)}
      onDragLeave={() => d.onDragLeave()}
      onDrop={(e) => d.onDrop(e, d.agentId)}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Left} className="cv-handle" />
      <Handle type="source" position={Position.Right} className="cv-handle" />

      {/* Card header */}
      <div className="cv-card-header">
        <span className="cv-card-emoji">{d.emoji}</span>
        <span className={`cv-card-name${d.isSelected ? ' active' : ''}`}>{d.label}</span>
        <span className={`cv-card-status${d.isSelected ? ' active' : ''}`} />
      </div>

      {/* Description */}
      {d.role && (
        <p className="cv-card-desc">{d.role}</p>
      )}

      {/* Skills — expandable */}
      {d.skills.length > 0 && (
        <div className="cv-card-skills-section">
          <button
            className="cv-card-skills-toggle"
            onClick={(e) => { e.stopPropagation(); setSkillsExpanded(!skillsExpanded) }}
          >
            <svg
              className={`cv-card-skills-chevron${skillsExpanded ? ' open' : ''}`}
              width="8" height="8" viewBox="0 0 8 8" fill="none"
            >
              <path d="M2 2.5L4 4.5L6 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{d.skillCount} skill{d.skillCount !== 1 ? 's' : ''}</span>
          </button>

          {skillsExpanded && (
            <div className="cv-card-skills">
              {visibleSkills.map(skill => (
                <div
                  key={skill.id}
                  className="cv-card-skill"
                  onClick={(e) => { e.stopPropagation(); d.onPreviewSkill(skill.id) }}
                  onContextMenu={(e) => d.onSkillContextMenu(e, skill.id, skill.variantPath)}
                >
                  <span
                    className="cv-card-skill-dot"
                    style={{ background: getDeptColor(skill.department) }}
                  />
                  <span className="cv-card-skill-name">{skill.name}</span>
                </div>
              ))}
              {!skillsExpanded && remaining > 0 && (
                <span className="cv-card-skill-more">+{remaining} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Subagent connections */}
      {d.subagentLabels.length > 0 && (
        <div className="cv-card-connections">
          {d.subagentLabels.map(label => (
            <span key={label} className="cv-card-conn-label">→ {label}</span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="cv-card-footer">
        <button
          className="cv-card-add-btn"
          onClick={(e) => { e.stopPropagation(); d.onAddSkill(d.agentId) }}
          title="Add skill to agent"
        >
          + Skill
        </button>
        <button
          className="cv-card-docs-btn"
          onClick={(e) => { e.stopPropagation(); d.onOpenInspector(d.agentId) }}
          title="Inspect agent"
        >
          Inspect
        </button>
      </div>
    </div>
  )
})
