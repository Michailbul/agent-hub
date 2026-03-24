import { useEffect } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { useUIStore } from '@/store/ui'
import { InspectorTree } from './InspectorTree'
import { InspectorContent } from './InspectorContent'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function AgentInspector() {
  const sidePanelMode = useCanvasStore(s => s.sidePanelMode)
  const closeInspector = useCanvasStore(s => s.closeInspector)
  const data = useCanvasStore(s => s.data)
  const inspectorActiveItem = useCanvasStore(s => s.inspectorActiveItem)
  const inspectorFileDirty = useCanvasStore(s => s.inspectorFileDirty)
  const deleteAgent = useCanvasStore(s => s.deleteAgent)
  const deletingAgentId = useCanvasStore(s => s.deletingAgentId)
  const toast = useUIStore(s => s.toast)

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectorFileDirty) return
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

  const isDeleting = deletingAgentId === agentId

  const files = data?.agentFiles[agentId]
  const totalFiles = (files?.instructions.length || 0) + (files?.memory.length || 0) + (files?.pm.length || 0)

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
    <div className={`${hasContent ? 'w-[700px]' : 'w-[260px]'} shrink-0 bg-background border-l border-border flex flex-col overflow-hidden cv-slide-in transition-[width] duration-200 ease-out`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 shrink-0">
        <span className="text-xl leading-none">{agent.emoji}</span>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <span className="text-sm font-medium text-foreground truncate">
            {agent.label}
          </span>
          <span className="text-[11px] text-muted-foreground truncate">
            {agent.role}
          </span>
        </div>
        <Button
          variant="destructive"
          size="xs"
          onClick={() => void handleDelete()}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={closeInspector}
          className="text-muted-foreground shrink-0"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Button>
      </div>

      <Separator />

      {/* Split view: tree + content */}
      <div className="flex-1 flex flex-row overflow-hidden">
        <InspectorTree agentId={agentId} />
        {hasContent && (
          <div className="flex-1 min-w-0 overflow-hidden flex flex-col cv-content-in">
            <InspectorContent />
          </div>
        )}
      </div>

      {/* Status bar */}
      <Separator />
      <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/30 shrink-0">
        <span className="text-[11px] text-muted-foreground truncate flex-1">
          {statusPath || 'No file selected'}
        </span>
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
          {agent.skillCount} skills
        </Badge>
        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
          {totalFiles} docs
        </Badge>
        {inspectorFileDirty && (
          <Badge variant="destructive" className="text-[10px] h-4 px-1.5">
            Unsaved
          </Badge>
        )}
      </div>
    </div>
  )
}
