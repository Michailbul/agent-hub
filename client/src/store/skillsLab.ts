import { create } from 'zustand'
import {
  fetchSkillsIndex,
  fetchFile,
  installSkillZip,
  installSkillCommand,
  fetchClaudePlugins,
  type SkillsIndexData,
  type ClaudePlugin,
} from '@/lib/api'

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

export interface SkillVariantRef {
  sourceId: string
  sourceLabel: string
  ecosystem: string
  kind: string
  path: string
  previewPath: string
  isSymlink: boolean
}

export interface LabAgent {
  id: string
  label: string
  emoji: string
  role: string
  skillsRoot: string
}

export interface SkillFamily {
  key: string
  label: string
  count: number
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
  addedAt: string | null
  addedVia: 'zip' | 'npx' | 'create' | 'unknown' | null
  /** Path to the primary SKILL.md for fetching real content */
  previewPath: string | null
  sourceVariants: Record<string, SkillVariantRef>
  sourceVariantCount: number
  isDuplicate: boolean
  familyKey: string | null
  familyLabel: string | null
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

export interface SkillDeleteImpact {
  agentId: string
  label: string
  emoji: string
  path: string
  isSymlink: boolean
}

export interface SkillDeletePreview {
  skillId: string
  skillName: string
  action: 'delete-library' | 'unassign-agent' | 'blocked'
  allowed: boolean
  message: string
  sourceId: string
  sourceLabel: string
  sourceKind: string
  sourceEcosystem: string
  variantPath: string
  impactedInstalls: SkillDeleteImpact[]
  otherLibraryVariants: Array<{
    sourceId: string
    sourceLabel: string
    kind: string
    path: string
  }>
}

export interface DuplicateRemovalPlanItem {
  skillId: string
  skillName: string
  sourceId: string
  sourceLabel: string
  impactedInstallCount: number
}

export interface DuplicateRemovalPlan {
  totalSkills: number
  totalVariants: number
  totalInstalls: number
  blockedVariants: number
  items: DuplicateRemovalPlanItem[]
}

// Legacy stubs used by ClassicExplorer
export const SKILL_FILES: Record<string, SkillFile[]> = {}
export const SKILL_CONTENT: Record<string, string> = {}

export type LabVariant = 'skills-1'
export type SortField = 'name' | 'department'
export type SortDir = 'asc' | 'desc'
export type SidebarMode = 'agents' | 'claude-code'
export type SkillsLabSavedView = 'all' | 'starred' | 'recent'

interface SkillsLabStore {
  variant: LabVariant
  skills: UnifiedSkill[]
  sources: SkillSource[]
  agents: LabAgent[]
  departments: string[]
  families: SkillFamily[]
  loading: boolean
  loaded: boolean
  error: string | null

  searchQuery: string
  sidebarMode: SidebarMode
  expandedAgentNavIds: Set<string>
  activeSavedView: SkillsLabSavedView
  activeSourceFilter: string | null
  activeAgentFilter: string | null
  activeFamilyFilter: string | null
  duplicateOnly: boolean
  activeDepartments: Set<string>
  expandedSkillId: string | null
  activeSkillFile: string | null
  sortField: SortField
  sortDir: SortDir
  skillFileTreeCache: Record<string, SkillFile[]>
  expandedSkillFolders: Set<string>
  loadingSkillTreeRoot: string | null
  /** Loaded SKILL.md content keyed by skill id */
  skillContentCache: Record<string, string>
  /** Starred/favorited skill IDs */
  starredSkillIds: Set<string>
  plugins: ClaudePlugin[]
  pluginsLoading: boolean
  pluginsLoaded: boolean
  activePluginFilter: string | null
  installBusy: boolean
  installError: string | null
  installLastOutput: string | null

  setVariant: (v: LabVariant) => void
  setSearchQuery: (q: string) => void
  setSidebarMode: (mode: SidebarMode) => void
  toggleAgentNavExpanded: (agentId: string) => void
  setActiveSavedView: (view: SkillsLabSavedView) => void
  setActiveSourceFilter: (id: string | null) => void
  setActiveAgentFilter: (id: string | null) => void
  setActiveFamilyFilter: (id: string | null) => void
  toggleDuplicateOnly: () => void
  toggleDepartment: (dept: string) => void
  clearDepartments: () => void
  clearAllFilters: () => void
  setExpandedSkill: (id: string | null) => void
  setActiveSkillFile: (path: string | null) => void
  setSort: (field: SortField) => void
  toggleSkillFolder: (path: string) => void
  loadSkillFileTree: (rootPath: string) => Promise<void>
  loadFromAPI: (force?: boolean) => Promise<void>
  loadSkillContent: (skillId: string, previewPath?: string | null) => Promise<string>
  assignSkill: (agentId: string, variantPath: string) => Promise<void>
  unassignSkill: (agentId: string, skillId: string) => Promise<void>
  toggleStarSkill: (skillId: string) => Promise<void>
  loadPlugins: (force?: boolean) => Promise<void>
  setActivePluginFilter: (id: string | null) => void
  installFromZip: (file: File) => Promise<void>
  installFromCommand: (command: string) => Promise<void>
  clearInstallFeedback: () => void
  previewDeleteSkill: (skillId: string, sourceId?: string | null) => Promise<SkillDeletePreview>
  deleteSkill: (skillId: string, sourceId?: string | null) => Promise<void>
  previewRemoveDuplicates: (skillIds?: string[]) => Promise<DuplicateRemovalPlan>
  removeDuplicates: (skillIds?: string[]) => Promise<DuplicateRemovalPlan>

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

function getFamilyCandidate(skillId: string, skillName: string): string | null {
  const source = `${skillId} ${skillName}`.toLowerCase()
  const match = source.match(/\b([a-z0-9]{3,})-/)
  return match?.[1] || null
}

function formatFamilyLabel(key: string): string {
  return `${key.charAt(0).toUpperCase()}${key.slice(1)}-*`
}

function mapSkills(data: SkillsIndexData): UnifiedSkill[] {
  const provisional = data.skills.map(sk => {
    const libraryVariants = sk.variants.filter(variant => variant.kind !== 'workspace')
    // Build presence from variants
    const presence: Record<string, PresenceKind> = {}
    const sourceVariants: Record<string, SkillVariantRef> = {}
    for (const src of data.sources) {
      const variant = sk.variants.find(v => v.sourceId === src.id)
      if (variant) {
        // If it's the highest-priority variant, it's canonical; otherwise symlink
        const isCanonical = sk.variants[0]?.sourceId === src.id
        presence[src.id] = isCanonical ? 'canonical' : 'symlink'
        sourceVariants[src.id] = {
          sourceId: variant.sourceId,
          sourceLabel: variant.sourceLabel,
          ecosystem: variant.ecosystem,
          kind: variant.kind,
          path: variant.path,
          previewPath: variant.previewPath,
          isSymlink: variant.isSymlink,
        }
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
      addedAt: sk.addedAt,
      addedVia: sk.addedVia,
      previewPath: preferred?.previewPath || null,
      sourceVariants,
      sourceVariantCount: libraryVariants.length,
      isDuplicate: libraryVariants.length > 1,
      familyKey: null,
      familyLabel: null,
      metadata: {
        author: preferred?.frontmatter.author || undefined,
        source: preferred?.frontmatter.source || undefined,
        license: preferred?.frontmatter.license || undefined,
      },
    }
  })

  const familyCounts = provisional.reduce<Record<string, number>>((acc, skill) => {
    const candidate = getFamilyCandidate(skill.id, skill.displayName)
    if (!candidate) return acc
    acc[candidate] = (acc[candidate] || 0) + 1
    return acc
  }, {})

  return provisional.map(skill => {
    const candidate = getFamilyCandidate(skill.id, skill.displayName)
    const familyKey = candidate && familyCounts[candidate] > 1 ? candidate : null

    return {
      ...skill,
      familyKey,
      familyLabel: familyKey ? formatFamilyLabel(familyKey) : null,
    }
  })
}

async function fetchSkillTree(dirPath: string): Promise<SkillFile[]> {
  const res = await fetch(`/api/dir?path=${encodeURIComponent(dirPath)}`)
  if (!res.ok) throw new Error('Failed to fetch directory')
  const data = await res.json()
  const entries = Array.isArray(data.files) ? data.files : []

  const children = await Promise.all(entries.map(async (entry: any) => {
    const node: SkillFile = {
      name: entry.name,
      path: entry.path,
      type: entry.isDir ? 'folder' : 'file',
    }

    if (entry.isDir) {
      node.children = await fetchSkillTree(entry.path)
    }

    return node
  }))

  return children
}

function normalizeSearchTerms(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map(term => term.trim())
    .filter(Boolean)
}

function buildSkillSearchIndex(
  skill: UnifiedSkill,
  sources: SkillSource[],
  agents: LabAgent[],
): string {
  const installedAgents = skill.installedAgentIds
    .map(agentId => agents.find(agent => agent.id === agentId))
    .filter((agent): agent is LabAgent => Boolean(agent))

  const relatedSources = sources
    .filter(source => skill.presence[source.id] !== 'absent')
    .map(source => `${source.label} ${source.ecosystem}`)

  const variantTokens = Object.values(skill.sourceVariants).flatMap(variant => [
    variant.sourceLabel,
    variant.ecosystem,
    variant.kind,
    variant.path.split('/').pop() || '',
  ])

  return [
    skill.name,
    skill.displayName,
    skill.description,
    skill.department,
    skill.metadata.author,
    skill.metadata.source,
    skill.metadata.license,
    ...relatedSources,
    ...variantTokens,
    ...installedAgents.flatMap(agent => [agent.label, agent.role, agent.skillsRoot]),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

function getAddedAtMs(skill: UnifiedSkill): number {
  if (!skill.addedAt) return 0
  const value = Date.parse(skill.addedAt)
  return Number.isFinite(value) ? value : 0
}

function getRemovableDuplicateVariants(skills: UnifiedSkill[]): Array<{ skillId: string; skillName: string; sourceId: string }> {
  return skills.flatMap(skill => {
    const variants = Object.values(skill.sourceVariants)
      .filter(variant => variant.kind === 'library' && variant.sourceId !== skill.canonicalSource)

    return variants.map(variant => ({
      skillId: skill.id,
      skillName: skill.displayName,
      sourceId: variant.sourceId,
    }))
  })
}

/* ═══ Search index cache ═══ */
let _searchIndexCache = new WeakMap<UnifiedSkill, string>()
let _searchIndexSources: SkillSource[] = []
let _searchIndexAgents: LabAgent[] = []

function getCachedSearchIndex(skill: UnifiedSkill, sources: SkillSource[], agents: LabAgent[]): string {
  // Invalidate cache if sources/agents changed
  if (sources !== _searchIndexSources || agents !== _searchIndexAgents) {
    _searchIndexCache = new WeakMap()
    _searchIndexSources = sources
    _searchIndexAgents = agents
  }
  let index = _searchIndexCache.get(skill)
  if (!index) {
    index = buildSkillSearchIndex(skill, sources, agents)
    _searchIndexCache.set(skill, index)
  }
  return index
}

/* ═══ Store ═══ */

export const useSkillsLabStore = create<SkillsLabStore>((set, get) => ({
  variant: 'skills-1',
  skills: [],
  sources: [],
  agents: [],
  departments: [],
  families: [],
  loading: false,
  loaded: false,
  error: null,

  searchQuery: '',
  sidebarMode: 'agents',
  expandedAgentNavIds: new Set(),
  activeSavedView: 'all',
  activeSourceFilter: null,
  activeAgentFilter: null,
  activeFamilyFilter: null,
  duplicateOnly: false,
  activeDepartments: new Set(),
  expandedSkillId: null,
  activeSkillFile: null,
  sortField: 'name',
  sortDir: 'asc',
  skillFileTreeCache: {},
  expandedSkillFolders: new Set(),
  loadingSkillTreeRoot: null,
  skillContentCache: {},
  starredSkillIds: new Set(),
  plugins: [],
  pluginsLoading: false,
  pluginsLoaded: false,
  activePluginFilter: null,
  installBusy: false,
  installError: null,
  installLastOutput: null,

  setVariant: (v) => set({ variant: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSidebarMode: (mode) => set({
    sidebarMode: mode,
    // Clear all filters to prevent confusing empty results
    searchQuery: '',
    activeSavedView: null,
    activeDepartments: new Set(),
    activeSourceFilter: null,
    activeAgentFilter: null,
    activeFamilyFilter: null,
    activePluginFilter: null,
    duplicateOnly: false,
  }),
  toggleAgentNavExpanded: (agentId) => set(s => {
    const next = new Set(s.expandedAgentNavIds)
    if (next.has(agentId)) next.delete(agentId); else next.add(agentId)
    return { expandedAgentNavIds: next }
  }),
  setActiveSavedView: (view) => set({ activeSavedView: view }),
  setActiveSourceFilter: (id) => set(s => ({ activeSourceFilter: s.activeSourceFilter === id ? null : id })),
  setActiveAgentFilter: (id) => set(s => ({
    activeAgentFilter: s.activeAgentFilter === id ? null : id,
    // Auto-clear dept filters when switching agents to prevent confusing empty results
    activeDepartments: s.activeAgentFilter !== id ? new Set() : s.activeDepartments,
  })),
  setActiveFamilyFilter: (id) => set(s => ({ activeFamilyFilter: s.activeFamilyFilter === id ? null : id })),
  toggleDuplicateOnly: () => set(s => ({ duplicateOnly: !s.duplicateOnly })),
  toggleDepartment: (dept) => set(s => {
    const next = new Set(s.activeDepartments)
    if (next.has(dept)) next.delete(dept); else next.add(dept)
    return { activeDepartments: next }
  }),
  clearDepartments: () => set({ activeDepartments: new Set() }),
  clearAllFilters: () => set({
    activeSourceFilter: null,
    activeAgentFilter: null,
    activeFamilyFilter: null,
    activePluginFilter: null,
    duplicateOnly: false,
    activeDepartments: new Set(),
    searchQuery: '',
  }),
  setExpandedSkill: (id) => set(s => ({
    expandedSkillId: s.expandedSkillId === id ? null : id,
    activeSkillFile: null,
  })),
  setActiveSkillFile: (path) => set({ activeSkillFile: path }),
  setSort: (field) => set(s => ({
    sortField: field,
    sortDir: s.sortField === field && s.sortDir === 'asc' ? 'desc' : 'asc',
  })),
  toggleSkillFolder: (path) => set(s => {
    const next = new Set(s.expandedSkillFolders)
    if (next.has(path)) next.delete(path); else next.add(path)
    return { expandedSkillFolders: next }
  }),

  loadSkillFileTree: async (rootPath) => {
    const { skillFileTreeCache, loadingSkillTreeRoot } = get()
    if (skillFileTreeCache[rootPath] || loadingSkillTreeRoot === rootPath) return

    set({ loadingSkillTreeRoot: rootPath })
    try {
      const tree = await fetchSkillTree(rootPath)
      set(s => ({
        skillFileTreeCache: { ...s.skillFileTreeCache, [rootPath]: tree },
        expandedSkillFolders: new Set([...s.expandedSkillFolders, rootPath]),
        loadingSkillTreeRoot: null,
      }))
    } catch {
      set({ loadingSkillTreeRoot: null })
    }
  },

  loadFromAPI: async (force = false) => {
    const { loaded, loading } = get()
    if (!force && (loaded || loading)) return
    set({ loading: true, error: null })
    try {
      const data = await fetchSkillsIndex()
      const sources = mapSources(data)
      const agents = mapAgents(data)
      const skills = mapSkills(data)
      const departments = [...new Set(skills.map(s => s.department))].sort()
      const families = Object.entries(
        skills.reduce<Record<string, number>>((acc, skill) => {
          if (!skill.familyKey || !skill.familyLabel) return acc
          acc[skill.familyKey] = (acc[skill.familyKey] || 0) + 1
          return acc
        }, {}),
      )
        .map(([key, count]) => ({ key, count, label: formatFamilyLabel(key) }))
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      const starredSkillIds = new Set<string>(data.starredSkillIds || [])
      set({
        sources,
        agents,
        skills,
        departments,
        families,
        loading: false,
        loaded: true,
        starredSkillIds,
      })
    } catch (e: any) {
      set({ loading: false, error: e.message })
    }
  },

  loadSkillContent: async (skillId: string, previewPath?: string | null) => {
    const { skillContentCache, skills } = get()
    const skill = skills.find(s => s.id === skillId)
    const resolvedPath = previewPath || skill?.previewPath
    if (!resolvedPath) return 'No content available'

    const cacheKey = previewPath ? `${skillId}:${resolvedPath}` : skillId
    if (skillContentCache[cacheKey]) return skillContentCache[cacheKey]

    try {
      const content = await fetchFile(resolvedPath)
      set(s => ({ skillContentCache: { ...s.skillContentCache, [cacheKey]: content } }))
      return content
    } catch {
      return 'Failed to load content'
    }
  },

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
    await get().loadFromAPI(true)
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
    await get().loadFromAPI(true)
  },

  toggleStarSkill: async (skillId: string) => {
    const { starredSkillIds } = get()
    const wasStarred = starredSkillIds.has(skillId)
    const next = new Set(starredSkillIds)
    if (wasStarred) next.delete(skillId); else next.add(skillId)
    set({ starredSkillIds: next })
    try {
      const r = await fetch(wasStarred ? '/api/skills/unstar' : '/api/skills/star', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId }),
      })
      if (!r.ok) set({ starredSkillIds }) // rollback
    } catch { set({ starredSkillIds }) }
  },

  loadPlugins: async (force = false) => {
    const { pluginsLoaded, pluginsLoading } = get()
    if (!force && (pluginsLoaded || pluginsLoading)) return
    set({ pluginsLoading: true })
    try {
      const data = await fetchClaudePlugins()
      set({ plugins: data.plugins, pluginsLoading: false, pluginsLoaded: true })
    } catch {
      set({ pluginsLoading: false, pluginsLoaded: true, plugins: [] })
    }
  },

  setActivePluginFilter: (id) => set(s => ({
    activePluginFilter: s.activePluginFilter === id ? null : id,
    activeDepartments: new Set(),
  })),

  installFromZip: async (file) => {
    set({ installBusy: true, installError: null, installLastOutput: null })
    try {
      await installSkillZip(file)
      await get().loadFromAPI(true)
      set({ installBusy: false, activeSavedView: 'recent' })
    } catch (e: any) {
      set({ installBusy: false, installError: e.message || 'ZIP install failed' })
      throw e
    }
  },

  installFromCommand: async (command) => {
    set({ installBusy: true, installError: null, installLastOutput: null })
    try {
      const result = await installSkillCommand(command)
      await get().loadFromAPI(true)
      set({
        installBusy: false,
        activeSavedView: 'recent',
        installLastOutput: result.output || null,
      })
    } catch (e: any) {
      set({ installBusy: false, installError: e.message || 'Command install failed' })
      throw e
    }
  },

  clearInstallFeedback: () => set({ installError: null, installLastOutput: null }),

  previewDeleteSkill: async (skillId: string, sourceId?: string | null) => {
    const res = await fetch('/api/skills/delete-preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, sourceId: sourceId || undefined }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.error || 'Failed to load delete preview')
    return payload as SkillDeletePreview
  },

  deleteSkill: async (skillId: string, sourceId?: string | null) => {
    const res = await fetch('/api/skills/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, sourceId: sourceId || undefined }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.error || 'Delete failed')

    const { expandedSkillId } = get()
    const touchedExpandedSkill = expandedSkillId === skillId
    await get().loadFromAPI(true)
    if (touchedExpandedSkill) {
      const stillExists = get().skills.some(skill => skill.id === skillId)
      set({
        expandedSkillId: stillExists ? skillId : null,
        activeSkillFile: null,
      })
    }
  },

  previewRemoveDuplicates: async (skillIds) => {
    const allSkills = get().skills
    const targetSkills = skillIds?.length
      ? allSkills.filter(skill => skillIds.includes(skill.id))
      : allSkills.filter(skill => skill.isDuplicate)
    const variants = getRemovableDuplicateVariants(targetSkills)
    if (variants.length === 0) {
      return {
        totalSkills: 0,
        totalVariants: 0,
        totalInstalls: 0,
        blockedVariants: 0,
        items: [],
      }
    }

    const previews = await Promise.all(
      variants.map(async variant => {
        try {
          const preview = await get().previewDeleteSkill(variant.skillId, variant.sourceId)
          if (!preview.allowed || preview.action !== 'delete-library') return null
          return {
            skillId: preview.skillId,
            skillName: preview.skillName,
            sourceId: preview.sourceId,
            sourceLabel: preview.sourceLabel,
            impactedInstallCount: preview.impactedInstalls.length,
          } satisfies DuplicateRemovalPlanItem
        } catch {
          return null
        }
      }),
    )

    const items = previews.filter((item): item is DuplicateRemovalPlanItem => Boolean(item))

    return {
      totalSkills: new Set(items.map(item => item.skillId)).size,
      totalVariants: items.length,
      totalInstalls: items.reduce((sum, item) => sum + item.impactedInstallCount, 0),
      blockedVariants: variants.length - items.length,
      items,
    }
  },

  removeDuplicates: async (skillIds) => {
    const plan = await get().previewRemoveDuplicates(skillIds)
    if (plan.totalVariants === 0) return plan

    const expandedSkillId = get().expandedSkillId
    const touchedExpandedSkill = expandedSkillId ? plan.items.some(item => item.skillId === expandedSkillId) : false

    for (const item of plan.items) {
      const res = await fetch('/api/skills/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId: item.skillId, sourceId: item.sourceId }),
      })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(payload.error || `Failed to delete duplicate from ${item.sourceLabel}`)
    }

    await get().loadFromAPI(true)

    if (touchedExpandedSkill && expandedSkillId) {
      const stillExists = get().skills.some(skill => skill.id === expandedSkillId)
      set({
        expandedSkillId: stillExists ? expandedSkillId : null,
        activeSkillFile: null,
      })
    }

    return plan
  },

  filtered: () => {
    const {
      skills,
      sources,
      agents,
      searchQuery,
      activeSavedView,
      activeSourceFilter,
      activeAgentFilter,
      activeFamilyFilter,
      duplicateOnly,
      activeDepartments,
      sortField,
      sortDir,
    } = get()
    const { sidebarMode, activePluginFilter, plugins } = get()
    let result = skills

    // Claude Code mode: scope to skills with a claude ecosystem variant
    if (sidebarMode === 'claude-code') {
      result = result.filter(skill =>
        Object.values(skill.sourceVariants).some(v => v.ecosystem === 'claude'),
      )
      // If a plugin filter is active, further narrow to skills whose directory name matches plugin skills
      if (activePluginFilter) {
        const plugin = plugins.find(p => p.id === activePluginFilter)
        if (plugin) {
          const pluginDirNames = new Set(plugin.skills.map(s => s.directoryName))
          result = result.filter(skill => {
            const dirName = skill.id.split('/').pop() || skill.name
            return pluginDirNames.has(dirName) || pluginDirNames.has(skill.name)
          })
        }
      }
    }

    if (activeSavedView === 'starred') {
      const { starredSkillIds } = get()
      result = result.filter(skill => starredSkillIds.has(skill.id))
    }

    if (searchQuery) {
      const searchTerms = normalizeSearchTerms(searchQuery)
      result = result.filter(skill => {
        const searchIndex = getCachedSearchIndex(skill, sources, agents)
        return searchTerms.every(term => searchIndex.includes(term))
      })
    }

    if (activeSourceFilter) {
      result = result.filter(s => s.presence[activeSourceFilter] !== 'absent')
    }

    if (activeAgentFilter) {
      result = result.filter(s => s.installedAgentIds.includes(activeAgentFilter))
    }

    if (activeFamilyFilter) {
      result = result.filter(s => s.familyKey === activeFamilyFilter)
    }

    if (duplicateOnly) {
      result = result.filter(s => s.isDuplicate)
    }

    if (activeDepartments.size > 0) {
      result = result.filter(s => activeDepartments.has(s.department))
    }

    result = [...result].sort((a, b) => {
      if (activeSavedView === 'recent') {
        return getAddedAtMs(b) - getAddedAtMs(a) || a.name.localeCompare(b.name)
      }
      const av = a[sortField], bv = b[sortField]
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : 0
      return sortDir === 'asc' ? cmp : -cmp
    })

    return result
  },
}))
