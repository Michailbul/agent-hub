import { useSkillsLabStore, type SkillFile } from '@/store/skillsLab'

function iconForFile(name: string) {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'md') return '◊'
  if (ext === 'json') return '{}'
  if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') return '◆'
  if (ext === 'css') return '◈'
  if (ext === 'yml' || ext === 'yaml') return '≡'
  return '◇'
}

interface SkillFileNodeProps {
  depth: number
  node: SkillFile
  prefix: string
}

function SkillFileNode({ depth, node, prefix }: SkillFileNodeProps) {
  const activeSkillFile = useSkillsLabStore(s => s.activeSkillFile)
  const expandedSkillFolders = useSkillsLabStore(s => s.expandedSkillFolders)
  const toggleSkillFolder = useSkillsLabStore(s => s.toggleSkillFolder)
  const setActiveSkillFile = useSkillsLabStore(s => s.setActiveSkillFile)

  const isFolder = node.type === 'folder'
  const isOpen = expandedSkillFolders.has(node.path)
  const isActive = activeSkillFile === node.path

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
        style={{ paddingLeft: depth * 18 + 12 }}
        onClick={handleClick}
      >
        <span className={`${prefix}-tree-chevron${isFolder ? '' : ' hidden'}${isOpen ? ' open' : ''}`}>
          ›
        </span>
        <span className={`${prefix}-tree-icon${isFolder ? ' folder' : ''}`}>
          {isFolder ? (isOpen ? '📂' : '📁') : iconForFile(node.name)}
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
}

interface SkillFileTreeProps {
  files: SkillFile[]
  prefix?: string
}

export function SkillFileTree({ files, prefix = 'kn' }: SkillFileTreeProps) {
  if (!files.length) {
    return (
      <div className={`${prefix}-tree-empty`}>
        <span className={`${prefix}-tree-empty-icon`}>📭</span>
        <span className={`${prefix}-tree-empty-text`}>No extra files in this skill.</span>
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
