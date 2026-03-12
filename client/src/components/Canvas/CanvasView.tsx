import { useEffect } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { AgentCanvas } from './AgentCanvas'
import { SkillBrowser } from './SkillBrowser'
import { SidePanel } from './SidePanel'
import { AgentInspector } from './AgentInspector'

interface CanvasViewProps {
  onNavigateToFiles?: (agentId: string) => void
  themeClass?: string
}

export function CanvasView({ onNavigateToFiles, themeClass }: CanvasViewProps) {
  const loading = useCanvasStore(s => s.loading)
  const error = useCanvasStore(s => s.error)
  const data = useCanvasStore(s => s.data)
  const loadData = useCanvasStore(s => s.loadData)
  const setOnNavigateToFiles = useCanvasStore(s => s.setOnNavigateToFiles)
  const sidePanelMode = useCanvasStore(s => s.sidePanelMode)
  const browserOpen = useCanvasStore(s => s.browserOpen)

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (onNavigateToFiles) setOnNavigateToFiles(onNavigateToFiles)
    return () => setOnNavigateToFiles(null)
  }, [onNavigateToFiles, setOnNavigateToFiles])

  const rootCls = themeClass ? `cv-root ${themeClass}` : 'cv-root'

  if (loading && !data) {
    return (
      <div className={rootCls}>
        <div className="cv-loading">
          <span className="cv-loading-text">Loading agents...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={rootCls}>
        <div className="cv-error">
          <span className="cv-error-icon">⚠️</span>
          <span className="cv-error-text">{error}</span>
          <button className="cv-error-retry" onClick={() => void loadData()}>Retry</button>
        </div>
      </div>
    )
  }

  const agentCount = data?.agents.length ?? 0
  const skillCount = data?.paletteSkills.length ?? 0

  return (
    <div className={rootCls}>
      <div className="cv-chrome">
        <span className="cv-chrome-title">Agent Canvas</span>
        <span className="cv-chrome-right">{agentCount} agents · {skillCount} skills</span>
      </div>
      <div className="cv-body">
        <div className="cv-center">
          <AgentCanvas />
        </div>
        {browserOpen && <SkillBrowser />}
        {sidePanelMode?.kind === 'agent-inspector' && <AgentInspector />}
        {sidePanelMode?.kind === 'skill-preview' && <SidePanel />}
      </div>
    </div>
  )
}
