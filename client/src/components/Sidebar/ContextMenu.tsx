import { useEffect, useRef, useState, useCallback } from 'react'
import { useFile } from '@/hooks/useFile'
import { useUIStore } from '@/store/ui'
import { usePanesStore } from '@/store/panes'
import type { AgentFile } from '@/types'

interface ContextMenuProps {
  file: AgentFile
  x: number
  y: number
  agents: Array<{ id: string; label: string; emoji: string; root: string }>
  onClose: () => void
}

export function ContextMenu({ file, x, y, agents, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [copySubmenu, setCopySubmenu] = useState(false)
  const [moveSubmenu, setMoveSubmenu] = useState(false)
  const { toast } = useUIStore()
  const { readFile } = useFile()
  const { panes, activePaneId, openFileInPane, addPane } = usePanesStore()

  // Adjust position so menu stays in viewport
  const [pos, setPos] = useState({ x, y })
  useEffect(() => {
    if (!menuRef.current) return
    const rect = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    setPos({
      x: rect.right > vw ? x - rect.width : x,
      y: rect.bottom > vh ? y - rect.height : y,
    })
  }, [x, y])

  // Close on outside click or Escape
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose()
    }
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', keyHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', keyHandler)
    }
  }, [onClose])

  const openInActivePane = useCallback(async () => {
    onClose()
    if (!activePaneId) return
    const content = await readFile(file.path)
    openFileInPane(activePaneId, file.path, file.label, content)
  }, [file, activePaneId, readFile, openFileInPane, onClose])

  const openInNextPane = useCallback(async () => {
    onClose()
    const content = await readFile(file.path)
    addPane(file.path, file.label, content, false)
  }, [file, panes, activePaneId, readFile, addPane, onClose])

  const copyToAgent = useCallback(async (agentRoot: string, agentLabel: string) => {
    onClose()
    try {
      const res = await fetch('/api/skill/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: file.path, destDir: agentRoot + '/skills' }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast(`Copied to ${agentLabel}`, 'success')
    } catch (e: unknown) {
      toast(`Copy failed: ${e instanceof Error ? e.message : String(e)}`, 'error')
    }
  }, [file.path, toast, onClose])

  const moveToAgent = useCallback(async (agentRoot: string, agentLabel: string) => {
    onClose()
    try {
      const res = await fetch('/api/skill/move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: file.path, destDir: agentRoot + '/skills' }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast(`Moved to ${agentLabel}`, 'success')
    } catch (e: unknown) {
      toast(`Move failed: ${e instanceof Error ? e.message : String(e)}`, 'error')
    }
  }, [file.path, toast, onClose])

  const deleteSkill = useCallback(async () => {
    onClose()
    if (!confirm(`Delete skill "${file.label}"?\n${file.path}\n\nThis cannot be undone.`)) return
    try {
      const res = await fetch('/api/skill/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: file.path }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast(`Deleted ${file.label}`, 'success')
    } catch (e: unknown) {
      toast(`Delete failed: ${e instanceof Error ? e.message : String(e)}`, 'error')
    }
  }, [file, toast, onClose])

  // Only show copy/move/delete for skill files (not instructions)
  const isSkill = file.path.includes('/skills/')

  return (
    <div
      ref={menuRef}
      className="ctx-menu"
      style={{ left: pos.x, top: pos.y }}
      onContextMenu={e => e.preventDefault()}
    >
      <div className="ctx-item" onClick={openInActivePane}>
        <span className="ctx-ico">📄</span> Open in active pane
      </div>
      <div className="ctx-item" onClick={openInNextPane}>
        <span className="ctx-ico">➕</span> Open in new pane
      </div>

      {isSkill && (
        <>
          <div className="ctx-sep" />
          <div
            className="ctx-item ctx-has-sub"
            onMouseEnter={() => { setCopySubmenu(true); setMoveSubmenu(false) }}
            onMouseLeave={() => setCopySubmenu(false)}
          >
            <span className="ctx-ico">📋</span> Copy to agent…
            <span className="ctx-arr">▶</span>
            {copySubmenu && (
              <div className="ctx-submenu">
                {agents.map(a => (
                  <div key={a.id} className="ctx-item" onClick={() => copyToAgent(a.root, a.label)}>
                    <span className="ctx-ico">{a.emoji}</span> {a.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div
            className="ctx-item ctx-has-sub"
            onMouseEnter={() => { setMoveSubmenu(true); setCopySubmenu(false) }}
            onMouseLeave={() => setMoveSubmenu(false)}
          >
            <span className="ctx-ico">✂️</span> Move to agent…
            <span className="ctx-arr">▶</span>
            {moveSubmenu && (
              <div className="ctx-submenu">
                {agents.map(a => (
                  <div key={a.id} className="ctx-item" onClick={() => moveToAgent(a.root, a.label)}>
                    <span className="ctx-ico">{a.emoji}</span> {a.label}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="ctx-sep" />
          <div className="ctx-item ctx-danger" onClick={deleteSkill}>
            <span className="ctx-ico">🗑</span> Delete skill…
          </div>
        </>
      )}
    </div>
  )
}
