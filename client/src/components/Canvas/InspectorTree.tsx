import { useState, useMemo, useCallback } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { ChevronRight, File, Folder, Zap, Brain, ClipboardList, FileText, Theater } from 'lucide-react'
import type { AgentFile } from '@/types'
import type { InspectorActiveItem } from '@/types/canvas'

/* ── Tree node type ── */

interface FTNode {
  id: string
  name: string
  type: 'file' | 'folder'
  icon?: React.ReactNode
  children?: FTNode[]
  itemKind?: 'file' | 'skill' | 'skill-file'
  path?: string
  skillId?: string
  skillPath?: string
  sublabel?: string
  removable?: boolean
  lazySkillId?: string
  lazyVariantPath?: string
  sectionAction?: { label: string; activeLabel: string; isActive: boolean; onClick: () => void }
}

/* ── Single tree row ── */

const p = 'st' // reuse Skills Lab tree class prefix

interface FTItemProps {
  node: FTNode
  depth: number
  isActive: boolean
  onSelect: (node: FTNode) => void
  onRemove?: (e: React.MouseEvent, skillId: string) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
  childrenNodes?: React.ReactNode
}

function FTItem({ node, depth, isActive, onSelect, onRemove, isExpanded, onToggleExpand, childrenNodes }: FTItemProps) {
  const isFolder = node.type === 'folder'
  const open = isExpanded ?? false

  return (
    <div className={`${p}-tree-node`}>
      <button
        className={`${p}-tree-row${isActive ? ' active' : ''}${node.removable ? ' removable' : ''}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => {
          if (node.lazySkillId) {
            onToggleExpand?.()
            onSelect(node)
          } else if (isFolder) {
            onToggleExpand?.()
          } else {
            onSelect(node)
          }
        }}
      >
        {/* Indent guides */}
        {depth > 0 && (
          <span className={`${p}-tree-guides`}>
            {Array.from({ length: depth }, (_, i) => (
              <span key={i} className={`${p}-tree-guide`} />
            ))}
          </span>
        )}

        {/* Chevron */}
        <span className={`${p}-tree-chevron${isFolder ? '' : ' hidden'}${open ? ' open' : ''}`}>
          <ChevronRight size={11} strokeWidth={1.5} />
        </span>

        {/* Icon */}
        <span className={`${p}-tree-icon${isFolder ? ' folder' : ''}`}>
          {node.icon || (isFolder ? <Folder size={13} strokeWidth={1.5} /> : <File size={13} strokeWidth={1.5} />)}
        </span>

        {/* Name */}
        <span className={`${p}-tree-name${isFolder ? ' folder' : ''}`}>{node.name}</span>

        {/* Badge */}
        {node.sublabel && <span className="cv-ft-badge">{node.sublabel}</span>}

        {/* Remove button for skills */}
        {node.removable && node.skillId && (
          <span
            role="button"
            tabIndex={0}
            className="cv-ft-remove"
            onClick={(e) => { e.stopPropagation(); onRemove?.(e as any, node.skillId!) }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onRemove?.(e as any, node.skillId!) } }}
            title={`Remove ${node.name}`}
            aria-label={`Remove ${node.name}`}
          >
            ✕
          </span>
        )}

        {/* Section action */}
        {node.sectionAction && (
          <span
            className={`cv-ft-section-action${node.sectionAction.isActive ? ' active' : ''}`}
            onClick={(e) => { e.stopPropagation(); node.sectionAction!.onClick() }}
          >
            {node.sectionAction.isActive ? node.sectionAction.activeLabel : node.sectionAction.label}
          </span>
        )}
      </button>

      {/* Children */}
      {childrenNodes && open && (
        <div className={`${p}-tree-children`}>
          {childrenNodes}
        </div>
      )}
    </div>
  )
}

/* ── Main InspectorTree ── */

interface InspectorTreeProps {
  agentId: string
}

export function InspectorTree({ agentId }: InspectorTreeProps) {
  const data = useCanvasStore(s => s.data)
  const inspectorActiveItem = useCanvasStore(s => s.inspectorActiveItem)
  const inspectorCollapsed = useCanvasStore(s => s.inspectorCollapsed)
  const setInspectorItem = useCanvasStore(s => s.setInspectorItem)
  const toggleInspectorSection = useCanvasStore(s => s.toggleInspectorSection)
  const unassignSkill = useCanvasStore(s => s.unassignSkill)
  const toggleBrowser = useCanvasStore(s => s.toggleBrowser)
  const browserOpen = useCanvasStore(s => s.browserOpen)
  const skillDirFiles = useCanvasStore(s => s.skillDirFiles)
  const skillDirExpanded = useCanvasStore(s => s.skillDirExpanded)
  const toggleSkillDir = useCanvasStore(s => s.toggleSkillDir)

  const agent = data?.agents.find(a => a.id === agentId)
  const files = data?.agentFiles[agentId]

  const sections = useMemo((): FTNode[] => {
    if (!agent || !files) return []
    const result: FTNode[] = []

    const mkFile = (f: AgentFile): FTNode => {
      const displayName = f.label || f.name || f.path?.split('/').pop() || 'unknown'
      return {
        id: f.path,
        name: displayName,
        type: 'file',
        itemKind: 'file',
        path: f.path,
      }
    }

    // Identity
    const identityFile = files.instructions.find(f =>
      f.name === 'IDENTITY.md' || f.label === 'IDENTITY.md' || f.path?.endsWith('/IDENTITY.md')
    )
    if (identityFile) {
      result.push({
        id: 'identity', name: 'Identity', type: 'folder',
        icon: <Theater size={13} strokeWidth={1.5} />,
        children: [mkFile(identityFile)],
      })
    }

    // Instructions
    const instructionFiles = files.instructions.filter(f => f !== identityFile)
    if (instructionFiles.length > 0) {
      result.push({
        id: 'instructions', name: 'Instructions', type: 'folder',
        icon: <ClipboardList size={13} strokeWidth={1.5} />,
        children: instructionFiles.map(mkFile),
      })
    }

    // Memory
    if (files.memory.length > 0) {
      result.push({
        id: 'memory', name: 'Memory', type: 'folder',
        icon: <Brain size={13} strokeWidth={1.5} />,
        children: files.memory.map(mkFile),
      })
    }

    // PM
    if (files.pm.length > 0) {
      result.push({
        id: 'pm', name: 'PM Docs', type: 'folder',
        icon: <FileText size={13} strokeWidth={1.5} />,
        children: files.pm.map(mkFile),
      })
    }

    // Skills
    const enrichedSkills = agent.skills.map(s => {
      const palette = data!.paletteSkills.find(ps => ps.id === s.id)
      return { ...s, department: palette?.pillarName || palette?.department || 'Utility', variantPath: palette?.variantPath || '' }
    })
    result.push({
      id: 'skills', name: 'Skills', type: 'folder',
      icon: <Zap size={13} strokeWidth={1.5} />,
      sectionAction: { label: '+ Add', activeLabel: 'Close', isActive: browserOpen, onClick: toggleBrowser },
      children: enrichedSkills.map(s => ({
        id: s.id,
        name: s.name,
        type: 'folder' as const,
        itemKind: 'skill' as const,
        skillId: s.id,
        skillPath: s.variantPath,
        sublabel: s.department,
        removable: true,
        lazySkillId: s.variantPath ? s.id : undefined,
        lazyVariantPath: s.variantPath || undefined,
      })),
    })

    return result
  }, [agent, files, data, agentId, browserOpen, toggleBrowser])

  const isNodeActive = useCallback((node: FTNode): boolean => {
    if (!inspectorActiveItem) return false
    if (node.itemKind === 'file' && inspectorActiveItem.kind === 'file')
      return inspectorActiveItem.path === node.path
    if (node.itemKind === 'skill' && inspectorActiveItem.kind === 'skill')
      return inspectorActiveItem.skillId === node.skillId
    if (node.itemKind === 'skill-file' && inspectorActiveItem.kind === 'skill-file')
      return inspectorActiveItem.path === node.path
    return false
  }, [inspectorActiveItem])

  const handleSelect = useCallback((node: FTNode) => {
    let item: InspectorActiveItem = null
    if (node.itemKind === 'file' && node.path) {
      item = { kind: 'file', path: node.path }
    } else if (node.itemKind === 'skill' && node.skillId && node.skillPath) {
      item = { kind: 'skill', skillId: node.skillId, skillPath: node.skillPath }
    } else if (node.itemKind === 'skill-file' && node.skillId && node.path) {
      item = { kind: 'skill-file', skillId: node.skillId, path: node.path }
    }
    if (item) setInspectorItem(item)
  }, [setInspectorItem])

  const handleRemove = useCallback(async (_e: React.MouseEvent, skillId: string) => {
    try { await unassignSkill(agentId, skillId) } catch { /* */ }
  }, [unassignSkill, agentId])

  function renderSection(section: FTNode) {
    const isCollapsed = inspectorCollapsed.has(section.id)
    const childCount = section.children?.length || 0
    return (
      <FTItem
        key={section.id}
        node={{ ...section, sublabel: String(childCount) }}
        depth={0}
        isActive={false}
        onSelect={() => {}}
        isExpanded={!isCollapsed}
        onToggleExpand={() => toggleInspectorSection(section.id)}
        childrenNodes={renderChildren(section.children || [], 1)}
      />
    )
  }

  function renderChildren(nodes: FTNode[], depth: number): React.ReactNode {
    return nodes.map(node => {
      if (node.lazySkillId && node.lazyVariantPath) {
        const isExp = skillDirExpanded.has(node.lazySkillId)
        const dirFiles = skillDirFiles[node.lazySkillId] || []

        const skillMdNode: FTNode = {
          id: `${node.lazySkillId}__skill-md`,
          name: 'SKILL.md',
          type: 'file' as const,
          itemKind: 'skill' as const,
          skillId: node.lazySkillId!,
          skillPath: node.lazyVariantPath!,
        }

        const otherFileNodes: FTNode[] = dirFiles.map(f => ({
          id: f.path,
          name: f.name,
          type: 'file' as const,
          itemKind: 'skill-file' as const,
          skillId: node.lazySkillId!,
          path: f.path,
        }))

        const allChildren = [skillMdNode, ...otherFileNodes]

        return (
          <FTItem
            key={node.id}
            node={node}
            depth={depth}
            isActive={isNodeActive(node)}
            onSelect={handleSelect}
            onRemove={handleRemove}
            isExpanded={isExp}
            onToggleExpand={() => toggleSkillDir(node.lazySkillId!, node.lazyVariantPath!)}
            childrenNodes={
              allChildren.map(sf => (
                <FTItem
                  key={sf.id}
                  node={sf}
                  depth={depth + 1}
                  isActive={isNodeActive(sf)}
                  onSelect={handleSelect}
                />
              ))
            }
          />
        )
      }

      return (
        <FTItem
          key={node.id}
          node={node}
          depth={depth}
          isActive={isNodeActive(node)}
          onSelect={handleSelect}
          onRemove={handleRemove}
        />
      )
    })
  }

  return (
    <div className="cv-inspector-tree">
      <div className={`${p}-tree`}>
        {sections.map(renderSection)}
      </div>
    </div>
  )
}
