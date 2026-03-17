import { useEffect } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { AgentCanvas } from './AgentCanvas'
import { SkillBrowser } from './SkillBrowser'
import { SidePanel } from './SidePanel'
import { AgentInspector } from './AgentInspector'
import { SkillGraph } from './SkillGraph'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import '@/shadcn-globals.css'
import './canvas.css'

interface CanvasViewProps {
  onNavigateToFiles?: (agentId: string) => void
  themeClass?: string
}

export function CanvasView({ onNavigateToFiles }: CanvasViewProps) {
  const loading = useCanvasStore(s => s.loading)
  const error = useCanvasStore(s => s.error)
  const data = useCanvasStore(s => s.data)
  const loadData = useCanvasStore(s => s.loadData)
  const setOnNavigateToFiles = useCanvasStore(s => s.setOnNavigateToFiles)
  const sidePanelMode = useCanvasStore(s => s.sidePanelMode)
  const browserOpen = useCanvasStore(s => s.browserOpen)
  const canvasViewMode = useCanvasStore(s => s.canvasViewMode)
  const setCanvasViewMode = useCanvasStore(s => s.setCanvasViewMode)

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (onNavigateToFiles) setOnNavigateToFiles(onNavigateToFiles)
    return () => setOnNavigateToFiles(null)
  }, [onNavigateToFiles, setOnNavigateToFiles])

  if (loading && !data) {
    return (
      <div className="cv2-root shadcn-theme-2">
        <div className="flex-1 flex items-center justify-center">
          <span className="text-sm text-muted-foreground">
            Loading agents...
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="cv2-root shadcn-theme-2">
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <span className="text-lg text-muted-foreground">!</span>
          <span className="text-sm text-muted-foreground">{error}</span>
          <button
            className="text-sm font-medium px-4 py-1.5 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
            onClick={() => void loadData()}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const agentCount = data?.agents.length ?? 0
  const skillCount = data?.paletteSkills.length ?? 0

  return (
    <div className="cv2-root shadcn-theme-2">
      {/* Chrome bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border shrink-0 bg-background">
        <Tabs
          value={canvasViewMode}
          onValueChange={(val) => setCanvasViewMode(val as 'agents' | 'skill-graph')}
        >
          <TabsList variant="default" className="h-7">
            <TabsTrigger value="agents" className="text-xs px-3">
              Agents
            </TabsTrigger>
            <TabsTrigger value="skill-graph" className="text-xs px-3">
              Skill Graph
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-normal">
            {agentCount} agents
          </Badge>
          <Badge variant="outline" className="text-xs font-normal">
            {skillCount} skills
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="cv2-body">
        <div className="cv2-center">
          {canvasViewMode === 'agents' ? <AgentCanvas /> : <SkillGraph />}
        </div>
        {canvasViewMode === 'agents' && browserOpen && <SkillBrowser />}
        {sidePanelMode?.kind === 'agent-inspector' && <AgentInspector />}
        {sidePanelMode?.kind === 'skill-preview' && <SidePanel />}
      </div>
    </div>
  )
}
