import { useEffect } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

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
      <div className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
          Select a file to edit
        </div>
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
    <div className="flex-1 overflow-y-auto flex flex-col">
      {/* Skill header */}
      {skillInfo && (
        <div className="px-3 pt-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{skillInfo.name}</span>
            <Badge variant="secondary" className="text-[10px]">
              {skillInfo.department}
            </Badge>
          </div>
          {skillInfo.summary && (
            <p className="text-xs leading-relaxed text-muted-foreground">{skillInfo.summary}</p>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 shrink-0">
        <span className="text-[11px] text-muted-foreground flex-1 truncate">{displayPath}</span>
        <div className="flex gap-1">
          {fileDirty && (
            <Button variant="outline" size="xs" onClick={cancelEditing}>
              Discard
            </Button>
          )}
          <Button
            variant={fileDirty ? 'default' : 'outline'}
            size="xs"
            onClick={() => void saveFile()}
            disabled={!fileDirty}
          >
            {fileDirty ? 'Save' : 'Saved'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {fileLoading ? (
          <div className="text-xs text-muted-foreground p-12 text-center">Loading...</div>
        ) : canEdit ? (
          <textarea
            className="flex-1 font-mono text-xs leading-relaxed text-foreground bg-muted/30 border-none p-3 resize-none outline-none overflow-y-auto focus:ring-2 focus:ring-ring/20 focus:ring-inset rounded-none"
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            spellCheck={false}
          />
        ) : fileContent ? (
          <pre className="text-xs leading-relaxed font-mono text-muted-foreground whitespace-pre-wrap break-words m-0 p-3 flex-1 overflow-y-auto">
            {fileContent}
          </pre>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
            Could not load file
          </div>
        )}
      </div>
    </div>
  )
}
