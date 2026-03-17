import { memo } from 'react'
import { useSkillsLabStore, type SkillFile } from '@/store/skillsLab'
import { ChevronRight, File, Folder } from 'lucide-react'

interface SkillFileNodeProps {
  depth: number
  node: SkillFile
  prefix: string
}

const SkillFileNode = memo(function SkillFileNode({ depth, node, prefix }: SkillFileNodeProps) {
  const isActive = useSkillsLabStore(s => s.activeSkillFile === node.path)
  const isOpen = useSkillsLabStore(s => s.expandedSkillFolders.has(node.path))
  const toggleSkillFolder = useSkillsLabStore(s => s.toggleSkillFolder)
  const setActiveSkillFile = useSkillsLabStore(s => s.setActiveSkillFile)

  const isFolder = node.type === 'folder'

  const handleClick = () => {
    if (isFolder) {
      toggleSkillFolder(node.path)
      return
    }
    setActiveSkillFile(node.path)
  }

  return (
    <div className={`${prefix}-tree-node`}>
      <button
        className={`${prefix}-tree-row${isActive ? ' active' : ''}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={handleClick}
      >
        {/* Indent guides */}
        {depth > 0 && (
          <span className={`${prefix}-tree-guides`}>
            {Array.from({ length: depth }, (_, i) => (
              <span key={i} className={`${prefix}-tree-guide`} />
            ))}
          </span>
        )}
        <span className={`${prefix}-tree-chevron${isFolder ? '' : ' hidden'}${isOpen ? ' open' : ''}`}>
          <ChevronRight size={11} strokeWidth={1.5} />
        </span>
        <span className={`${prefix}-tree-icon${isFolder ? ' folder' : ''}`}>
          {isFolder ? <Folder size={13} strokeWidth={1.5} /> : <File size={13} strokeWidth={1.5} />}
        </span>
        <span className={`${prefix}-tree-name${isFolder ? ' folder' : ''}`}>{node.name}</span>
      </button>

      {isFolder && isOpen && node.children && node.children.length > 0 && (
        <div className={`${prefix}-tree-children`}>
          {node.children.map(child => (
            <SkillFileNode key={child.path} depth={depth + 1} node={child} prefix={prefix} />
          ))}
        </div>
      )}
    </div>
  )
})

interface SkillFileTreeProps {
  files: SkillFile[]
  prefix?: string
}

export function SkillFileTree({ files, prefix = 'kn' }: SkillFileTreeProps) {
  if (!files.length) {
    return (
      <div className={`${prefix}-tree-empty`}>
        <span className={`${prefix}-tree-empty-text`}>No files</span>
      </div>
    )
  }

  return (
    <div className={`${prefix}-tree`}>
      {files.map(node => (
        <SkillFileNode key={node.path} depth={0} node={node} prefix={prefix} />
      ))}
    </div>
  )
}
