import { useCallback } from 'react'
import { useHQStore } from '@/store/hq'

interface HQEditorProps {
  className?: string
}

export function HQEditor({ className = '' }: HQEditorProps) {
  const { activeFilePath, fileContent, isDirty, setFileContent, save } = useHQStore()

  const fileName = activeFilePath?.split('/').pop() || null
  const dirPath = activeFilePath
    ? activeFilePath.split('/').slice(0, -1).join('/')
    : null

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      save()
    }
  }, [save])

  if (!activeFilePath) {
    return (
      <div className={`hq-editor-empty ${className}`}>
        <div className="hq-editor-empty-inner">
          <span className="hq-editor-empty-icon">✎</span>
          <span className="hq-editor-empty-title">No file selected</span>
          <span className="hq-editor-empty-sub">
            Choose a file from the tree to start editing
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`hq-editor ${className}`}>
      {/* Breadcrumb header */}
      <div className="hq-editor-header">
        <div className="hq-editor-breadcrumb">
          {dirPath && <span className="hq-editor-dir">{dirPath}/</span>}
          <span className="hq-editor-filename">{fileName}</span>
        </div>
        <div className="hq-editor-actions">
          {isDirty && (
            <span className="hq-editor-dirty-dot" title="Unsaved changes" />
          )}
          <button
            className={`hq-editor-save${isDirty ? ' show' : ''}`}
            onClick={save}
            disabled={!isDirty}
          >
            ↑ Save
          </button>
        </div>
      </div>

      {/* The document */}
      <div className="hq-editor-scroll">
        <div className="hq-editor-page">
          <textarea
            className="hq-editor-textarea"
            value={fileContent}
            onChange={e => setFileContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}
