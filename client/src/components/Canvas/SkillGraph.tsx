import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type SimulationNodeDatum, type SimulationLinkDatum,
} from 'd3-force'
import { useCanvasStore } from '@/store/canvas'
import type { PaletteSkill } from '@/types/canvas'

/* ── Department colors (vibrant on dark bg) ── */
const DEPT_COLORS: Record<string, string> = {
  Engineering:      '#6366f1',
  Marketing:        '#f59e0b',
  'Product/Design': '#ec4899',
  Operations:       '#10b981',
  Knowledge:        '#14b8a6',
  Sales:            '#3b82f6',
  Utility:          '#9ca3af',
  Content:          '#a78bfa',
}
const DEFAULT_COLOR = '#9ca3af'
const BG = '#141413'
const DIM = '#2a2a2e'
const LABEL_CLR = 'rgba(227,224,217,0.75)'
const NODE_MIN = 3
const NODE_MAX = 20

/* ── Types ── */
interface GNode extends SimulationNodeDatum {
  id: string; label: string; department: string
  color: string; radius: number; installCount: number
}
interface GLink extends SimulationLinkDatum<GNode> { weight: number }

/* ── Build graph data ── */
function buildGraphData(skills: PaletteSkill[]) {
  const maxI = Math.max(1, ...skills.map(s => s.installedAgentIds.length))
  const nodes: GNode[] = skills.map(s => {
    const n = s.installedAgentIds.length
    return {
      id: s.id, label: s.name, department: s.department,
      color: DEPT_COLORS[s.department] || DEFAULT_COLOR,
      radius: NODE_MIN + (n / maxI) * (NODE_MAX - NODE_MIN),
      installCount: n,
    }
  })

  const a2s = new Map<string, string[]>()
  for (const s of skills)
    for (const a of s.installedAgentIds) {
      let l = a2s.get(a); if (!l) { l = []; a2s.set(a, l) }; l.push(s.id)
    }

  const ew = new Map<string, number>()
  for (const [, ids] of a2s)
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) {
        const k = ids[i] < ids[j] ? `${ids[i]}--${ids[j]}` : `${ids[j]}--${ids[i]}`
        ew.set(k, (ew.get(k) || 0) + 1)
      }

  const ns = new Set(nodes.map(n => n.id))
  const links: GLink[] = []
  for (const [k, w] of ew) {
    const [s, t] = k.split('--')
    if (ns.has(s) && ns.has(t)) links.push({ source: s, target: t, weight: w })
  }
  return { nodes, links }
}

/* ── Main component ── */
export function SkillGraph() {
  const data = useCanvasStore(s => s.data)
  const previewSkill = useCanvasStore(s => s.previewSkill)

  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<GNode[]>([])
  const linksRef = useRef<GLink[]>([])
  const simRef = useRef<ReturnType<typeof forceSimulation<GNode>> | null>(null)
  const dragRef = useRef<{ node: GNode; ox: number; oy: number } | null>(null)
  const panRef = useRef<{ sx: number; sy: number; tx: number; ty: number } | null>(null)
  const txRef = useRef({ x: 0, y: 0, k: 1 })
  const dprRef = useRef(window.devicePixelRatio || 1)

  /* ── Refs for hover/search so render stays stable ── */
  const hoveredRef = useRef<string | null>(null)
  const searchRef = useRef('')
  hoveredRef.current = hovered
  searchRef.current = search

  const paletteSkills = data?.paletteSkills || []
  const gd = useMemo(() => buildGraphData(paletteSkills), [paletteSkills])
  const depts = useMemo(() => [...new Set(paletteSkills.map(s => s.department))].sort(), [paletteSkills])

  const neighborsRef = useRef(new Map<string, Set<string>>())
  useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const l of gd.links) {
      const s = typeof l.source === 'string' ? l.source : (l.source as GNode).id
      const t = typeof l.target === 'string' ? l.target : (l.target as GNode).id
      if (!m.has(s)) m.set(s, new Set()); if (!m.has(t)) m.set(t, new Set())
      m.get(s)!.add(t); m.get(t)!.add(s)
    }
    neighborsRef.current = m
  }, [gd.links])

  /* ── CSS-pixel coords from mouse event ── */
  const cssCoords = useCallback((e: React.MouseEvent) => {
    const c = canvasRef.current
    if (!c) return { x: 0, y: 0 }
    const r = c.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }, [])

  /* ── CSS coords → graph coords ── */
  const toGraph = useCallback((cx: number, cy: number) => {
    const c = canvasRef.current
    if (!c) return { gx: 0, gy: 0 }
    const { x: tx, y: ty, k } = txRef.current
    const midX = c.clientWidth / 2
    const midY = c.clientHeight / 2
    return { gx: (cx - midX - tx) / k, gy: (cy - midY - ty) / k }
  }, [])

  /* ── Hit test in CSS coords ── */
  const hitTest = useCallback((cx: number, cy: number): GNode | null => {
    const { gx, gy } = toGraph(cx, cy)
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i]
      if (n.x == null || n.y == null) continue
      const dx = gx - n.x, dy = gy - n.y
      const hr = Math.max(n.radius, 6)
      if (dx * dx + dy * dy <= hr * hr) return n
    }
    return null
  }, [toGraph])

  /* ── Render (stable — reads hover/search from refs) ── */
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = dprRef.current
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr
      canvas.height = ch * dpr
    }

    const { x: tx, y: ty, k } = txRef.current
    const q = searchRef.current.trim().toLowerCase()
    const isSearching = q.length > 0
    const hov = hoveredRef.current
    const neighbors = neighborsRef.current

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.fillStyle = BG
    ctx.fillRect(0, 0, cw, ch)

    ctx.save()
    ctx.translate(cw / 2 + tx, ch / 2 + ty)
    ctx.scale(k, k)

    const nodes = nodesRef.current
    const links = linksRef.current

    // Active set
    const active = new Set<string>()
    if (isSearching) {
      for (const n of nodes) if (n.label.toLowerCase().includes(q)) active.add(n.id)
    } else if (hov) {
      active.add(hov)
      const nb = neighbors.get(hov)
      if (nb) for (const id of nb) active.add(id)
    }
    const filtered = isSearching || !!hov

    // ── Edges ──
    ctx.lineCap = 'round'
    for (const link of links) {
      const s = link.source as GNode, t = link.target as GNode
      if (s.x == null || s.y == null || t.x == null || t.y == null) continue

      if (filtered) {
        if (hov && !isSearching && active.has(s.id) && active.has(t.id)) {
          ctx.strokeStyle = `rgba(255,255,255,${0.15 + Math.min(link.weight * 0.1, 0.35)})`
          ctx.lineWidth = Math.min(link.weight * 0.8, 3)
        } else continue
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.lineWidth = 0.6
      }
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke()
    }

    // ── Nodes ──
    for (const n of nodes) {
      if (n.x == null || n.y == null) continue
      const isActive = !filtered || active.has(n.id)

      ctx.beginPath()
      ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2)

      if (isActive) {
        ctx.fillStyle = n.color
        if (filtered) { ctx.shadowColor = n.color; ctx.shadowBlur = 12 }
      } else {
        ctx.fillStyle = DIM
        ctx.shadowBlur = 0
      }
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
    }

    // ── Labels ──
    const fontSize = Math.max(9, Math.min(13, 11 / k))
    ctx.font = `${fontSize}px "JetBrains Mono", monospace`
    ctx.textBaseline = 'middle'

    for (const n of nodes) {
      if (n.x == null || n.y == null) continue
      const isActive = !filtered || active.has(n.id)
      if (!isActive) continue

      const show = n.id === hov || (isSearching && active.has(n.id)) || n.radius >= 8
      if (!show) continue

      ctx.fillStyle = LABEL_CLR
      ctx.globalAlpha = n.id === hov ? 1 : 0.65
      ctx.fillText(n.label, n.x + n.radius + 4, n.y)
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }, []) // stable — no deps, reads everything from refs

  /* ── Simulation (uses d3's internal timer — no manual RAF needed) ── */
  useEffect(() => {
    const nodes = gd.nodes.map(n => ({ ...n }))
    const links = gd.links.map(l => ({ ...l }))
    nodesRef.current = nodes
    linksRef.current = links

    const sim = forceSimulation(nodes)
      .force('link', forceLink<GNode, GLink>(links)
        .id(d => d.id)
        .distance(100)
        .strength(l => Math.min(l.weight * 0.25, 0.8))
      )
      .force('charge', forceManyBody().strength(-80).distanceMax(400))
      .force('center', forceCenter(0, 0).strength(0.03))
      .force('collide', forceCollide<GNode>().radius(d => d.radius + 3).strength(0.8))
      .alphaDecay(0.015)
      .velocityDecay(0.35)
      .on('tick', render)

    simRef.current = sim
    return () => { sim.stop() }
  }, [gd, render])

  /* ── Re-render when hover/search changes (without restarting sim) ── */
  useEffect(() => { render() }, [search, hovered, render])

  /* ── Resize ── */
  useEffect(() => {
    const el = containerRef.current, c = canvasRef.current
    if (!el || !c) return
    const obs = new ResizeObserver(() => {
      dprRef.current = window.devicePixelRatio || 1
      const r = el.getBoundingClientRect()
      c.style.width = `${r.width}px`
      c.style.height = `${r.height}px`
      c.width = r.width * dprRef.current
      c.height = r.height * dprRef.current
      render()
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [render])

  /* ── Mouse handlers ── */
  const onMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = cssCoords(e)
    if (dragRef.current) {
      const { node, ox, oy } = dragRef.current
      const { gx, gy } = toGraph(x, y)
      node.fx = gx + ox; node.fy = gy + oy
      simRef.current?.alpha(0.1).restart() // sim's tick handler calls render()
      return
    }
    if (panRef.current) {
      const dx = e.clientX - panRef.current.sx, dy = e.clientY - panRef.current.sy
      txRef.current = { ...txRef.current, x: panRef.current.tx + dx, y: panRef.current.ty + dy }
      render()
      return
    }
    const hit = hitTest(x, y)
    const c = canvasRef.current
    if (hit) { if (c) c.style.cursor = 'pointer'; setHovered(hit.id) }
    else { if (c) c.style.cursor = 'grab'; setHovered(null) }
  }, [cssCoords, toGraph, hitTest, render])

  const onDown = useCallback((e: React.MouseEvent) => {
    const { x, y } = cssCoords(e)
    const hit = hitTest(x, y)
    if (hit) {
      const { gx, gy } = toGraph(x, y)
      dragRef.current = { node: hit, ox: (hit.x ?? 0) - gx, oy: (hit.y ?? 0) - gy }
      hit.fx = hit.x; hit.fy = hit.y
      simRef.current?.alpha(0.3).restart()
    } else {
      panRef.current = { sx: e.clientX, sy: e.clientY, tx: txRef.current.x, ty: txRef.current.y }
    }
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
  }, [cssCoords, hitTest, toGraph])

  const onUp = useCallback(() => {
    if (dragRef.current) {
      dragRef.current.node.fx = null; dragRef.current.node.fy = null
      dragRef.current = null
    }
    panRef.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
  }, [])

  const onClick = useCallback((e: React.MouseEvent) => {
    if (panRef.current || dragRef.current) return
    const { x, y } = cssCoords(e)
    const hit = hitTest(x, y)
    if (hit) previewSkill(hit.id)
  }, [cssCoords, hitTest, previewSkill])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.92 : 1.08
    const { x: mx, y: my } = cssCoords(e)
    const c = canvasRef.current
    if (!c) return
    const t = txRef.current
    const newK = Math.max(0.15, Math.min(6, t.k * factor))
    const midX = c.clientWidth / 2, midY = c.clientHeight / 2
    const wx = mx - midX - t.x, wy = my - midY - t.y
    const r = newK / t.k
    txRef.current = { k: newK, x: t.x - wx * (r - 1), y: t.y - wy * (r - 1) }
    render()
  }, [cssCoords, render])

  if (!data) return null

  return (
    <div className="sg-root" ref={containerRef}>
      <div className="sg-controls">
        <div className="sg-search">
          <input
            className="sg-search-input"
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="sg-legend">
          {depts.map(d => (
            <div key={d} className="sg-legend-item">
              <span className="sg-legend-dot" style={{ background: DEPT_COLORS[d] || DEFAULT_COLOR }} />
              <span className="sg-legend-label">{d}</span>
            </div>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="sg-canvas"
        onMouseMove={onMove}
        onMouseDown={onDown}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onClick={onClick}
        onWheel={onWheel}
      />

      <div className="sg-stats">
        <span className="sg-stats-text">{gd.nodes.length} nodes · {gd.links.length} edges</span>
      </div>
    </div>
  )
}
