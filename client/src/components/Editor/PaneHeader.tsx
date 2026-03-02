import { useCallback } from 'react'

interface PaneHeaderProps {
  paneId: string
  label: string | null
  isDirty: boolean
  hasFile: boolean
  isLocal: boolean
  onSave: () => void
  onClose: () => void
  onHeaderDrop: (data: { path: string; label: string }) => void
}

export function PaneHeader({ label, isDirty, hasFile, isLocal, onSave, onClose, onHeaderDrop }: PaneHeaderProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.classList.add('drop-target')
    }
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      e.currentTarget.classList.remove('drop-target')
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      e.currentTarget.classList.remove('drop-target')
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'))
        if (data.path) onHeaderDrop(data)
      } catch {
        // ignore
      }
    },
    [onHeaderDrop],
  )

  return (
    <div
      className="pane-header"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="pane-tab">
        <span className="pane-name">{label || 'Empty pane'}</span>
        <span className={`pane-dirty${isDirty ? ' show' : ''}`} />
      </div>
      <div className="pane-actions">
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
