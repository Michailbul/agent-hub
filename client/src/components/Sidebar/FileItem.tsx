import { useCallback, useState } from 'react'
import type { AgentFile, Agent } from '@/types'
import { usePanesStore } from '@/store/panes'
import { useFile } from '@/hooks/useFile'
import { ContextMenu } from './ContextMenu'

interface FileItemProps {
  file: AgentFile
  activePath: string | null
  agents?: Agent[]
}

export function FileItem({ file, activePath, agents = [] }: FileItemProps) {
  const { activePaneId, openFileInPane } = usePanesStore()
  const { readFile } = useFile()
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null)

  const shortPath = file.path
    .replace(/^\/Users\/[^/]+\/\.openclaw\//, '~/openclaw/')
    .replace(/^\/Users\/[^/]+\/\.agents\//, '~/agents/')
    .replace(/^\/Users\/[^/]+\//, '~/')
    .replace('/root/.openclaw/', '~/openclaw/')
    .replace('/root/.agents/', '~/agents/')
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

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtx({ x: e.clientX, y: e.clientY })
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCtx({ x: e.clientX, y: e.clientY })
  }, [])

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
      {file.source === 'studio' ? '🏠' : file.source === 'community' ? '🌐' : '⚙'}
    </span>
  ) : null

  const agentTargets = agents.map(a => ({ id: a.id, label: a.label, emoji: a.emoji, root: a.root }))

  return (
    <>
      <div
        className={`fi${isActive ? ' active' : ''}`}
        title={file.path}
        data-path={file.path}
        data-source={file.source || ''}
        draggable
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      >
        <div className="fi-inner">
          <span className="fi-name">{file.label}</span>
          <span className="fi-path">{shortPath}</span>
        </div>
        {srcBadge}
        <span className="fi-drag-hint" title="Drag to open side-by-side">⠿</span>
      </div>

      {ctx && (
        <ContextMenu
          file={file}
          x={ctx.x}
          y={ctx.y}
          agents={agentTargets}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  )
}
