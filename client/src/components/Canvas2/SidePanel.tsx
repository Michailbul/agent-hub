import { useCanvasStore } from '@/store/canvas'
import { SkillPreview } from './SkillPreview'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function SidePanel() {
  const sidePanelMode = useCanvasStore(s => s.sidePanelMode)
  const closeSidePanel = useCanvasStore(s => s.closeSidePanel)

  if (!sidePanelMode) return null

  return (
    <div className="w-80 shrink-0 bg-background border-l border-border flex flex-col overflow-hidden cv-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
        <span className="text-xs font-medium text-foreground">
          Skill Preview
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={closeSidePanel}
          className="text-muted-foreground"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Button>
      </div>

      <Separator />

      {/* Body */}
      <ScrollArea className="flex-1 p-3">
        <SkillPreview />
      </ScrollArea>

      {/* Status bar */}
      <Separator />
      <div className="flex items-center gap-3 px-3 py-1.5 bg-muted/30 shrink-0">
        <span className="text-[11px] text-muted-foreground">Skill Preview</span>
      </div>
    </div>
  )
}
