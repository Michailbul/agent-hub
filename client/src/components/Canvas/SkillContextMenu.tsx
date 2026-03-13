import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCanvasStore } from '@/store/canvas'

interface SkillContextMenuProps {
  skillId: string
  variantPath: string
  x: number
  y: number
  onClose: () => void
}

const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Product/Design',
  'Sales',
  'Operations',
  'Knowledge',
  'Utility',
]

function SkillContextMenuInner({ skillId, variantPath, x, y, onClose }: SkillContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [agentSubmenuOpen, setAgentSubmenuOpen] = useState(false)
  const [tagSubmenuOpen, setTagSubmenuOpen] = useState(false)
  const [pos, setPos] = useState({ x, y })

  const data = useCanvasStore(s => s.data)
  const assignSkill = useCanvasStore(s => s.assignSkill)
  const updateSkillTag = useCanvasStore(s => s.updateSkillTag)
  const previewSkill = useCanvasStore(s => s.previewSkill)

  const skill = data?.paletteSkills.find(s => s.id === skillId)
  const agents = data?.agents || []
  // Agents that DON'T have this skill installed
  const availableAgents = agents.filter(a => !skill?.installedAgentIds.includes(a.id))

  // Viewport-aware placement
  useEffect(() => {
    if (!menuRef.current) return
    const { width, height } = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    setPos({
      x: x + width > vw ? x - width : x,
      y: y + height > vh ? y - height : y,
    })
  }, [x, y])

  // Close on outside click / Escape / scroll
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', key)
    document.addEventListener('scroll', onClose, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', key)
      document.removeEventListener('scroll', onClose, true)
    }
  }, [onClose])

  const handleAssign = async (agentId: string) => {
    onClose()
    try {
      await assignSkill(agentId, variantPath)
    } catch (err) {
      console.error('Assign failed:', err)
    }
  }

  const handleChangeTag = async (dept: string) => {
    onClose()
    try {
      await updateSkillTag(skillId, dept)
    } catch (err) {
      console.error('Tag update failed:', err)
    }
  }

  const handlePreview = () => {
    onClose()
    previewSkill(skillId)
  }

  if (!skill) return null

  return (
    <div ref={menuRef} className="ctx" style={{ left: pos.x, top: pos.y }} onContextMenu={e => e.preventDefault()}>
      {/* Skill name header */}
      <div className="ctx-header">
        <span className="ctx-fname">{skill.name}</span>
      </div>
      <div className="ctx-sep" />

      <button className="ctx-row" onClick={handlePreview}>
        <span className="ctx-icon">◇</span>
        <span>Preview</span>
      </button>

      {/* Add to agent submenu */}
      {availableAgents.length > 0 && (
        <div
          className={`ctx-row ctx-submenu-trigger${agentSubmenuOpen ? ' open' : ''}`}
          onMouseEnter={() => { setAgentSubmenuOpen(true); setTagSubmenuOpen(false) }}
          onMouseLeave={() => setAgentSubmenuOpen(false)}
        >
          <span className="ctx-icon">+</span>
          <span>Add to agent</span>
          <span className="ctx-chevron">&rarr;</span>
          {agentSubmenuOpen && (
            <div className="ctx-sub">
              {availableAgents.map(a => (
                <button key={a.id} className="ctx-row" onClick={() => handleAssign(a.id)}>
                  <span className="ctx-icon">{a.emoji}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="ctx-sep" />

      {/* Change tag submenu */}
      <div
        className={`ctx-row ctx-submenu-trigger${tagSubmenuOpen ? ' open' : ''}`}
        onMouseEnter={() => { setTagSubmenuOpen(true); setAgentSubmenuOpen(false) }}
        onMouseLeave={() => setTagSubmenuOpen(false)}
      >
        <span className="ctx-icon">#</span>
        <span>Change tag</span>
        <span className="ctx-chevron">&rarr;</span>
        {tagSubmenuOpen && (
          <div className="ctx-sub">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                className={`ctx-row${dept === skill.department ? ' ctx-active' : ''}`}
                onClick={() => handleChangeTag(dept)}
              >
                <span>{dept}</span>
                {dept === skill.department && <span className="ctx-check">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function SkillContextMenu(props: SkillContextMenuProps) {
  return createPortal(<SkillContextMenuInner {...props} />, document.body)
}

// Hook for managing context menu state
export function useSkillContextMenu() {
  const [menu, setMenu] = useState<{ skillId: string; variantPath: string; x: number; y: number } | null>(null)

  const openMenu = (e: React.MouseEvent, skillId: string, variantPath: string) => {
    e.preventDefault()
    e.stopPropagation()
    setMenu({ skillId, variantPath, x: e.clientX, y: e.clientY })
  }

  const closeMenu = () => setMenu(null)

  return { menu, openMenu, closeMenu }
}
