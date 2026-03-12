import { create } from 'zustand'
import type { CanvasData, PaletteSkill, AgentSkillPill, AgentFiles, SidePanelMode, InspectorActiveItem, SkillDirFile } from '@/types/canvas'
import type { TreeData } from '@/types'
import { fetchFile, saveFile } from '@/lib/api'

type CanvasTheme = 'default' | 'zinc' | 'stone' | 'neutral'

interface CanvasStore {
  data: CanvasData | null
  loading: boolean
  error: string | null
  selectedAgentId: string | null
  dropTargetAgentId: string | null
  onNavigateToFiles: ((agentId: string) => void) | null
  activeTags: Set<string>
  allTags: string[]
  canvasTheme: CanvasTheme

  // Panel state
  browserOpen: boolean
  sidePanelMode: SidePanelMode
  previewSkillId: string | null
  agentSkillFilter: Set<string>

  // Inspector state
  inspectorActiveItem: InspectorActiveItem
  inspectorCollapsed: Set<string>
  inspectorFileContent: string | null
  inspectorFileLoading: boolean
  inspectorEditContent: string | null
  inspectorFileDirty: boolean
  skillDirFiles: Record<string, SkillDirFile[]>  // skillId -> files in skill dir
  skillDirExpanded: Set<string>  // expanded skill IDs

  // Actions
  loadData: () => Promise<void>
  setSelectedAgent: (id: string | null) => void
  setDropTargetAgent: (id: string | null) => void
  setOnNavigateToFiles: (cb: ((agentId: string) => void) | null) => void
  assignSkill: (agentId: string, variantPath: string) => Promise<void>
  unassignSkill: (agentId: string, skillId: string) => Promise<void>
  toggleTag: (tag: string) => void
  clearTags: () => void
  toggleBrowser: () => void
  setSidePanelMode: (mode: SidePanelMode) => void
  closeSidePanel: () => void
  previewSkill: (skillId: string | null) => void
  toggleAgentSkillFilter: (tag: string) => void
  clearAgentSkillFilter: () => void
  setCanvasTheme: (theme: CanvasTheme) => void

  // Inspector actions
  openInspector: (agentId: string) => void
  openInspectorToSkills: (agentId: string) => void
  openInspectorAndBrowser: (agentId: string) => void
  closeInspector: () => void
  setInspectorItem: (item: InspectorActiveItem) => void
  toggleInspectorSection: (sectionId: string) => void
  loadInspectorFile: (path: string) => Promise<void>
  saveInspectorFile: () => Promise<void>
  startEditing: () => void
  cancelEditing: () => void
  setInspectorEditContent: (content: string) => void
  toggleSkillDir: (skillId: string, variantPath: string) => void
  loadSkillDirFiles: (skillId: string, dirPath: string) => Promise<void>

  // Legacy redirects
  enterAgentDocs: (agentId: string) => void
  backToCanvas: () => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  selectedAgentId: null,
  dropTargetAgentId: null,
  onNavigateToFiles: null,
  activeTags: new Set(),
  allTags: [],
  canvasTheme: 'default' as CanvasTheme,
  browserOpen: false,
  sidePanelMode: null,
  previewSkillId: null,
  agentSkillFilter: new Set(),

  // Inspector defaults
  inspectorActiveItem: null,
  inspectorCollapsed: new Set(),
  inspectorFileContent: null,
  inspectorFileLoading: false,
  inspectorEditContent: null,
  inspectorFileDirty: false,
  skillDirFiles: {},
  skillDirExpanded: new Set(),

  loadData: async () => {
    set({ loading: true, error: null })
    try {
      const [canvasRes, skillsRes, treeRes] = await Promise.all([
        fetch('/api/canvas/data'),
        fetch('/api/skills/index'),
        fetch('/api/tree'),
      ])
      if (!canvasRes.ok) throw new Error('Failed to load canvas data')
      if (!skillsRes.ok) throw new Error('Failed to load skills index')
      if (!treeRes.ok) throw new Error('Failed to load tree data')

      const rawCanvas = await canvasRes.json()
      const skillsIndex = await skillsRes.json()
      const treeData: TreeData = await treeRes.json()

      // Build palette skills from skills-index
      const paletteSkills: PaletteSkill[] = (skillsIndex.skills || []).map((s: any) => ({
        id: s.id,
        name: s.name,
        summary: s.summary || '',
        variantPath: s.variants?.[0]?.path || '',
        installedAgentIds: s.installedAgentIds || [],
        department: s.grouping?.department || 'Utility',
        purpose: s.grouping?.purpose || '',
      }))

      // Build unique tags from departments
      const allTags = [...new Set(paletteSkills.map(s => s.department))].sort()

      // Enrich each agent's skills from the skills-index installedAgentIds
      const agents = rawCanvas.agents.map((agent: any) => {
        const enrichedSkills: AgentSkillPill[] = (skillsIndex.skills || [])
          .filter((s: any) => (s.installedAgentIds || []).includes(agent.id))
          .map((s: any) => ({ id: s.id, name: s.name }))
        return {
          ...agent,
          skills: enrichedSkills,
          skillCount: enrichedSkills.length,
        }
      })

      // Build agent files map from tree data
      const agentFiles: Record<string, AgentFiles> = {}
      for (const treeAgent of treeData.agents || []) {
        agentFiles[treeAgent.id] = {
          instructions: treeAgent.instructions || [],
          memory: treeAgent.memory || [],
          pm: treeAgent.pm || [],
        }
      }

      const data: CanvasData = {
        ...rawCanvas,
        agents,
        paletteSkills,
        agentFiles,
      }

      // Auto-select first agent if none selected
      const currentSelected = get().selectedAgentId
      const hasSelected = currentSelected && data.agents.some(a => a.id === currentSelected)
      const selectedAgentId = hasSelected ? currentSelected : (data.agents[0]?.id || null)

      set({ data, loading: false, allTags, selectedAgentId })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Unknown error', loading: false })
    }
  },

  setSelectedAgent: (id) => set({
    selectedAgentId: id,
    agentSkillFilter: new Set(),
    previewSkillId: null,
  }),

  setDropTargetAgent: (id) => set({ dropTargetAgentId: id }),

  setOnNavigateToFiles: (cb) => set({ onNavigateToFiles: cb }),

  assignSkill: async (agentId, variantPath) => {
    const res = await fetch('/api/skills/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, variantPath }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Assign failed')
    }
    await get().loadData()
  },

  unassignSkill: async (agentId, skillId) => {
    const res = await fetch('/api/skills/unassign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, skillId }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Unassign failed')
    }
    await get().loadData()
  },

  toggleTag: (tag) => set(s => {
    const next = new Set(s.activeTags)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    return { activeTags: next }
  }),

  clearTags: () => set({ activeTags: new Set() }),

  toggleBrowser: () => set(s => ({ browserOpen: !s.browserOpen })),

  setSidePanelMode: (mode) => set({ sidePanelMode: mode }),

  closeSidePanel: () => set({ sidePanelMode: null, previewSkillId: null }),

  previewSkill: (skillId) => set({
    previewSkillId: skillId,
    sidePanelMode: skillId ? { kind: 'skill-preview', skillId } : null,
  }),

  toggleAgentSkillFilter: (tag) => set(s => {
    const next = new Set(s.agentSkillFilter)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    return { agentSkillFilter: next }
  }),

  clearAgentSkillFilter: () => set({ agentSkillFilter: new Set() }),

  setCanvasTheme: (theme) => set({ canvasTheme: theme }),

  // ── Inspector actions ──

  openInspector: (agentId) => set({
    sidePanelMode: { kind: 'agent-inspector', agentId },
    selectedAgentId: agentId,
    inspectorActiveItem: null,
    inspectorFileContent: null,
    inspectorEditContent: null,
    inspectorFileDirty: false,
    inspectorFileLoading: false,
    previewSkillId: null,
  }),

  openInspectorToSkills: (agentId) => set(s => {
    // Open inspector and ensure skills section is expanded (not collapsed)
    const next = new Set(s.inspectorCollapsed)
    next.delete('skills')
    return {
      sidePanelMode: { kind: 'agent-inspector', agentId },
      selectedAgentId: agentId,
      inspectorActiveItem: null,
      inspectorFileContent: null,
      inspectorEditContent: null,
      inspectorFileDirty: false,
      inspectorFileLoading: false,
      previewSkillId: null,
      inspectorCollapsed: next,
    }
  }),

  openInspectorAndBrowser: (agentId) => set(s => {
    // Open inspector with skills visible + open the skill browser
    const next = new Set(s.inspectorCollapsed)
    next.delete('skills')
    return {
      sidePanelMode: { kind: 'agent-inspector', agentId },
      selectedAgentId: agentId,
      inspectorActiveItem: null,
      inspectorFileContent: null,
      inspectorEditContent: null,
      inspectorFileDirty: false,
      inspectorFileLoading: false,
      previewSkillId: null,
      inspectorCollapsed: next,
      browserOpen: true,
    }
  }),

  closeInspector: () => set({
    sidePanelMode: null,
    inspectorActiveItem: null,
    inspectorFileContent: null,
    inspectorEditContent: null,
    inspectorFileDirty: false,
    inspectorFileLoading: false,
  }),

  setInspectorItem: (item) => {
    set({
      inspectorActiveItem: item,
      inspectorEditContent: null,
      inspectorFileDirty: false,
    })
    if (item?.kind === 'file') {
      void get().loadInspectorFile(item.path)
    } else if (item?.kind === 'skill') {
      void get().loadInspectorFile(item.skillPath)
    } else if (item?.kind === 'skill-file') {
      void get().loadInspectorFile(item.path)
    }
  },

  toggleInspectorSection: (sectionId) => set(s => {
    const next = new Set(s.inspectorCollapsed)
    if (next.has(sectionId)) next.delete(sectionId)
    else next.add(sectionId)
    return { inspectorCollapsed: next }
  }),

  loadInspectorFile: async (path) => {
    set({ inspectorFileLoading: true, inspectorFileContent: null, inspectorEditContent: null })
    try {
      const content = await fetchFile(path)
      set({ inspectorFileContent: content, inspectorFileLoading: false, inspectorEditContent: content })
    } catch {
      set({ inspectorFileContent: null, inspectorFileLoading: false, inspectorEditContent: null })
    }
  },

  saveInspectorFile: async () => {
    const { inspectorActiveItem, inspectorEditContent } = get()
    if (!inspectorActiveItem || inspectorEditContent === null) return
    let path: string
    if (inspectorActiveItem.kind === 'file') {
      path = inspectorActiveItem.path
    } else if (inspectorActiveItem.kind === 'skill') {
      path = inspectorActiveItem.skillPath
    } else if (inspectorActiveItem.kind === 'skill-file') {
      path = inspectorActiveItem.path
    } else {
      return
    }
    try {
      await saveFile(path, inspectorEditContent)
      set({
        inspectorFileContent: inspectorEditContent,
        inspectorEditContent: null,
        inspectorFileDirty: false,
      })
    } catch (err) {
      console.error('Save failed:', err)
    }
  },

  startEditing: () => set(s => ({
    inspectorEditContent: s.inspectorFileContent || '',
  })),

  cancelEditing: () => set({
    inspectorEditContent: null,
    inspectorFileDirty: false,
  }),

  setInspectorEditContent: (content) => set({
    inspectorEditContent: content,
    inspectorFileDirty: true,
  }),

  toggleSkillDir: (skillId, variantPath) => {
    const s = get()
    const next = new Set(s.skillDirExpanded)
    if (next.has(skillId)) {
      next.delete(skillId)
      set({ skillDirExpanded: next })
    } else {
      next.add(skillId)
      set({ skillDirExpanded: next })
      // Load files if not already loaded
      if (!s.skillDirFiles[skillId]) {
        // variantPath points to SKILL.md, get its parent directory
        const skillDir = variantPath.endsWith('/SKILL.md')
          ? variantPath.slice(0, -'/SKILL.md'.length)
          : variantPath.replace(/\/[^/]+$/, '')
        void get().loadSkillDirFiles(skillId, skillDir)
      }
    }
  },

  loadSkillDirFiles: async (skillId, dirPath) => {
    try {
      const res = await fetch(`/api/dir?path=${encodeURIComponent(dirPath)}`)
      if (!res.ok) return
      const data = await res.json()
      // Filter out SKILL.md and hidden files, but keep directories
      const topFiles = (data.files || []).filter((f: any) =>
        f.name !== 'SKILL.md' && !f.name.startsWith('.') && !f.name.startsWith('_')
      )

      // For each subdirectory, fetch its contents and flatten
      const allFiles: SkillDirFile[] = []
      for (const f of topFiles) {
        if (f.isDir) {
          try {
            const subRes = await fetch(`/api/dir?path=${encodeURIComponent(f.path)}`)
            if (subRes.ok) {
              const subData = await subRes.json()
              const subFiles = (subData.files || []).filter((sf: any) =>
                !sf.isDir && !sf.name.startsWith('.') && !sf.name.startsWith('_')
              )
              for (const sf of subFiles) {
                allFiles.push({ name: `${f.name}/${sf.name}`, path: sf.path, isDir: false })
              }
            }
          } catch { /* skip */ }
        } else {
          allFiles.push(f)
        }
      }
      set(s => ({ skillDirFiles: { ...s.skillDirFiles, [skillId]: allFiles } }))
    } catch { /* ignore */ }
  },

  // Legacy redirects
  enterAgentDocs: (agentId) => {
    get().openInspector(agentId)
  },

  backToCanvas: () => {
    get().closeInspector()
  },
}))
