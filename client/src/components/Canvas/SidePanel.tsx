import { useCanvasStore } from '@/store/canvas'
import { SkillPreview } from './SkillPreview'

export function SidePanel() {
  const sidePanelMode = useCanvasStore(s => s.sidePanelMode)
  const closeSidePanel = useCanvasStore(s => s.closeSidePanel)

  if (!sidePanelMode) return null

  return (
    <div className="cv-side">
      <div className="cv-side-header">
        <span className="cv-side-title">Skill Preview</span>
        <button className="cv-side-close" onClick={closeSidePanel}>
          ✕
        </button>
      </div>
      <div className="cv-side-body">
        <SkillPreview />
      </div>
      <div className="cv-status-bar">
        <span className="cv-status-text">Skill Preview</span>
      </div>
    </div>
  )
}
