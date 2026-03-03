import { useCallback, useRef, useState } from 'react'
import { usePanesStore } from '@/store/panes'
import { useUIStore } from '@/store/ui'
import { Pane } from './Pane'

export function PaneManager() {
  const panes = usePanesStore(s => s.panes)
  const activePaneId = usePanesStore(s => s.activePaneId)
  const insertPaneAt = usePanesStore(s => s.insertPaneAt)
  const openFileInPane = usePanesStore(s => s.openFileInPane)
  const setLoading = usePanesStore(s => s.setLoading)
  const { toast } = useUIStore()
  const paneRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [dragActive, setDragActive] = useState(false)
  const [dropHoverIndex, setDropHoverIndex] = useState<number | null>(null)
  const dragDepthRef = useRef(0)
  const dragState = useRef<{
    startX: number
    leftEl: HTMLElement
    rightEl: HTMLElement
    leftW: number
    rightW: number
    totalWidth: number
  } | null>(null)

  const isFileDnD = useCallback((e: React.DragEvent) => (
    e.dataTransfer.types.includes('text/plain') && !e.dataTransfer.types.includes('pane-reorder')
  ), [])

  const handleDividerMouseDown = useCallback(
    (e: React.MouseEvent, rightIndex: number) => {
      e.preventDefault()
      const leftPane = paneRefs.current[panes[rightIndex - 1].id]
      const rightPane = paneRefs.current[panes[rightIndex].id]
      if (!leftPane || !rightPane) return

      const divider = e.currentTarget as HTMLElement
      divider.classList.add('dragging')
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      dragState.current = {
        startX: e.clientX,
        leftEl: leftPane,
        rightEl: rightPane,
        leftW: leftPane.getBoundingClientRect().width,
        rightW: rightPane.getBoundingClientRect().width,
        totalWidth: leftPane.getBoundingClientRect().width + rightPane.getBoundingClientRect().width,
      }

      const onMove = (ev: MouseEvent) => {
        const s = dragState.current
        if (!s) return
        const dx = ev.clientX - s.startX
        const newLeft = Math.max(200, s.leftW + dx)
        const newRight = Math.max(200, s.rightW - dx)
        if (newLeft >= 200 && newRight >= 200) {
          const leftPct = (newLeft / s.totalWidth) * 100
          const rightPct = (newRight / s.totalWidth) * 100
          s.leftEl.style.flex = `0 0 ${leftPct}%`
          s.rightEl.style.flex = `0 0 ${rightPct}%`
        }
      }

      const onUp = () => {
        divider.classList.remove('dragging')
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        dragState.current = null
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [panes],
  )

  const handleInsertDrop = useCallback(async (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDropHoverIndex(null)
    setDragActive(false)
    dragDepthRef.current = 0
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (!data.path) return
      const newPaneId = insertPaneAt(index)
      if (!newPaneId) {
        toast('Max 4 panes', 'error')
        return
      }
      setLoading(newPaneId, true)
      try {
        const r = await fetch('/api/file?path=' + encodeURIComponent(data.path))
        const content = r.ok ? await r.text() : ''
        openFileInPane(newPaneId, data.path, data.label, content)
      } catch {
        toast('Failed to load file', 'error')
      } finally {
        setLoading(newPaneId, false)
      }
    } catch {
      // ignore malformed drops
    }
  }, [insertPaneAt, openFileInPane, setLoading, toast])

  const handleAreaDragEnter = useCallback((e: React.DragEvent) => {
    if (!isFileDnD(e)) return
    e.preventDefault()
    dragDepthRef.current += 1
    setDragActive(true)
  }, [isFileDnD])

  const handleAreaDragOver = useCallback((e: React.DragEvent) => {
    if (!isFileDnD(e)) return
    e.preventDefault()
  }, [isFileDnD])

  const handleAreaDragLeave = useCallback((e: React.DragEvent) => {
    if (!isFileDnD(e)) return
    e.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setDragActive(false)
      setDropHoverIndex(null)
    }
  }, [isFileDnD])

  const handleAreaDrop = useCallback((e: React.DragEvent) => {
    if (!isFileDnD(e)) return
    dragDepthRef.current = 0
    setDragActive(false)
    setDropHoverIndex(null)
  }, [isFileDnD])

  return (
    <div
      className={`pane-manager${dragActive ? ' drag-active' : ''}`}
      onDragEnter={handleAreaDragEnter}
      onDragOver={handleAreaDragOver}
      onDragLeave={handleAreaDragLeave}
      onDrop={handleAreaDrop}
    >
      {panes.map((pane, i) => (
        <span key={pane.id} style={{ display: 'contents' }}>
          {i > 0 && (
            <>
              <div
                className={`pane-insert-zone${dropHoverIndex === i ? ' drop-hover' : ''}`}
                onDragOver={e => {
                  if (!isFileDnD(e)) return
                  e.preventDefault()
                  e.stopPropagation()
                  setDropHoverIndex(i)
                }}
                onDragLeave={e => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return
                  setDropHoverIndex(prev => (prev === i ? null : prev))
                }}
                onDrop={e => {
                  void handleInsertDrop(e, i)
                }}
              >
                <div className="pane-insert-zone-inner" />
              </div>
              <div
                className="pane-divider"
                onMouseDown={e => handleDividerMouseDown(e, i)}
              />
            </>
          )}
          <Pane
            ref={el => {
              paneRefs.current[pane.id] = el
            }}
            pane={pane}
            isActive={pane.id === activePaneId}
          />
        </span>
      ))}
    </div>
  )
}
