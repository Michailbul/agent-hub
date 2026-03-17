import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCanvasStore } from '@/store/canvas'
import { Separator } from '@/components/ui/separator'

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

  const itemClass = "relative flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-foreground bg-transparent border-none cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground text-left outline-none"
  const subItemClass = "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-foreground bg-transparent border-none cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground text-left outline-none"

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 cv-fade-in"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="px-2 py-1 text-xs font-medium text-muted-foreground truncate">
        {skill.name}
      </div>
      <Separator className="my-1" />

      <button className={itemClass} onClick={handlePreview}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted-foreground">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="7" cy="7" r="2" fill="currentColor" />
        </svg>
        <span>Preview</span>
      </button>

      {availableAgents.length > 0 && (
        <div
          className="relative"
          onMouseEnter={() => { setAgentSubmenuOpen(true); setTagSubmenuOpen(false) }}
          onMouseLeave={() => setAgentSubmenuOpen(false)}
        >
          <button className={itemClass}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted-foreground">
              <path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span>Add to agent</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto text-muted-foreground">
              <path d="M4 2.5L7 5L4 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {agentSubmenuOpen && (
            <div className="absolute left-full top-0 ml-1 min-w-[140px] rounded-lg bg-popover p-1 shadow-lg ring-1 ring-foreground/10 cv-fade-in">
              {availableAgents.map(a => (
                <button key={a.id} className={subItemClass} onClick={() => handleAssign(a.id)}>
                  <span className="text-sm">{a.emoji}</span>
                  <span>{a.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Separator className="my-1" />

      <div
        className="relative"
        onMouseEnter={() => { setTagSubmenuOpen(true); setAgentSubmenuOpen(false) }}
        onMouseLeave={() => setTagSubmenuOpen(false)}
      >
        <button className={itemClass}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-muted-foreground">
            <path d="M2 7.5L7 2.5H12V7.5L7 12.5L2 7.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="9.5" cy="5" r="1" fill="currentColor" />
          </svg>
          <span>Change tag</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto text-muted-foreground">
            <path d="M4 2.5L7 5L4 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {tagSubmenuOpen && (
          <div className="absolute left-full top-0 ml-1 min-w-[140px] rounded-lg bg-popover p-1 shadow-lg ring-1 ring-foreground/10 cv-fade-in">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                className={`${subItemClass} ${dept === skill.department ? 'font-medium bg-accent/50' : ''}`}
                onClick={() => handleChangeTag(dept)}
              >
                <span>{dept}</span>
                {dept === skill.department && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto text-foreground">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
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
