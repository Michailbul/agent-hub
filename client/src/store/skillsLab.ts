import { create } from 'zustand'
import { fetchSkillsIndex, fetchFile, type SkillsIndexData } from '@/lib/api'

/* ═══ Types ═══ */

export type PresenceKind = 'canonical' | 'symlink' | 'copy' | 'absent'

export interface SkillSource {
  id: string
  label: string
  ecosystem: string
  path: string
  skillCount: number
  color: string
}

export interface LabAgent {
  id: string
  label: string
  emoji: string
  role: string
  skillsRoot: string
}

export interface UnifiedSkill {
  id: string
  name: string
  displayName: string
  description: string
  department: string
  canonicalSource: string
  presence: Record<string, PresenceKind>
  installedAgentIds: string[]
  /** Path to the primary SKILL.md for fetching real content */
  previewPath: string | null
  metadata: {
    author?: string
    source?: string
    license?: string
  }
}

export interface SkillFile {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: SkillFile[]
}

// Legacy stubs used by ClassicExplorer
export const SKILL_FILES: Record<string, SkillFile[]> = {}
export const SKILL_CONTENT: Record<string, string> = {}

export type LabVariant = 'skills-1'
export type SortField = 'name' | 'department'
export type SortDir = 'asc' | 'desc'

interface SkillsLabStore {
  variant: LabVariant
  skills: UnifiedSkill[]
  sources: SkillSource[]
  agents: LabAgent[]
  departments: string[]
  loading: boolean
  loaded: boolean
  error: string | null

  searchQuery: string
  activeSourceFilter: string | null
  activeAgentFilter: string | null
  activeDepartments: Set<string>
  selectedSkillIds: Set<string>
  expandedSkillId: string | null
  activeSkillFile: string | null
  expandedAgentId: string | null
  sortField: SortField
  sortDir: SortDir
  collapsedSources: Set<string>
  expandedTreeSources: Set<string>
  /** Loaded SKILL.md content keyed by skill id */
  skillContentCache: Record<string, string>

  setVariant: (v: LabVariant) => void
  setSearchQuery: (q: string) => void
  setActiveSourceFilter: (id: string | null) => void
  setActiveAgentFilter: (id: string | null) => void
  toggleDepartment: (dept: string) => void
  clearDepartments: () => void
  clearAllFilters: () => void
  toggleSelectSkill: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  setExpandedSkill: (id: string | null) => void
  setActiveSkillFile: (path: string | null) => void
  setExpandedAgentId: (id: string | null) => void
  setSort: (field: SortField) => void
  toggleSourceCollapse: (id: string) => void
  toggleExpandTreeSource: (id: string) => void
  loadFromAPI: () => Promise<void>
  loadSkillContent: (skillId: string) => Promise<string>

  filtered: () => UnifiedSkill[]
}

/* ═══ Helpers ═══ */

const ECOSYSTEM_COLORS: Record<string, string> = {
  agents: '#ff7a64',
  agent: '#ff7a64',
  claude: '#818cf8',
  openclaw: '#34d399',
  codex: '#fbbf24',
  cursor: '#f472b6',
  workspace: '#60a5fa',
}

function mapSources(data: SkillsIndexData): SkillSource[] {
  // Only show library sources, not workspace sources
  return data.sources
    .filter(s => s.kind === 'library')
    .map(s => ({
      id: s.id,
      label: s.label,
      ecosystem: s.ecosystem,
      path: s.root,
      skillCount: data.skills.filter(sk =>
        sk.variants.some(v => v.sourceId === s.id)
      ).length,
      color: ECOSYSTEM_COLORS[s.ecosystem] || '#94a3b8',
    }))
}

function mapAgents(data: SkillsIndexData): LabAgent[] {
  return data.agents.map(a => ({
    id: a.id,
    label: a.label,
    emoji: a.emoji,
    role: a.role,
    skillsRoot: a.skillsRoot,
  }))
}

function mapSkills(data: SkillsIndexData): UnifiedSkill[] {
  return data.skills.map(sk => {
    // Build presence from variants
    const presence: Record<string, PresenceKind> = {}
    for (const src of data.sources) {
      const variant = sk.variants.find(v => v.sourceId === src.id)
      if (variant) {
        // If it's the highest-priority variant, it's canonical; otherwise symlink
        const isCanonical = sk.variants[0]?.sourceId === src.id
        presence[src.id] = isCanonical ? 'canonical' : 'symlink'
      } else {
        presence[src.id] = 'absent'
      }
    }

    const preferred = sk.variants[0]
    return {
      id: sk.id,
      name: sk.name,
      displayName: sk.name,
      description: sk.summary,
      department: sk.grouping.department,
      canonicalSource: preferred?.sourceId || '',
      presence,
      installedAgentIds: sk.installedAgentIds,
      previewPath: preferred?.previewPath || null,
      metadata: {
        author: preferred?.frontmatter.author || undefined,
        source: preferred?.frontmatter.source || undefined,
        license: preferred?.frontmatter.license || undefined,
      },
    }
  })
}

/* ═══ Store ═══ */

export const useSkillsLabStore = create<SkillsLabStore>((set, get) => ({
  variant: 'skills-1',
  skills: [],
  sources: [],
  agents: [],
  departments: [],
  loading: false,
  loaded: false,
  error: null,

  searchQuery: '',
  activeSourceFilter: null,
  activeAgentFilter: null,
  activeDepartments: new Set(),
  selectedSkillIds: new Set(),
  expandedSkillId: null,
  activeSkillFile: null,
  expandedAgentId: null,
  sortField: 'name',
  sortDir: 'asc',
  collapsedSources: new Set(),
  expandedTreeSources: new Set(),
  skillContentCache: {},

  setVariant: (v) => set({ variant: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setActiveSourceFilter: (id) => set(s => ({ activeSourceFilter: s.activeSourceFilter === id ? null : id })),
  setActiveAgentFilter: (id) => set(s => ({ activeAgentFilter: s.activeAgentFilter === id ? null : id })),
  toggleDepartment: (dept) => set(s => {
    const next = new Set(s.activeDepartments)
    if (next.has(dept)) next.delete(dept); else next.add(dept)
    return { activeDepartments: next }
  }),
  clearDepartments: () => set({ activeDepartments: new Set() }),
  clearAllFilters: () => set({ activeSourceFilter: null, activeAgentFilter: null, activeDepartments: new Set(), searchQuery: '' }),
  toggleSelectSkill: (id) => set(s => {
    const next = new Set(s.selectedSkillIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    return { selectedSkillIds: next }
  }),
  selectAll: () => set(s => ({ selectedSkillIds: new Set(s.filtered().map(sk => sk.id)) })),
  clearSelection: () => set({ selectedSkillIds: new Set() }),
  setExpandedSkill: (id) => set(s => ({ expandedSkillId: s.expandedSkillId === id ? null : id, activeSkillFile: id ? 'SKILL.md' : null })),
  setActiveSkillFile: (path) => set({ activeSkillFile: path }),
  setExpandedAgentId: (id) => set(s => ({ expandedAgentId: s.expandedAgentId === id ? null : id })),
  setSort: (field) => set(s => ({
    sortField: field,
    sortDir: s.sortField === field && s.sortDir === 'asc' ? 'desc' : 'asc',
  })),
  toggleSourceCollapse: (id) => set(s => {
    const next = new Set(s.collapsedSources)
    if (next.has(id)) next.delete(id); else next.add(id)
    return { collapsedSources: next }
  }),
  toggleExpandTreeSource: (id) => set(s => {
    const next = new Set(s.expandedTreeSources)
    if (next.has(id)) next.delete(id); else next.add(id)
    return { expandedTreeSources: next }
  }),

  loadFromAPI: async () => {
    const { loaded, loading } = get()
    if (loaded || loading) return
    set({ loading: true, error: null })
    try {
      const data = await fetchSkillsIndex()
      const sources = mapSources(data)
      const agents = mapAgents(data)
      const skills = mapSkills(data)
      const departments = [...new Set(skills.map(s => s.department))].sort()
      set({ sources, agents, skills, departments, loading: false, loaded: true })
    } catch (e: any) {
      set({ loading: false, error: e.message })
    }
  },

  loadSkillContent: async (skillId: string) => {
    const { skillContentCache, skills } = get()
    if (skillContentCache[skillId]) return skillContentCache[skillId]

    const skill = skills.find(s => s.id === skillId)
    if (!skill?.previewPath) return 'No content available'

    try {
      const content = await fetchFile(skill.previewPath)
      set(s => ({ skillContentCache: { ...s.skillContentCache, [skillId]: content } }))
      return content
    } catch {
      return 'Failed to load content'
    }
  },

  filtered: () => {
    const { skills, searchQuery, activeSourceFilter, activeAgentFilter, activeDepartments, sortField, sortDir } = get()
    let result = skills

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) || s.displayName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) || s.department.toLowerCase().includes(q)
      )
    }

    if (activeSourceFilter) {
      result = result.filter(s => s.presence[activeSourceFilter] !== 'absent')
    }

    if (activeAgentFilter) {
      result = result.filter(s => s.installedAgentIds.includes(activeAgentFilter))
    }

    if (activeDepartments.size > 0) {
      result = result.filter(s => activeDepartments.has(s.department))
    }

    result = [...result].sort((a, b) => {
      const av = a[sortField], bv = b[sortField]
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  },
}))
