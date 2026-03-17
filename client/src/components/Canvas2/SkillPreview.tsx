import { useEffect, useState } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { fetchFile } from '@/lib/api'
import { getSkillDocumentPath } from '@/lib/skillPaths'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

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
    const skillMdPath = getSkillDocumentPath(skill.variantPath)
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
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-foreground">{skill.name}</h3>
        <Badge variant="secondary" className="text-[10px]">
          {skill.department}
        </Badge>
      </div>

      {skill.summary && (
        <p className="text-xs leading-relaxed text-muted-foreground">{skill.summary}</p>
      )}

      {skill.installedAgentIds.length > 0 && (
        <span className="text-[11px] text-muted-foreground">
          Installed on {skill.installedAgentIds.length} agent{skill.installedAgentIds.length !== 1 ? 's' : ''}
        </span>
      )}

      {/* Actions */}
      <div className="flex gap-1.5 flex-wrap">
        {selectedAgentId && (
          isInstalled ? (
            <Button variant="destructive" size="sm" onClick={handleUnassign}>
              Remove from Agent
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={handleAssign}>
              + Add to Agent
            </Button>
          )
        )}
        <Button variant="outline" size="sm" onClick={handleEdit}>
          Edit Skill
        </Button>
      </div>

      <Separator />

      {/* Content */}
      <div>
        {loading ? (
          <span className="text-xs text-muted-foreground block text-center py-3">Loading...</span>
        ) : content ? (
          <ScrollArea className="max-h-[60vh]">
            <pre className="text-xs leading-relaxed font-mono text-muted-foreground whitespace-pre-wrap break-words p-3 bg-muted rounded-lg">
              {content}
            </pre>
          </ScrollArea>
        ) : (
          <span className="text-xs text-muted-foreground block text-center py-3">
            No SKILL.md found
          </span>
        )}
      </div>
    </div>
  )
}
