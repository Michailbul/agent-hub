import { create } from 'zustand'
import type { CanvasData, PaletteSkill, AgentSkillPill, AgentFiles, SidePanelMode, InspectorActiveItem, SkillDirFile } from '@/types/canvas'
import type { TreeData } from '@/types'
import { fetchFile, saveFile, fetchEmbeddingsStatus, queryEmbeddings, type SemanticSearchResult } from '@/lib/api'
import { getSkillDirectoryPath } from '@/lib/skillPaths'

type CanvasTheme = 'default' | 'zinc' | 'stone' | 'neutral'

interface CanvasStore {
  data: CanvasData | null
  loading: boolean
  error: string | null
  deletingAgentId: string | null
  selectedAgentId: string | null
  dropTargetAgentId: string | null
  onNavigateToFiles: ((agentId: string) => void) | null
  activeTags: Set<string>
  allTags: string[]
  canvasTheme: CanvasTheme
  canvasViewMode: 'agents' | 'skill-graph'

  // Panel state
  browserOpen: boolean
  sidePanelMode: SidePanelMode
  previewSkillId: string | null
  agentSkillFilter: Set<string>
  sourceFilter: 'all' | 'own' | 'library'

  // Inspector state
  inspectorActiveItem: InspectorActiveItem
  inspectorCollapsed: Set<string>
  inspectorFileContent: string | null
  inspectorFileLoading: boolean
  inspectorEditContent: string | null
  inspectorFileDirty: boolean
  skillDirFiles: Record<string, SkillDirFile[]>  // skillId -> files in skill dir
  skillDirExpanded: Set<string>  // expanded skill IDs

  // Browser inline expansion
  browserExpandedSkillId: string | null

  // Semantic search
  hasEmbeddings: boolean
  semanticResults: SemanticSearchResult[] | null
  semanticLoading: boolean

  // Actions
  loadData: () => Promise<void>
  setSelectedAgent: (id: string | null) => void
  setDropTargetAgent: (id: string | null) => void
  setOnNavigateToFiles: (cb: ((agentId: string) => void) | null) => void
  assignSkill: (agentId: string, variantPath: string) => Promise<void>
  unassignSkill: (agentId: string, skillId: string) => Promise<void>
  deleteAgent: (agentId: string) => Promise<void>
  updateSkillTag: (skillId: string, department: string) => Promise<void>
  setSourceFilter: (filter: 'all' | 'own' | 'library') => void
  toggleTag: (tag: string) => void
  clearTags: () => void
  toggleBrowser: () => void
  setSidePanelMode: (mode: SidePanelMode) => void
  closeSidePanel: () => void
  previewSkill: (skillId: string | null) => void
  toggleAgentSkillFilter: (tag: string) => void
  clearAgentSkillFilter: () => void
  setCanvasTheme: (theme: CanvasTheme) => void
  setCanvasViewMode: (mode: 'agents' | 'skill-graph') => void

  // Inspector actions
  openInspector: (agentId: string) => void
  openInspectorToSkills: (agentId: string) => void
  openInspectorAndBrowser: (agentId: string) => void
  editSkillInInspector: (agentId: string, skillId: string, skillPath: string) => void
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
  expandBrowserSkill: (skillId: string | null) => void
  semanticSearch: (query: string) => Promise<void>
  clearSemanticResults: () => void

  // Legacy redirects
  enterAgentDocs: (agentId: string) => void
  backToCanvas: () => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  data: null,
  loading: false,
  error: null,
  deletingAgentId: null,
  selectedAgentId: null,
  dropTargetAgentId: null,
  onNavigateToFiles: null,
  activeTags: new Set(),
  allTags: [],
  canvasTheme: 'default' as CanvasTheme,
  canvasViewMode: 'agents' as const,
  browserOpen: false,
  sidePanelMode: null,
  previewSkillId: null,
  agentSkillFilter: new Set(),
  sourceFilter: 'all' as const,

  // Inspector defaults
  inspectorActiveItem: null,
  inspectorCollapsed: new Set(),
  inspectorFileContent: null,
  inspectorFileLoading: false,
  inspectorEditContent: null,
  inspectorFileDirty: false,
  skillDirFiles: {},
  skillDirExpanded: new Set(),
  browserExpandedSkillId: null,
  hasEmbeddings: false,
  semanticResults: null,
  semanticLoading: false,

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

      // Build pillar lookup from index
      const pillarLookup = new Map<string, { name: string; color: string; emoji: string }>()
      for (const p of (skillsIndex.pillars || [])) {
        pillarLookup.set(p.id, { name: p.name, color: p.color, emoji: p.emoji })
      }

      // Build palette skills from skills-index
      const paletteSkills: PaletteSkill[] = (skillsIndex.skills || []).map((s: any) => {
        const pref = s.variants?.[0]
        const pillarId = s.pillar || 'utility'
        const pillarMeta = pillarLookup.get(pillarId) || { name: 'Utility', color: '#94a3b8', emoji: 'wrench' }
        return {
          id: s.id,
          name: s.name,
          summary: s.summary || '',
          variantPath: pref?.path || '',
          installedAgentIds: s.installedAgentIds || [],
          department: s.grouping?.department || 'Utility',
          purpose: s.grouping?.purpose || '',
          pillar: pillarId,
          pillarName: pillarMeta.name,
          pillarColor: pillarMeta.color,
          pillarEmoji: pillarMeta.emoji,
          sourceKind: pref?.kind || 'library',
          sourceLabel: pref?.sourceLabel || '',
          isInMaster: s.isInMaster ?? false,
        }
      })

      // Build unique tags from pillar names (replaces purpose-based tags)
      const allTags = [...new Set(paletteSkills.map(s => s.pillarName).filter(Boolean))].sort()

      // Check embeddings availability
      const embStatus = await fetchEmbeddingsStatus().catch(() => ({ hasEmbeddings: false }))
      const hasEmbeddings = embStatus.hasEmbeddings

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

      set({ data, loading: false, allTags, selectedAgentId, hasEmbeddings })
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

  deleteAgent: async (agentId) => {
    set({ deletingAgentId: agentId })
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Agent delete failed')
      }

      set(s => ({
        browserOpen: s.selectedAgentId === agentId ? false : s.browserOpen,
        sidePanelMode: s.sidePanelMode?.kind === 'agent-inspector' && s.sidePanelMode.agentId === agentId
          ? null
          : s.sidePanelMode,
        inspectorActiveItem: null,
        inspectorFileContent: null,
        inspectorEditContent: null,
        inspectorFileDirty: false,
        inspectorFileLoading: false,
        previewSkillId: null,
      }))

      await get().loadData()
      window.dispatchEvent(new Event('agent-hub:data-changed'))
    } finally {
      set({ deletingAgentId: null })
    }
  },

  updateSkillTag: async (skillId, department) => {
    const res = await fetch('/api/skill/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, department }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Tag update failed')
    }
    await get().loadData()
  },

  setSourceFilter: (filter) => set({ sourceFilter: filter }),

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

  previewSkill: (skillId) => {
    if (!skillId) {
      set({ previewSkillId: null })
      return
    }
    const s = get()
    const skill = s.data?.paletteSkills.find(p => p.id === skillId)
    const agentId = s.selectedAgentId
    // If an agent is selected, show skill within the inspector panel
    if (agentId && skill?.variantPath) {
      const collapsed = new Set(s.inspectorCollapsed)
      collapsed.delete('skills')
      set({
        previewSkillId: skillId,
        sidePanelMode: { kind: 'agent-inspector', agentId },
        inspectorActiveItem: { kind: 'skill', skillId, skillPath: skill.variantPath },
        inspectorCollapsed: collapsed,
        inspectorFileContent: null,
        inspectorEditContent: null,
        inspectorFileDirty: false,
      })
      void get().loadInspectorFile(skill.variantPath)
    } else {
      // Fallback: standalone skill preview panel
      set({
        previewSkillId: skillId,
        sidePanelMode: { kind: 'skill-preview', skillId },
      })
    }
  },

  toggleAgentSkillFilter: (tag) => set(s => {
    const next = new Set(s.agentSkillFilter)
    if (next.has(tag)) next.delete(tag)
    else next.add(tag)
    return { agentSkillFilter: next }
  }),

  clearAgentSkillFilter: () => set({ agentSkillFilter: new Set() }),

  setCanvasTheme: (theme) => set({ canvasTheme: theme }),
  setCanvasViewMode: (mode) => set({ canvasViewMode: mode }),

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

  editSkillInInspector: (agentId, skillId, skillPath) => {
    const collapsed = new Set(get().inspectorCollapsed)
    collapsed.delete('skills')
    set({
      sidePanelMode: { kind: 'agent-inspector', agentId },
      selectedAgentId: agentId,
      inspectorActiveItem: { kind: 'skill', skillId, skillPath },
      inspectorFileContent: null,
      inspectorEditContent: null,
      inspectorFileDirty: false,
      inspectorFileLoading: false,
      previewSkillId: null,
      inspectorCollapsed: collapsed,
    })
    // Load the skill file
    void get().loadInspectorFile(skillPath)
  },

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
        const skillDir = getSkillDirectoryPath(variantPath)
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

  semanticSearch: async (query) => {
    if (!query.trim()) {
      set({ semanticResults: null, semanticLoading: false })
      return
    }
    set({ semanticLoading: true })
    try {
      const results = await queryEmbeddings(query)
      set({ semanticResults: results.length > 0 ? results : null, semanticLoading: false })
    } catch {
      set({ semanticResults: null, semanticLoading: false })
    }
  },

  clearSemanticResults: () => set({ semanticResults: null, semanticLoading: false }),

  expandBrowserSkill: (skillId) => {
    if (!skillId) {
      set({ browserExpandedSkillId: null })
      return
    }
    const s = get()
    // Toggle: collapse if already expanded
    if (s.browserExpandedSkillId === skillId) {
      set({ browserExpandedSkillId: null })
      return
    }
    const skill = s.data?.paletteSkills.find(p => p.id === skillId)
    set({ browserExpandedSkillId: skillId })
    // Load skill dir files if not already loaded
    if (skill?.variantPath && !s.skillDirFiles[skillId]) {
      const skillDir = getSkillDirectoryPath(skill.variantPath)
      void get().loadSkillDirFiles(skillId, skillDir)
    }
    // Auto-load SKILL.md into the editor
    if (skill?.variantPath) {
      set({
        inspectorActiveItem: { kind: 'skill', skillId, skillPath: skill.variantPath },
        inspectorFileContent: null,
        inspectorEditContent: null,
        inspectorFileDirty: false,
      })
      void get().loadInspectorFile(skill.variantPath)
    }
  },

  // Legacy redirects
  enterAgentDocs: (agentId) => {
    get().openInspector(agentId)
  },

  backToCanvas: () => {
    get().closeInspector()
  },
}))
