import { useHQStore } from '@/store/hq'
import type { HQFileNode } from '@/types/hq'

/* ── File-type icon map ── */
const EXT_ICONS: Record<string, { char: string; color: string }> = {
  md:   { char: '◊', color: 'var(--text-tertiary)' },
  json: { char: '{}', color: '#b45309' },
  txt:  { char: '≡', color: 'var(--text-ghost)' },
  ts:   { char: '◆', color: '#2563eb' },
  tsx:  { char: '⚛', color: '#2563eb' },
  js:   { char: '◆', color: '#b45309' },
  css:  { char: '◈', color: '#7c3aed' },
  yaml: { char: '≡', color: '#2d6a3f' },
  yml:  { char: '≡', color: '#2d6a3f' },
  sh:   { char: '$', color: '#7a5c2e' },
}

function getIcon(ext?: string) {
  return EXT_ICONS[ext || ''] || { char: '◇', color: 'var(--text-ghost)' }
}

interface FileNodeProps {
  node: HQFileNode
  depth: number
}

function FileNodeItem({ node, depth }: FileNodeProps) {
  const { activeFilePath, expandedFolders, toggleFolder, loadFile } = useHQStore()
  const isFolder = node.type === 'folder'
  const isOpen = expandedFolders.has(node.path)
  const isActive = activeFilePath === node.path
  const icon = getIcon(node.extension)

  const handleClick = () => {
    if (isFolder) {
      toggleFolder(node.path)
    } else {
      loadFile(node.path)
    }
  }

  return (
    <div className="hq-tree-node">
      <button
        className={`hq-tree-row${isActive ? ' active' : ''}`}
        style={{ paddingLeft: depth * 18 + 10 }}
        onClick={handleClick}
      >
        {/* Expand chevron or file icon */}
        <span className={`hq-tree-chevron${isFolder ? '' : ' hidden'}${isOpen ? ' open' : ''}`}>
          ›
        </span>
        <span className="hq-tree-icon" style={{ color: isFolder ? 'var(--coral)' : icon.color }}>
          {isFolder ? (isOpen ? '📂' : '📁') : icon.char}
        </span>
        <span className={`hq-tree-name${isFolder ? ' folder' : ''}`}>
          {node.name}
        </span>
        {isFolder && node.children && (
          <span className="hq-tree-count">{node.children.length}</span>
        )}
      </button>

      {/* Children */}
      {isFolder && isOpen && node.children && (
        <div className="hq-tree-children">
          {node.children.map(child => (
            <FileNodeItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

interface HQFileTreeProps {
  files: HQFileNode[]
  className?: string
}

export function HQFileTree({ files, className = '' }: HQFileTreeProps) {
  const { activeSourceId } = useHQStore()

  if (!activeSourceId) {
    return (
      <div className={`hq-tree-empty ${className}`}>
        <span className="hq-tree-empty-icon">📂</span>
        <span className="hq-tree-empty-text">Select a source to browse files</span>
      </div>
    )
  }

  if (!files.length) {
    return (
      <div className={`hq-tree-empty ${className}`}>
        <span className="hq-tree-empty-icon">📭</span>
        <span className="hq-tree-empty-text">This folder is empty</span>
      </div>
    )
  }

  return (
    <div className={`hq-tree ${className}`}>
      {files.map(node => (
        <FileNodeItem key={node.path} node={node} depth={0} />
      ))}
    </div>
  )
}
