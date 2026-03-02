import { useCallback } from 'react'
import type { AgentFile } from '@/types'
import { usePanesStore } from '@/store/panes'
import { useFile } from '@/hooks/useFile'

interface FileItemProps {
  file: AgentFile
  activePath: string | null
}

export function FileItem({ file, activePath }: FileItemProps) {
  const { activePaneId, openFileInPane } = usePanesStore()
  const { readFile } = useFile()

  const shortPath = file.path
    .replace('/root/.openclaw/', '~/')
    .replace('/root/.agents/', '~a/')
    .replace('/root/work/laniameda/laniameda-hq/', '~/hq/')

  const handleClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!activePaneId) return
      const content = await readFile(file.path)
      openFileInPane(activePaneId, file.path, file.label, content)
    },
    [activePaneId, file.path, file.label, openFileInPane, readFile],
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', JSON.stringify({ path: file.path, label: file.label }))
      e.dataTransfer.effectAllowed = 'copy'
    },
    [file.path, file.label],
  )

  const isActive = activePath === file.path
  const srcBadge = file.source ? (
    <span className={`src-badge src-${file.source}`}>
      {file.source === 'studio' ? '\uD83C\uDFE0' : file.source === 'community' ? '\uD83C\uDF10' : '\u2699'}
    </span>
  ) : null

  return (
    <div
      className={`fi${isActive ? ' active' : ''}`}
      title={file.path}
      data-path={file.path}
      data-source={file.source || ''}
      draggable
      onClick={handleClick}
      onDragStart={handleDragStart}
    >
      <div className="fi-inner">
        <span className="fi-name">{file.label}</span>
        <span className="fi-path">{shortPath}</span>
      </div>
      {srcBadge}
      <span className="fi-drag-hint" title="Drag to open side-by-side">
        \u2807
      </span>
    </div>
  )
}
