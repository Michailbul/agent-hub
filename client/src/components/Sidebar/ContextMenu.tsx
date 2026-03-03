import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useFile } from '@/hooks/useFile'
import { useUIStore } from '@/store/ui'
import { usePanesStore } from '@/store/panes'
import type { AgentFile, Agent } from '@/types'

interface ContextMenuProps {
  file: AgentFile
  x: number
  y: number
  agents: Array<Pick<Agent, 'id' | 'label' | 'emoji' | 'root'>>
  onClose: () => void
}

function ContextMenuInner({ file, x, y, agents, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [moveOpen, setMoveOpen] = useState(false)
  const [pos, setPos] = useState({ x, y })
  const { toast } = useUIStore()
  const { readFile } = useFile()
  const { activePaneId, openFileInPane, addPane } = usePanesStore()

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

  const openActive = useCallback(async () => {
    onClose()
    if (!activePaneId) return
    const content = await readFile(file.path)
    openFileInPane(activePaneId, file.path, file.label, content)
  }, [file, activePaneId, readFile, openFileInPane, onClose])

  const openNew = useCallback(async () => {
    onClose()
    const content = await readFile(file.path)
    addPane(file.path, file.label, content)
  }, [file, readFile, addPane, onClose])

  const copyTo = useCallback(async (root: string, label: string) => {
    onClose()
    try {
      const r = await fetch('/api/skill/copy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: file.path, destDir: root + '/skills' }),
      })
      if (!r.ok) throw new Error(await r.text())
      toast(`Copied to ${label}`, 'success')
    } catch (e) { toast(`Copy failed: ${e instanceof Error ? e.message : e}`, 'error') }
  }, [file.path, toast, onClose])

  const moveTo = useCallback(async (root: string, label: string) => {
    onClose()
    try {
      const r = await fetch('/api/skill/move', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: file.path, destDir: root + '/skills' }),
      })
      if (!r.ok) throw new Error(await r.text())
      toast(`Moved to ${label}`, 'success')
    } catch (e) { toast(`Move failed: ${e instanceof Error ? e.message : e}`, 'error') }
  }, [file.path, toast, onClose])

  const deleteSkill = useCallback(async () => {
    onClose()
    if (!confirm(`Delete "${file.label}"?\n\nThis cannot be undone.`)) return
    try {
      const r = await fetch('/api/skill/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src: file.path }),
      })
      if (!r.ok) throw new Error(await r.text())
      toast(`Deleted ${file.label}`, 'success')
    } catch (e) { toast(`Delete failed: ${e instanceof Error ? e.message : e}`, 'error') }
  }, [file, toast, onClose])

  const isSkill = file.path.includes('/skills/')

  return (
    <div ref={menuRef} className="ctx" style={{ left: pos.x, top: pos.y }} onContextMenu={e => e.preventDefault()}>
      {/* File name header */}
      <div className="ctx-header">
        <span className="ctx-fname">{file.label}</span>
      </div>
      <div className="ctx-sep" />

      <button className="ctx-row" onClick={openActive}>
        <span className="ctx-icon">📄</span>
        <span>Open in active pane</span>
      </button>
      <button className="ctx-row" onClick={openNew}>
        <span className="ctx-icon">⊞</span>
        <span>Open in new pane</span>
      </button>

      {isSkill && (
        <>
          <div className="ctx-sep" />

          {/* Copy submenu */}
          <div
            className={`ctx-row ctx-submenu-trigger${copyOpen ? ' open' : ''}`}
            onMouseEnter={() => { setCopyOpen(true); setMoveOpen(false) }}
            onMouseLeave={() => setCopyOpen(false)}
          >
            <span className="ctx-icon">📋</span>
            <span>Copy to agent</span>
            <span className="ctx-chevron">&rarr;</span>
            {copyOpen && (
              <div className="ctx-sub">
                {agents.map(a => (
                  <button key={a.id} className="ctx-row" onClick={() => copyTo(a.root, a.label)}>
                    <span className="ctx-icon">{a.emoji}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Move submenu */}
          <div
            className={`ctx-row ctx-submenu-trigger${moveOpen ? ' open' : ''}`}
            onMouseEnter={() => { setMoveOpen(true); setCopyOpen(false) }}
            onMouseLeave={() => setMoveOpen(false)}
          >
            <span className="ctx-icon">✂️</span>
            <span>Move to agent</span>
            <span className="ctx-chevron">&rarr;</span>
            {moveOpen && (
              <div className="ctx-sub">
                {agents.map(a => (
                  <button key={a.id} className="ctx-row" onClick={() => moveTo(a.root, a.label)}>
                    <span className="ctx-icon">{a.emoji}</span>
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ctx-sep" />
          <button className="ctx-row ctx-delete" onClick={deleteSkill}>
            <span className="ctx-icon">🗑</span>
            <span>Delete skill</span>
          </button>
        </>
      )}
    </div>
  )
}

export function ContextMenu(props: ContextMenuProps) {
  return createPortal(<ContextMenuInner {...props} />, document.body)
}
