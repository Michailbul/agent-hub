import { forwardRef, useCallback, useState } from 'react'
import { usePanesStore } from '@/store/panes'
import { useUIStore } from '@/store/ui'
import { saveFile } from '@/lib/api'
import { PaneHeader } from './PaneHeader'
import { PaneStatus } from './PaneStatus'
import { CMEditor } from './CMEditor'
import type { PaneState } from '@/types'

interface PaneProps {
  pane: PaneState
  isActive: boolean
}

export const Pane = forwardRef<HTMLDivElement, PaneProps>(function Pane({ pane, isActive }, ref) {
  const { closePane, setActivePane, openFileInPane, insertPaneAfter, setDirty, setLoading } = usePanesStore()
  const { flashSaved, toast } = useUIStore()
  const [cursorLine, setCursorLine] = useState(1)
  const [cursorCol, setCursorCol]   = useState(1)

  const doSave = useCallback(async () => {
    if (!pane.path || pane.isLocal) return
    try {
      // Get latest content directly from store (CMEditor keeps it in sync)
      const content = usePanesStore.getState().panes.find(p => p.id === pane.id)?.content ?? ''
      await saveFile(pane.path, content)
      setDirty(pane.id, false)
      flashSaved()
      toast('Saved', 'success')
    } catch {
      toast('Save failed', 'error')
    }
  }, [pane.id, pane.path, pane.isLocal, setDirty, flashSaved, toast])

  const handleClose     = useCallback(() => closePane(pane.id),    [closePane, pane.id])
  const handleMouseDown = useCallback(() => setActivePane(pane.id), [setActivePane, pane.id])
  const handleCursor    = useCallback((l: number, c: number) => { setCursorLine(l); setCursorCol(c) }, [])

  const handleHeaderDrop = useCallback(async (data: { path: string; label: string }) => {
    const newId = insertPaneAfter(pane.id)
    if (!newId) { toast('Max 4 panes', 'error'); return }
    setLoading(newId, true)
    try {
      const r = await fetch('/api/file?path=' + encodeURIComponent(data.path))
      const content = r.ok ? await r.text() : ''
      openFileInPane(newId, data.path, data.label, content)
    } catch {
      toast('Failed to load file', 'error')
    } finally {
      setLoading(newId, false)
    }
  }, [pane.id, insertPaneAfter, openFileInPane, setLoading, toast])

  const handleContentDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.closest('.pane')?.classList.remove('drag-target')
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.path) {
        setActivePane(pane.id)
        setLoading(pane.id, true)
        const r = await fetch('/api/file?path=' + encodeURIComponent(data.path))
        const content = r.ok ? await r.text() : ''
        openFileInPane(pane.id, data.path, data.label, content)
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(pane.id, false)
    }
  }, [pane.id, setActivePane, openFileInPane, setLoading])

  const handleContentDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault()
      e.currentTarget.closest('.pane')?.classList.add('drag-target')
    }
  }, [])

  const handleContentDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.closest('.pane')?.classList.remove('drag-target')
  }, [])

  const lines = pane.content.split('\n').length
  const words = pane.content.trim() ? pane.content.trim().split(/\s+/).length : 0

  return (
    <div
      ref={ref}
      className={`pane${isActive ? ' active-pane' : ''}`}
      data-id={pane.id}
      onMouseDown={handleMouseDown}
    >
      <PaneHeader
        paneId={pane.id}
        label={pane.label}
        isDirty={pane.isDirty}
        hasFile={!!pane.path}
        isLocal={pane.isLocal}
        onSave={doSave}
        onClose={handleClose}
        onHeaderDrop={handleHeaderDrop}
      />

      <div
        className="pane-cm"
        onDragOver={handleContentDragOver}
        onDragLeave={handleContentDragLeave}
        onDrop={handleContentDrop}
      >
        {/* Empty state — shown when no file is open */}
        {!pane.path && (
          <div className="pane-empty">
            <div className="pe-icon">📄</div>
            <div className="pe-title">Empty pane</div>
            <div className="pe-sub">
              Click a file to open here<br />
              <span style={{ opacity: 0.6 }}>drag here → replace</span><br />
              <span style={{ opacity: 0.6 }}>drag to tab header → new pane</span>
            </div>
          </div>
        )}

        {/* CodeMirror — keyed by path so it remounts cleanly on file change */}
        {pane.path && (
          <CMEditor
            key={pane.path}
            paneId={pane.id}
            initialContent={pane.content}
            filePath={pane.path}
            isLocal={pane.isLocal}
            isLoading={!!pane.isLoading}
            onCursorChange={handleCursor}
          />
        )}
      </div>

      <PaneStatus
        lines={lines}
        words={words}
        cursorLine={cursorLine}
        cursorCol={cursorCol}
      />
    </div>
  )
})
