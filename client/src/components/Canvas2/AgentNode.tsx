import { memo, useEffect, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Department color mapping
const DEPT_COLORS: Record<string, string> = {
  Engineering: 'oklch(0.55 0.22 264.53)',
  Marketing: 'oklch(0.81 0.17 75.35)',
  Content: 'oklch(0.6 0.15 160)',
  Support: 'oklch(0.72 0.12 60)',
  Operations: 'oklch(0.55 0.15 300)',
  Analytics: 'oklch(0.6 0.18 340)',
}

function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept] || 'oklch(0.56 0 0)'
}

export interface AgentNodeData {
  agentId: string
  label: string
  emoji: string
  role: string
  skills: { id: string; name: string; department: string; variantPath: string }[]
  activeSkillId: string | null
  skillCount: number
  subagentLabels: string[]
  isSelected: boolean
  isDropTarget: boolean
  isDeleting: boolean
  onSelect: (agentId: string) => void
  onOpenInspector: (agentId: string) => void
  onOpenSkills: (agentId: string) => void
  onAddSkill: (agentId: string) => void
  onDeleteAgent: (agentId: string, label: string) => void
  onPreviewSkill: (skillId: string) => void
  onRemoveSkill: (agentId: string, skillId: string) => void
  onSkillContextMenu: (e: React.MouseEvent, skillId: string, variantPath: string) => void
  onDragOver: (e: React.DragEvent, agentId: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, agentId: string) => void
}

const MAX_VISIBLE_SKILLS = 4

export const AgentNode = memo(function AgentNode({ data }: NodeProps) {
  const d = data as unknown as AgentNodeData
  const [skillsExpanded, setSkillsExpanded] = useState(false)

  useEffect(() => {
    if (d.activeSkillId) setSkillsExpanded(true)
  }, [d.activeSkillId])

  const visibleSkills = skillsExpanded ? d.skills : d.skills.slice(0, MAX_VISIBLE_SKILLS)
  const remaining = d.skills.length - MAX_VISIBLE_SKILLS

  return (
    <div
      onDragOver={(e) => d.onDragOver(e, d.agentId)}
      onDragLeave={() => d.onDragLeave()}
      onDrop={(e) => d.onDrop(e, d.agentId)}
      className="w-[230px]"
    >
      <Handle type="target" position={Position.Left} className="cv-handle" />
      <Handle type="source" position={Position.Right} className="cv-handle" />

      <Card
        size="sm"
        className={`shadow-md border border-border transition-all duration-150 ${
          d.isDropTarget
            ? 'ring-2 ring-foreground/40 border-dashed bg-muted/50'
            : d.isSelected
            ? 'ring-2 ring-foreground shadow-lg'
            : 'hover:shadow-lg hover:-translate-y-0.5'
        }`}
      >
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2 w-full">
            <span className="text-lg leading-none shrink-0">{d.emoji}</span>
            <CardTitle className={`text-sm truncate ${d.isSelected ? 'text-foreground' : ''}`}>
              {d.label}
            </CardTitle>
            <div
              className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${
                d.isSelected ? 'bg-foreground' : 'bg-muted-foreground/30'
              }`}
            />
          </div>
        </CardHeader>

        {d.role && (
          <CardContent className="pt-0 pb-0">
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{d.role}</p>
          </CardContent>
        )}

        {/* Skills section */}
        {d.skills.length > 0 && (
          <CardContent className="pt-0 pb-0">
            <button
              className="flex items-center gap-1.5 w-full py-1 bg-transparent border-none cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => { e.stopPropagation(); setSkillsExpanded(!skillsExpanded) }}
            >
              <svg
                style={{ transform: skillsExpanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 150ms' }}
                width="8" height="8" viewBox="0 0 8 8" fill="none"
              >
                <path d="M2 2.5L4 4.5L6 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{d.skillCount} skill{d.skillCount !== 1 ? 's' : ''}</span>
            </button>

            {skillsExpanded && (
              <div className="grid grid-cols-2 gap-1 max-h-[108px] overflow-y-auto pb-1">
                {d.skills.map(skill => (
                  <div
                    key={skill.id}
                    className={`group/skill relative flex items-center gap-1 px-1.5 py-1 rounded-md cursor-pointer transition-colors border min-w-0 ${
                      d.activeSkillId === skill.id
                        ? 'bg-accent border-border'
                        : 'bg-muted/40 border-transparent hover:bg-accent/60 hover:border-border/50'
                    }`}
                    onClick={(e) => { e.stopPropagation(); d.onPreviewSkill(skill.id) }}
                    onContextMenu={(e) => d.onSkillContextMenu(e, skill.id, skill.variantPath)}
                    title={skill.name}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: getDeptColor(skill.department) }} />
                    <span className="text-[9.5px] text-muted-foreground truncate flex-1 pr-2">{skill.name}</span>
                    <button
                      type="button"
                      className="opacity-0 group-hover/skill:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 flex items-center justify-center border-none bg-transparent p-0 text-muted-foreground hover:text-destructive text-[9px] cursor-pointer transition-all rounded"
                      title={`Remove ${skill.name} from ${d.label}`}
                      aria-label={`Remove ${skill.name} from ${d.label}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        d.onRemoveSkill(d.agentId, skill.id)
                      }}
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {false && (
                  <span className="text-[10px] text-muted-foreground/60 px-1.5 py-0.5">
                    placeholder
                )}
              </div>
            )}
          </CardContent>
        )}

        {/* Subagent connections */}
        {d.subagentLabels.length > 0 && (
          <CardContent className="pt-0 pb-0">
            <div className="flex flex-col gap-0.5 pt-1 border-t border-border">
              {d.subagentLabels.map(label => (
                <span key={label} className="text-[10px] text-muted-foreground">&rarr; {label}</span>
              ))}
            </div>
          </CardContent>
        )}

        <CardFooter className="gap-1.5 pt-0">
          <Button
            variant="outline"
            size="xs"
            onClick={(e) => { e.stopPropagation(); d.onAddSkill(d.agentId) }}
          >
            + Skill
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => { e.stopPropagation(); d.onOpenInspector(d.agentId) }}
          >
            Inspect
          </Button>
          <Button
            variant="destructive"
            size="xs"
            className="ml-auto"
            onClick={(e) => {
              e.stopPropagation()
              d.onDeleteAgent(d.agentId, d.label)
            }}
            disabled={d.isDeleting}
          >
            {d.isDeleting ? '...' : 'Del'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
})
