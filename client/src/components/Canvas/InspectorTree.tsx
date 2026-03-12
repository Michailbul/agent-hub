import { useState, useMemo, useCallback } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { useCronsStore } from '@/store/crons'
import type { AgentFile } from '@/types'
import type { InspectorActiveItem } from '@/types/canvas'

/* ── Adapted FileTree node types ── */

interface FTNode {
  id: string
  name: string
  type: 'file' | 'folder'
  icon?: string            // section emoji icon
  extension?: string       // file extension for icon coloring
  children?: FTNode[]
  // Data payloads for click handling
  itemKind?: 'file' | 'skill' | 'skill-file' | 'cron'
  path?: string
  skillId?: string
  skillPath?: string
  sublabel?: string
  removable?: boolean
  // Skill folder that can lazy-load children
  lazySkillId?: string
  lazyVariantPath?: string
  // Section-level extras
  sectionAction?: { label: string; activeLabel: string; isActive: boolean; onClick: () => void }
}

/* ── Icon helper ── */

const EXT_ICONS: Record<string, { color: string; glyph: string }> = {
  md:   { color: 'var(--cv-text-ghost)',     glyph: '◊' },
  json: { color: '#c49060',                  glyph: '{}' },
  ts:   { color: '#3178c6',                  glyph: '◆' },
  tsx:  { color: '#3178c6',                  glyph: '⚛' },
  js:   { color: '#e8d44d',                  glyph: '◆' },
  py:   { color: '#3572a5',                  glyph: '◆' },
  css:  { color: '#663399',                  glyph: '◈' },
  svg:  { color: '#0f7b6c',                  glyph: '◐' },
  png:  { color: '#0f7b6c',                  glyph: '◑' },
}
const DEFAULT_ICON = { color: 'var(--cv-text-ghost)', glyph: '◇' }

function getExtIcon(ext?: string) {
  return ext ? (EXT_ICONS[ext] || DEFAULT_ICON) : DEFAULT_ICON
}

function extOf(name: string | undefined): string | undefined {
  if (!name) return undefined
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1) : undefined
}

/* ── Single tree item renderer ── */

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
  const [hovered, setHovered] = useState(false)
  const isFolder = node.type === 'folder'
  const ext = node.extension || extOf(node.name)
  const icon = getExtIcon(ext)
  const open = isExpanded ?? false

  return (
    <div className="ft-node">
      <div
        className={`ft-row${isActive ? ' ft-active' : ''}${hovered ? ' ft-hovered' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => isFolder && !node.lazySkillId ? onToggleExpand?.() : onSelect(node)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Tree line */}
        {depth > 0 && (
          <div
            className={`ft-line${hovered ? ' ft-line-hl' : ''}`}
            style={{ left: `${(depth - 1) * 16 + 16}px` }}
          />
        )}

        {/* Chevron / file icon */}
        <div className={`ft-indicator${isFolder && open ? ' ft-rotated' : ''}`}>
          {isFolder ? (
            <svg width="6" height="8" viewBox="0 0 6 8" fill="none">
              <path d="M1 1L5 4L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="ft-file-glyph" style={{ color: icon.color }}>{icon.glyph}</span>
          )}
        </div>

        {/* Folder/file shape icon */}
        <div className={`ft-shape${hovered ? ' ft-shape-hl' : ''}`}>
          {isFolder ? (
            <svg width="14" height="12" viewBox="0 0 16 14" fill="currentColor" style={{ color: 'var(--cv-folder-icon)' }}>
              <path d="M1.5 1C0.671573 1 0 1.67157 0 2.5V11.5C0 12.3284 0.671573 13 1.5 13H14.5C15.3284 13 16 12.3284 16 11.5V4.5C16 3.67157 15.3284 3 14.5 3H8L6.5 1H1.5Z" />
            </svg>
          ) : (
            <svg width="12" height="14" viewBox="0 0 14 16" fill="currentColor" style={{ color: icon.color, opacity: 0.7 }}>
              <path d="M1.5 0C0.671573 0 0 0.671573 0 1.5V14.5C0 15.3284 0.671573 16 1.5 16H12.5C13.3284 16 14 15.3284 14 14.5V4.5L9.5 0H1.5Z" />
              <path d="M9 0V4.5H14" fill="currentColor" fillOpacity="0.5" />
            </svg>
          )}
        </div>

        {/* Name */}
        <span className={`ft-name${isFolder ? '' : ' ft-name-file'}`}>{node.name}</span>

        {/* Badges / actions */}
        {node.sublabel && <span className="ft-badge">{node.sublabel}</span>}
        {node.removable && node.skillId && (
          <span className="ft-remove" onClick={(e) => { e.stopPropagation(); onRemove?.(e, node.skillId!) }} title="Remove">✕</span>
        )}

        {/* Section action (+ Add / Close) */}
        {node.sectionAction && (
          <span
            className={`ft-section-action${node.sectionAction.isActive ? ' ft-section-action-active' : ''}`}
            onClick={(e) => { e.stopPropagation(); node.sectionAction!.onClick() }}
          >
            {node.sectionAction.isActive ? node.sectionAction.activeLabel : node.sectionAction.label}
          </span>
        )}

        {/* Hover dot */}
        <div className={`ft-dot${hovered ? ' ft-dot-show' : ''}`} />
      </div>

      {/* Children */}
      {childrenNodes && (
        <div className={`ft-children${open ? ' ft-children-open' : ''}`}>
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
  const cronJobs = useCronsStore(s => s.jobs)
  const skillDirFiles = useCanvasStore(s => s.skillDirFiles)
  const skillDirExpanded = useCanvasStore(s => s.skillDirExpanded)
  const toggleSkillDir = useCanvasStore(s => s.toggleSkillDir)

  const agent = data?.agents.find(a => a.id === agentId)
  const files = data?.agentFiles[agentId]

  // Build tree data
  const sections = useMemo((): FTNode[] => {
    if (!agent || !files) return []
    const result: FTNode[] = []

    const mkFile = (f: AgentFile): FTNode => {
      const displayName = f.label || f.name || f.path?.split('/').pop() || 'unknown'
      return {
        id: f.path,
        name: displayName,
        type: 'file',
        extension: extOf(f.name || f.label || ''),
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
        id: 'identity', name: 'Identity', type: 'folder', icon: '\uD83C\uDFAD',
        children: [mkFile(identityFile)],
      })
    }

    // Instructions
    const instructionFiles = files.instructions.filter(f => f !== identityFile)
    if (instructionFiles.length > 0) {
      result.push({
        id: 'instructions', name: 'Instructions', type: 'folder', icon: '\uD83D\uDCCB',
        children: instructionFiles.map(mkFile),
      })
    }

    // Memory
    if (files.memory.length > 0) {
      result.push({
        id: 'memory', name: 'Memory', type: 'folder', icon: '\uD83E\uDDE0',
        children: files.memory.map(mkFile),
      })
    }

    // PM
    if (files.pm.length > 0) {
      result.push({
        id: 'pm', name: 'PM Docs', type: 'folder', icon: '\uD83D\uDCC1',
        children: files.pm.map(mkFile),
      })
    }

    // Skills
    const enrichedSkills = agent.skills.map(s => {
      const palette = data!.paletteSkills.find(p => p.id === s.id)
      return { ...s, department: palette?.department || 'Utility', variantPath: palette?.variantPath || '' }
    })
    result.push({
      id: 'skills', name: 'Skills', type: 'folder', icon: '\u26A1',
      sectionAction: { label: '+ Add', activeLabel: 'Close', isActive: browserOpen, onClick: toggleBrowser },
      children: enrichedSkills.map(s => ({
        id: s.id,
        name: s.name,
        type: 'file' as const,
        extension: 'md',
        itemKind: 'skill' as const,
        skillId: s.id,
        skillPath: s.variantPath,
        sublabel: s.department,
        removable: true,
        // If skill has a variantPath, it's expandable
        lazySkillId: s.variantPath ? s.id : undefined,
        lazyVariantPath: s.variantPath || undefined,
      })),
    })

    // Crons
    const agentCrons = cronJobs.filter(c => c.agentId === agentId)
    if (agentCrons.length > 0) {
      result.push({
        id: 'crons', name: 'Cron Jobs', type: 'folder', icon: '\u23F0',
        children: agentCrons.map(c => ({
          id: c.id,
          name: c.name,
          type: 'file' as const,
          itemKind: 'cron' as const,
          sublabel: c.schedule.expr || `every ${Math.round((c.schedule.everyMs || 0) / 60000)}m`,
        })),
      })
    }

    return result
  }, [agent, files, data, cronJobs, agentId, browserOpen, toggleBrowser])

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

  // Render a section (top-level folder)
  function renderSection(section: FTNode) {
    const isCollapsed = inspectorCollapsed.has(section.id)
    const childCount = section.children?.length || 0
    return (
      <FTItem
        key={section.id}
        node={{ ...section, name: `${section.icon || ''} ${section.name}`, sublabel: String(childCount) }}
        depth={0}
        isActive={false}
        onSelect={() => {}}
        isExpanded={!isCollapsed}
        onToggleExpand={() => toggleInspectorSection(section.id)}
        childrenNodes={!isCollapsed ? renderChildren(section.children || [], 1) : undefined}
      />
    )
  }

  // Render children at a given depth
  function renderChildren(nodes: FTNode[], depth: number): React.ReactNode {
    return nodes.map(node => {
      // Skill nodes: can expand to show lazy-loaded skill dir files
      if (node.lazySkillId && node.lazyVariantPath) {
        const isExp = skillDirExpanded.has(node.lazySkillId)
        const dirFiles = skillDirFiles[node.lazySkillId] || []

        const skillFileNodes: FTNode[] = dirFiles.map(f => ({
          id: f.path,
          name: f.name,
          type: 'file' as const,
          extension: extOf(f.name),
          itemKind: 'skill-file' as const,
          skillId: node.lazySkillId!,
          path: f.path,
        }))

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
            childrenNodes={isExp && skillFileNodes.length > 0 ? (
              skillFileNodes.map(sf => (
                <FTItem
                  key={sf.id}
                  node={sf}
                  depth={depth + 1}
                  isActive={isNodeActive(sf)}
                  onSelect={handleSelect}
                />
              ))
            ) : undefined}
          />
        )
      }

      // Regular file nodes
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
      <div className="ft-tree">
        {sections.map(renderSection)}
      </div>
    </div>
  )
}
