import { useCallback, useState } from 'react'
import { usePanesStore } from '@/store/panes'

interface PaneHeaderProps {
  paneId: string
  label: string | null
  isDirty: boolean
  hasFile: boolean
  isLocal: boolean
  isMarkdownFile: boolean
  mdMode: 'rich' | 'markdown'
  onModeChange: (mode: 'rich' | 'markdown') => void
  onSave: () => void
  onClose: () => void
  onHeaderDrop: (data: { path: string; label: string }) => void
}

export function PaneHeader({
  paneId,
  label,
  isDirty,
  hasFile,
  isLocal,
  isMarkdownFile,
  mdMode,
  onModeChange,
  onSave,
  onClose,
  onHeaderDrop,
}: PaneHeaderProps) {
  const reorderPane = usePanesStore(s => s.reorderPane)
  const [reorderTarget, setReorderTarget] = useState<'before' | 'after' | null>(null)

  const getDropSide = useCallback((e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return e.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('pane-reorder')) {
      e.preventDefault()
      e.stopPropagation()
      setReorderTarget(getDropSide(e))
      return
    }
    if (e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.classList.add('drop-target')
    }
  }, [getDropSide])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      e.currentTarget.classList.remove('drop-target')
      setReorderTarget(null)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.classList.remove('drop-target')
      const draggedPaneId = e.dataTransfer.getData('pane-reorder')
      if (draggedPaneId) {
        reorderPane(draggedPaneId, paneId)
        setReorderTarget(null)
        return
      }
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'))
        if (data.path) onHeaderDrop(data)
      } catch {
        // ignore
      }
      setReorderTarget(null)
    },
    [onHeaderDrop, paneId, reorderPane],
  )

  const handleTabDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('pane-reorder', paneId)
    e.dataTransfer.effectAllowed = 'move'
    const ghost = document.createElement('div')
    ghost.className = 'pane-tab-drag-ghost'
    ghost.textContent = label || 'Empty pane'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 16, 10)
    requestAnimationFrame(() => {
      document.body.removeChild(ghost)
    })
  }, [paneId, label])

  const handleTabDragEnd = useCallback(() => {
    setReorderTarget(null)
  }, [])

  return (
    <div
      className={`pane-header${reorderTarget ? ` reorder-target-${reorderTarget}` : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="pane-tab" draggable onDragStart={handleTabDragStart} onDragEnd={handleTabDragEnd}>
        <span className="pane-name">{label || 'Empty pane'}</span>
        <span className={`pane-dirty${isDirty ? ' show' : ''}`} />
      </div>
      <div className="pane-actions">
        {isMarkdownFile && (
          <div className="pane-mode-toggle" role="tablist" aria-label="Markdown mode">
            <button
              className={`pane-mode-btn${mdMode === 'rich' ? ' active' : ''}`}
              onClick={() => onModeChange('rich')}
              role="tab"
              aria-selected={mdMode === 'rich'}
            >
              Rich
            </button>
            <button
              className={`pane-mode-btn${mdMode === 'markdown' ? ' active' : ''}`}
              onClick={() => onModeChange('markdown')}
              role="tab"
              aria-selected={mdMode === 'markdown'}
            >
              Markdown
            </button>
          </div>
        )}
        {hasFile && !isLocal && (
          <button className="pane-save show" onClick={onSave}>
            ↑ Save
          </button>
        )}
        <button className="pane-close" onClick={onClose} title="Close pane">
          ✕
        </button>
      </div>
    </div>
  )
}
