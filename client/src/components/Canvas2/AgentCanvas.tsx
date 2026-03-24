import { useCallback, useMemo, useEffect, useState } from 'react'
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
        return { ...skill, department: palette?.pillarName || palette?.department || 'Utility', variantPath: palette?.variantPath || '' }
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

  const initialEdges = useMemo((): Edge[] => {
    if (!data) return []
    const edges: Edge[] = []
    for (const agent of data.agents) {
      for (const subId of agent.subagents) {
        if (data.agents.some(a => a.id === subId)) {
          edges.push({
            id: `${agent.id}-${subId}`,
            source: agent.id,
            target: subId,
            type: 'default',
            animated: false,
            style: { stroke: 'oklch(0.82 0 0)', strokeWidth: 1.5 },
          })
        }
      }
    }
    return edges
  }, [data])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(prev => {
      const posMap = new Map(prev.map(n => [n.id, n.position]))
      return initialNodes.map(n => ({
        ...n,
        position: posMap.get(n.id) || n.position,
      }))
    })
  }, [initialNodes, setNodes])

  const handleNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChange(changes)
    const positionChanges = changes.filter(c => c.type === 'position' && 'position' in c && c.position)
    if (positionChanges.length > 0) {
      requestAnimationFrame(() => {
        const positions: Record<string, { x: number; y: number }> = {}
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
    <div className="cv2-flow-wrap">
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
      style={{ background: 'oklch(0.97 0 0)' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={0.8}
        color="oklch(0.72 0 0 / 0.2)"
      />
      <Controls
        showInteractive={false}
      />
      <MiniMap
        nodeColor={(node) => {
          const d = node.data as unknown as AgentNodeData
          return d?.isSelected ? 'oklch(0.13 0 0 / 0.5)' : 'oklch(0.13 0 0 / 0.12)'
        }}
        maskColor="oklch(0.99 0 0 / 0.8)"
        style={{ background: 'oklch(0.99 0 0)', border: '1px solid oklch(0.82 0 0)', borderRadius: '6px', boxShadow: '0 1px 3px oklch(0 0 0 / 0.08)' }}
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
    </div>
  )
}

export function AgentCanvas() {
  return (
    <ReactFlowProvider>
      <AgentCanvasInner />
    </ReactFlowProvider>
  )
}
