import { useState, useEffect, useCallback } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { fetchFile } from '@/lib/api'
import type { AgentFile } from '@/types'

interface AgentDocsViewProps {
  agentId: string
}

export function AgentDocsView({ agentId }: AgentDocsViewProps) {
  const data = useCanvasStore(s => s.data)
  const backToCanvas = useCanvasStore(s => s.backToCanvas)
  const onNavigateToFiles = useCanvasStore(s => s.onNavigateToFiles)
  const [activeFile, setActiveFile] = useState<AgentFile | null>(null)
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const agent = data?.agents.find(a => a.id === agentId)
  const files = data?.agentFiles[agentId]

  const sections = files ? [
    { label: 'Instructions', files: files.instructions },
    { label: 'Memory', files: files.memory },
    { label: 'PM', files: files.pm },
  ].filter(s => s.files.length > 0) : []

  // Auto-load first file
  useEffect(() => {
    const firstFile = sections[0]?.files[0]
    if (firstFile && !activeFile) {
      setActiveFile(firstFile)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, files])

  // Load file content when active file changes
  useEffect(() => {
    if (!activeFile) { setContent(null); return }
    let cancelled = false
    setLoading(true)
    fetchFile(activeFile.path)
      .then(text => { if (!cancelled) setContent(text) })
      .catch(() => { if (!cancelled) setContent(null) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [activeFile?.path])

  const handleFileClick = useCallback((file: AgentFile) => {
    setActiveFile(file)
  }, [])

  if (!agent || !files) return null

  return (
    <div className="cv-docs-view">
      {/* Top bar with back + agent info */}
      <div className="cv-docs-topbar">
        <button className="cv-docs-back" onClick={backToCanvas}>
          <span className="cv-docs-back-arrow">&larr;</span>
          Canvas
        </button>
        <div className="cv-docs-agent-info">
          <span className="cv-docs-emoji">{agent.emoji}</span>
          <span className="cv-docs-agent-name">{agent.label}</span>
          <span className="cv-docs-agent-role">{agent.role}</span>
        </div>
        <button
          className="cv-btn-action cv-btn-ghost"
          onClick={() => onNavigateToFiles?.(agentId)}
        >
          Open in Editor
        </button>
      </div>

      {/* File tabs grouped by section */}
      <div className="cv-docs-tabs">
        {sections.map((section, si) => (
          <div key={section.label} className="cv-docs-tab-group">
            {si > 0 && <span className="cv-docs-tab-sep" />}
            <span className="cv-docs-tab-section-label">{section.label}</span>
            {section.files.map(file => (
              <button
                key={file.path}
                className={`cv-docs-tab${activeFile?.path === file.path ? ' active' : ''}`}
                onClick={() => handleFileClick(file)}
              >
                {file.label || file.name}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Document body */}
      <div className="cv-docs-body">
        {loading ? (
          <div className="cv-docs-loading">Loading...</div>
        ) : content ? (
          <pre className="cv-docs-content">{content}</pre>
        ) : activeFile ? (
          <div className="cv-docs-empty">Could not load file</div>
        ) : (
          <div className="cv-docs-empty">Select a file to view</div>
        )}
      </div>

      {/* Status bar */}
      <div className="cv-status-bar">
        <span className="cv-status-text">
          {activeFile ? activeFile.path : 'No file selected'}
        </span>
        <span className="cv-status-text">
          {sections.reduce((n, s) => n + s.files.length, 0)} files
        </span>
      </div>
    </div>
  )
}
