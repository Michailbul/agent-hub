import { useCallback, useMemo, useEffect, useState } from 'react'
import { useThemeStore } from '@/store/theme'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnNodesChange,
  type NodeMouseHandler,
  type Viewport,
  ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useCanvasStore } from '@/store/canvas'
import { useUIStore } from '@/store/ui'
import { AgentNode, type AgentNodeData } from './AgentNode'
import { SkillContextMenu } from './SkillContextMenu'

const nodeTypes = { agent: AgentNode }

const STORAGE_KEY = 'agent-hub-canvas-layout'
const NODE_SPACING_X = 260
const NODE_SPACING_Y = 220

function loadPositions(): Record<string, { x: number; y: number }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed.positions || {}
    }
  } catch { /* ignore */ }
  return {}
}

function loadViewport(): Viewport | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.viewport) return parsed.viewport
    }
  } catch { /* ignore */ }
  return null
}

function saveLayout(positions: Record<string, { x: number; y: number }>, viewport?: Viewport) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...existing,
      positions,
      viewport: viewport || existing.viewport,
    }))
  } catch { /* ignore */ }
}

function autoLayout(agentCount: number, index: number): { x: number; y: number } {
  const cols = Math.max(2, Math.ceil(Math.sqrt(agentCount)))
  const row = Math.floor(index / cols)
  const col = index % cols
  return { x: col * NODE_SPACING_X + 50, y: row * NODE_SPACING_Y + 50 }
}

function AgentCanvasInner() {
  const theme = useThemeStore(s => s.theme)
  const isDark = theme === 'dark'
  const data = useCanvasStore(s => s.data)
  const selectedAgentId = useCanvasStore(s => s.selectedAgentId)
  const inspectorActiveItem = useCanvasStore(s => s.inspectorActiveItem)
  const previewSkill = useCanvasStore(s => s.previewSkill)
  const openInspector = useCanvasStore(s => s.openInspector)
  const openInspectorToSkills = useCanvasStore(s => s.openInspectorToSkills)
  const openInspectorAndBrowser = useCanvasStore(s => s.openInspectorAndBrowser)
  const dropTargetAgentId = useCanvasStore(s => s.dropTargetAgentId)
  const setDropTargetAgent = useCanvasStore(s => s.setDropTargetAgent)
  const assignSkill = useCanvasStore(s => s.assignSkill)
  const unassignSkill = useCanvasStore(s => s.unassignSkill)
  const deleteAgent = useCanvasStore(s => s.deleteAgent)
  const deletingAgentId = useCanvasStore(s => s.deletingAgentId)
  const toast = useUIStore(s => s.toast)

  // Context menu state
  const [ctxMenu, setCtxMenu] = useState<{ skillId: string; variantPath: string; x: number; y: number } | null>(null)

  const handleDeleteAgent = useCallback(async (agentId: string, label: string) => {
    const confirmed = window.confirm(
      `Delete agent "${label}"?\n\nThis permanently removes its workspace, installed skills, cron jobs, and OpenClaw config references.`,
    )
    if (!confirmed) return

    try {
      await deleteAgent(agentId)
      toast(`Deleted ${label}`, 'success')
    } catch (err) {
      toast(`Delete failed: ${err instanceof Error ? err.message : err}`, 'error')
    }
  }, [deleteAgent, toast])

  // Build nodes
  const initialNodes = useMemo((): Node[] => {
    if (!data) return []
    const saved = loadPositions()
    const activeSkillId = inspectorActiveItem?.kind === 'skill' || inspectorActiveItem?.kind === 'skill-file'
      ? inspectorActiveItem.skillId
      : null
    return data.agents.map((agent, i) => {
      const pos = saved[agent.id] || autoLayout(data.agents.length, i)
      const skills = agent.skills.slice(0, 10).map(skill => {
        const palette = data.paletteSkills.find(p => p.id === skill.id)
        return { ...skill, department: palette?.department || 'Utility', variantPath: palette?.variantPath || '' }
      })
      const subagentLabels = agent.subagents
        .map(subId => data.agents.find(a => a.id === subId)?.label)
        .filter(Boolean) as string[]

      return {
        id: agent.id,
        type: 'agent',
        position: pos,
        data: {
          agentId: agent.id,
          label: agent.label,
          emoji: agent.emoji,
          role: agent.role,
          skills,
          activeSkillId: agent.id === selectedAgentId ? activeSkillId : null,
          skillCount: agent.skillCount,
          subagentLabels,
          isSelected: agent.id === selectedAgentId,
          isDropTarget: agent.id === dropTargetAgentId,
          isDeleting: agent.id === deletingAgentId,
          onSelect: (id: string) => { openInspector(id) },
          onOpenInspector: (id: string) => { openInspector(id) },
          onOpenSkills: (id: string) => { openInspectorToSkills(id) },
          onAddSkill: (id: string) => { openInspectorAndBrowser(id) },
          onDeleteAgent: (id: string, label: string) => {
            void handleDeleteAgent(id, label)
          },
          onPreviewSkill: (skillId: string) => previewSkill(skillId),
          onRemoveSkill: (agentId: string, skillId: string) => {
            void unassignSkill(agentId, skillId).catch(err => {
              console.error('Skill unassign failed:', err)
            })
          },
          onSkillContextMenu: (e: React.MouseEvent, skillId: string, variantPath: string) => {
            e.preventDefault()
            e.stopPropagation()
            setCtxMenu({ skillId, variantPath, x: e.clientX, y: e.clientY })
          },
          onDragOver: (e: React.DragEvent, agentId: string) => {
            if (!e.dataTransfer.types.includes('application/x-canvas-skill')) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            setDropTargetAgent(agentId)
          },
          onDragLeave: () => setDropTargetAgent(null),
          onDrop: async (e: React.DragEvent, agentId: string) => {
            e.preventDefault()
            setDropTargetAgent(null)
            const raw = e.dataTransfer.getData('application/x-canvas-skill')
            if (!raw) return
            try {
              const { variantPath } = JSON.parse(raw)
              await assignSkill(agentId, variantPath)
            } catch (err) {
              console.error('Skill assign failed:', err)
            }
          },
        } satisfies AgentNodeData,
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, selectedAgentId, inspectorActiveItem, dropTargetAgentId, deletingAgentId, openInspector, openInspectorAndBrowser, openInspectorToSkills, handleDeleteAgent, previewSkill, setDropTargetAgent, assignSkill, unassignSkill])

  const initialEdges = useMemo((): Edge[] => [], [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // Sync when initialNodes changes (selection, drop target)
  useEffect(() => {
    setNodes(prev => {
      // Preserve positions from current nodes
      const posMap = new Map(prev.map(n => [n.id, n.position]))
      return initialNodes.map(n => ({
        ...n,
        position: posMap.get(n.id) || n.position,
      }))
    })
  }, [initialNodes, setNodes])

  // Save positions on node drag
  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes)
    // Debounced save on position changes
    const positionChanges = changes.filter(c => c.type === 'position' && 'position' in c && c.position)
    if (positionChanges.length > 0) {
      // Save after a tick to get updated positions
      requestAnimationFrame(() => {
        const positions: Record<string, { x: number; y: number }> = {}
        // Save from the store directly via setNodes callback
        setNodes(prev => {
          for (const n of prev) {
            positions[n.id] = n.position
          }
          saveLayout(positions)
          return prev
        })
      })
    }
  }, [onNodesChange, setNodes])

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    openInspector(node.id)
  }, [openInspector])

  const handleViewportChange = useCallback((_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    // Debounce viewport saves
    const positions: Record<string, { x: number; y: number }> = {}
    setNodes(prev => {
      for (const n of prev) positions[n.id] = n.position
      return prev
    })
    saveLayout(positions, viewport)
  }, [setNodes])

  const savedViewport = useMemo(() => loadViewport(), [])

  if (!data) return null

  return (
    <>
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={handleNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onMoveEnd={handleViewportChange}
      nodeTypes={nodeTypes}
      defaultViewport={savedViewport || { x: 0, y: 0, zoom: 1 }}
      fitView={!savedViewport}
      fitViewOptions={{ padding: 0.3, maxZoom: 1 }}
      minZoom={0.3}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      className="cv-flow"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={0.8}
        color={isDark ? 'rgba(255,255,255,.04)' : 'rgba(55,53,47,.1)'}
      />
      <Controls
        className="cv-flow-controls"
        showInteractive={false}
      />
      <MiniMap
        className="cv-flow-minimap"
        nodeColor={(node) => {
          const d = node.data as unknown as AgentNodeData
          if (d?.isSelected) return isDark ? 'rgba(224,128,96,.5)' : 'rgba(35,131,226,.5)'
          return isDark ? 'rgba(255,255,255,.10)' : 'rgba(55,53,47,.12)'
        }}
        maskColor={isDark ? 'rgba(28,28,30,.85)' : 'rgba(247,246,243,.8)'}
        style={isDark
          ? { background: '#232220', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 6 }
          : { background: '#fff', border: '1px solid rgba(55,53,47,.06)', borderRadius: 6 }
        }
      />
    </ReactFlow>
    {ctxMenu && (
      <SkillContextMenu
        skillId={ctxMenu.skillId}
        variantPath={ctxMenu.variantPath}
        x={ctxMenu.x}
        y={ctxMenu.y}
        onClose={() => setCtxMenu(null)}
      />
    )}
    </>
  )
}

export function AgentCanvas() {
  return (
    <ReactFlowProvider>
      <AgentCanvasInner />
    </ReactFlowProvider>
  )
}
