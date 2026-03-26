import { create } from 'zustand'
import {
  fetchSkillsIndex,
  fetchFile,
  installSkillZip,
  installSkillCommand,
  fetchClaudePlugins,
  fetchEmbeddingsStatus,
  buildEmbeddingsIndex,
  queryEmbeddings,
  type SkillsIndexData,
  type PillarDefinition,
  type ClaudePlugin,
  type SemanticSearchResult,
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
  pillar: string
  pillarName: string
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
  isCustom: boolean
  originCategory: 'custom' | 'community' | 'built-in'
  familyKey: string | null
  familyLabel: string | null
  tags: string[]
  useCases: string[]
  agentSummary: string | null
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
export type SidebarMode = 'all' | 'agents' | 'claude-code' | 'openclaw' | 'codex'
export type SkillsLabSavedView = 'all' | 'starred' | 'recent'
export type OriginFilter = 'custom' | 'community' | 'built-in' | null

interface SkillsLabStore {
  variant: LabVariant
  skills: UnifiedSkill[]
  sources: SkillSource[]
  agents: LabAgent[]
  departments: string[]
  pillars: PillarDefinition[]
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
  activePillars: Set<string>
  activeTagFilter: string | null
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
  activeOriginFilter: OriginFilter
  activePluginFilter: string | null
  deletingAgentId: string | null
  repos: { id: string; name: string; isOwned: boolean; skillCount: number }[]
  installBusy: boolean
  installError: string | null
  installLastOutput: string | null

  // Semantic search state
  hasApiKey: boolean
  hasEmbeddings: boolean
  embeddingSkillCount: number
  isIndexing: boolean
  isSemanticSearching: boolean
  semanticResults: SemanticSearchResult[]
  semanticScores: Map<string, number>
  combinedScores: Map<string, number>

  setVariant: (v: LabVariant) => void
  setSearchQuery: (q: string) => void
  setSidebarMode: (mode: SidebarMode) => void
  toggleAgentNavExpanded: (agentId: string) => void
  setActiveSavedView: (view: SkillsLabSavedView) => void
  setActiveSourceFilter: (id: string | null) => void
  setActiveAgentFilter: (id: string | null) => void
  setActiveFamilyFilter: (id: string | null) => void
  toggleDuplicateOnly: () => void
  selectDepartment: (dept: string) => void
  addDepartment: (dept: string) => void
  removeDepartment: (dept: string) => void
  toggleDepartment: (dept: string) => void
  clearDepartments: () => void
  selectPillar: (pillarId: string) => void
  addPillar: (pillarId: string) => void
  removePillar: (pillarId: string) => void
  togglePillar: (pillarId: string) => void
  clearPillars: () => void
  setActiveTagFilter: (tag: string | null) => void
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
  deleteAgent: (agentId: string) => Promise<void>
  loadPlugins: (force?: boolean) => Promise<void>
  setActiveOriginFilter: (filter: OriginFilter) => void
  setActivePluginFilter: (id: string | null) => void
  installFromZip: (file: File) => Promise<void>
  installFromCommand: (command: string) => Promise<void>
  clearInstallFeedback: () => void
  previewDeleteSkill: (skillId: string, sourceId?: string | null) => Promise<SkillDeletePreview>
  deleteSkill: (skillId: string, sourceId?: string | null) => Promise<void>
  categorizeSkill: (skillId: string, department: string) => Promise<void>
  previewRemoveDuplicates: (skillIds?: string[]) => Promise<DuplicateRemovalPlan>
  removeDuplicates: (skillIds?: string[]) => Promise<DuplicateRemovalPlan>

  // Semantic search actions
  loadEmbeddingsStatus: () => Promise<void>
  buildIndex: (rebuild?: boolean) => Promise<void>
  runSemanticSearch: (query: string) => Promise<void>
  clearSemanticResults: () => void

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

function mapSkills(data: SkillsIndexData, pillarLookup: Map<string, string>): UnifiedSkill[] {
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
      pillar: sk.pillar || 'utility',
      pillarName: pillarLookup.get(sk.pillar || 'utility') || sk.grouping.department,
      tags: sk.grouping.tags || [],
      useCases: sk.grouping.useCases || [],
      agentSummary: sk.grouping.agentSummary || null,
      canonicalSource: preferred?.sourceId || '',
      presence,
      installedAgentIds: sk.installedAgentIds,
      addedAt: sk.addedAt,
      addedVia: sk.addedVia,
      previewPath: preferred?.previewPath || null,
      sourceVariants,
      sourceVariantCount: libraryVariants.length,
      // A skill is only a duplicate if the same ecosystem has it more than once
      // (e.g. two browser-use folders inside .claude/skills). Cross-ecosystem
      // presence (.claude + .codex + .openclaw) is intentional — not a duplicate.
      isDuplicate: (() => {
        const ecosystemCounts: Record<string, number> = {}
        for (const v of libraryVariants) {
          const eco = v.ecosystem || v.sourceId
          ecosystemCounts[eco] = (ecosystemCounts[eco] || 0) + 1
        }
        return Object.values(ecosystemCounts).some(count => count > 1)
      })(),
      isCustom: sk.isCustom ?? false,
      originCategory: sk.originCategory ?? 'community',
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
    skill.pillarName,
    skill.metadata.author,
    skill.metadata.source,
    skill.metadata.license,
    ...relatedSources,
    ...variantTokens,
    ...installedAgents.flatMap(agent => [agent.label, agent.role, agent.skillsRoot]),
    ...skill.tags,
    ...(skill.agentSummary ? [skill.agentSummary] : []),
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
  pillars: [],
  families: [],
  loading: false,
  loaded: false,
  error: null,

  searchQuery: '',
  sidebarMode: 'openclaw',
  expandedAgentNavIds: new Set(),
  activeSavedView: 'all',
  activeSourceFilter: null,
  activeAgentFilter: null,
  activeFamilyFilter: null,
  duplicateOnly: false,
  activeDepartments: new Set(),
  activePillars: new Set(),
  activeTagFilter: null,
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
  activeOriginFilter: null,
  activePluginFilter: null,
  deletingAgentId: null,
  repos: [],
  installBusy: false,
  installError: null,
  installLastOutput: null,

  hasApiKey: false,
  hasEmbeddings: false,
  embeddingSkillCount: 0,
  isIndexing: false,
  isSemanticSearching: false,
  semanticResults: [],
  semanticScores: new Map(),
  combinedScores: new Map(),

  setVariant: (v) => set({ variant: v }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setSidebarMode: (mode) => set({
    sidebarMode: mode,
    // Clear all filters to prevent confusing empty results
    searchQuery: '',
    activeSavedView: null,
    activeDepartments: new Set(),
    activePillars: new Set(),
    activeTagFilter: null,
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
    // Auto-clear dept/pillar filters when switching agents to prevent confusing empty results
    activeDepartments: s.activeAgentFilter !== id ? new Set() : s.activeDepartments,
    activePillars: s.activeAgentFilter !== id ? new Set() : s.activePillars,
  })),
  setActiveFamilyFilter: (id) => set(s => ({ activeFamilyFilter: s.activeFamilyFilter === id ? null : id })),
  toggleDuplicateOnly: () => set(s => ({ duplicateOnly: !s.duplicateOnly })),
  selectDepartment: (dept) => set({ activeDepartments: new Set([dept]) }),
  addDepartment: (dept) => set(s => {
    const next = new Set(s.activeDepartments)
    next.add(dept)
    return { activeDepartments: next }
  }),
  removeDepartment: (dept) => set(s => {
    if (!s.activeDepartments.has(dept)) return s
    const next = new Set(s.activeDepartments)
    next.delete(dept)
    return { activeDepartments: next }
  }),
  toggleDepartment: (dept) => set(s => {
    const next = new Set(s.activeDepartments)
    if (next.has(dept)) next.delete(dept); else next.add(dept)
    return { activeDepartments: next }
  }),
  clearDepartments: () => set({ activeDepartments: new Set() }),
  selectPillar: (pillarId) => set({ activePillars: new Set([pillarId]) }),
  addPillar: (pillarId) => set(s => {
    const next = new Set(s.activePillars)
    next.add(pillarId)
    return { activePillars: next }
  }),
  removePillar: (pillarId) => set(s => {
    if (!s.activePillars.has(pillarId)) return s
    const next = new Set(s.activePillars)
    next.delete(pillarId)
    return { activePillars: next }
  }),
  togglePillar: (pillarId) => set(s => {
    const next = new Set(s.activePillars)
    if (next.has(pillarId)) next.delete(pillarId); else next.add(pillarId)
    return { activePillars: next }
  }),
  clearPillars: () => set({ activePillars: new Set() }),
  setActiveTagFilter: (tag) => set({ activeTagFilter: tag }),
  clearAllFilters: () => set({
    activeSourceFilter: null,
    activeAgentFilter: null,
    activeFamilyFilter: null,
    activeOriginFilter: null,
    activePluginFilter: null,
    duplicateOnly: false,
    activeDepartments: new Set(),
    activePillars: new Set(),
    activeTagFilter: null,
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
      const pillarLookup = new Map((data.pillars || []).map(p => [p.id, p.name]))
      const skills = mapSkills(data, pillarLookup)
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
        pillars: data.pillars || [],
        families,
        repos: data.repos || [],
        loading: false,
        loaded: true,
        starredSkillIds,
      })
      // Auto-build embeddings if API key is present and index is stale
      void get().loadEmbeddingsStatus().then(() => {
        const { hasApiKey, hasEmbeddings, embeddingSkillCount } = get()
        if (hasApiKey && (!hasEmbeddings || embeddingSkillCount < skills.length)) {
          void get().buildIndex(false) // delta build, non-blocking
        }
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

  deleteAgent: async (agentId) => {
    set({ deletingAgentId: agentId })
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(agentId)}`, { method: 'DELETE' })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Agent delete failed')
      }
      // Clear agent filter if we just deleted the filtered agent
      const { activeAgentFilter } = get()
      if (activeAgentFilter === agentId) {
        set({ activeAgentFilter: null, activeDepartments: new Set() })
      }
      await get().loadFromAPI(true)
      window.dispatchEvent(new Event('agent-hub:data-changed'))
    } finally {
      set({ deletingAgentId: null })
    }
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

  setActiveOriginFilter: (filter) => set(s => ({
    activeOriginFilter: s.activeOriginFilter === filter ? null : filter,
  })),
  setActivePluginFilter: (id) => set(s => ({
    activePluginFilter: s.activePluginFilter === id ? null : id,
    activeDepartments: new Set(),
    activePillars: new Set(),
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

  loadEmbeddingsStatus: async () => {
    try {
      const status = await fetchEmbeddingsStatus()
      set({
        hasApiKey: status.hasApiKey,
        hasEmbeddings: status.hasEmbeddings,
        embeddingSkillCount: status.skillCount,
      })
    } catch { /* ignore */ }
  },

  buildIndex: async (rebuild = false) => {
    set({ isIndexing: true })
    try {
      await buildEmbeddingsIndex(rebuild)
      await get().loadEmbeddingsStatus()
    } catch (e: any) {
      console.error('Embedding index build failed:', e.message)
    } finally {
      set({ isIndexing: false })
    }
  },

  runSemanticSearch: async (query: string) => {
    if (!query.trim() || !get().hasEmbeddings) {
      set({ semanticResults: [], semanticScores: new Map() })
      return
    }
    set({ isSemanticSearching: true })
    try {
      const results = await queryEmbeddings(query)
      const scores = new Map(results.map(r => [r.skillId, r.score]))
      set({ semanticResults: results, semanticScores: scores })
    } catch {
      set({ semanticResults: [], semanticScores: new Map() })
    } finally {
      set({ isSemanticSearching: false })
    }
  },

  clearSemanticResults: () => set({ semanticResults: [], semanticScores: new Map(), combinedScores: new Map() }),

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

  categorizeSkill: async (skillId: string, department: string) => {
    const res = await fetch('/api/skill/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, department }),
    })
    const payload = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(payload.error || 'Categorize failed')
    await get().loadFromAPI(true)
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

    // Ground truth: only show skills present in ~/.claude/skills
    // Exception: when filtering by a specific agent, use that agent's workspace as ground truth instead
    // Other ecosystem modes (openclaw, agents, codex) further narrow within that set
    if (!activeAgentFilter) {
      result = result.filter(skill =>
        Object.values(skill.sourceVariants).some(v => v.ecosystem === 'claude'),
      )
    } else {
      result = result.filter(skill => skill.installedAgentIds.includes(activeAgentFilter))
    }

    // Additional ecosystem scoping for non-claude modes
    // Skip when agent filter is active — agent workspace is ground truth, ecosystem tab irrelevant
    const ecosystemFilter = sidebarMode === 'openclaw' ? 'openclaw'
      : sidebarMode === 'agents' ? 'agents'
      : sidebarMode === 'codex' ? 'codex'
      : null // 'all' and 'claude-code' already filtered above

    if (ecosystemFilter && !activeAgentFilter) {
      result = result.filter(skill =>
        Object.values(skill.sourceVariants).some(v =>
          ecosystemFilter === 'agents'
            ? (v.ecosystem === 'agents' || v.ecosystem === 'agent')
            : v.ecosystem === ecosystemFilter,
        ),
      )
    }

    // Claude Code: plugin sub-filter
    if (sidebarMode === 'claude-code' && activePluginFilter) {
      const plugin = plugins.find(p => p.id === activePluginFilter)
      if (plugin) {
        const pluginDirNames = new Set(plugin.skills.map(s => s.directoryName))
        result = result.filter(skill => {
          const dirName = skill.id.split('/').pop() || skill.name
          return pluginDirNames.has(dirName) || pluginDirNames.has(skill.name)
        })
      }
    }

    if (activeSavedView === 'starred') {
      const { starredSkillIds } = get()
      result = result.filter(skill => starredSkillIds.has(skill.id))
    }

    // ── Hybrid search: unified keyword + semantic scoring ──
    const { semanticResults, semanticScores, activeOriginFilter } = get()

    if (searchQuery) {
      const searchTerms = normalizeSearchTerms(searchQuery)
      // 1. Keyword hits with relevance scoring
      //    Name/pillar match = strong (1.0), description = medium (0.6), body = weak (0.3)
      const keywordScores = new Map<string, number>()
      for (const skill of result) {
        const nameField = `${skill.name} ${skill.displayName} ${skill.pillarName}`.toLowerCase()
        const descField = (skill.description || '').toLowerCase()
        const fullIndex = getCachedSearchIndex(skill, sources, agents)
        if (!searchTerms.every(term => fullIndex.includes(term))) continue

        let kwScore = 0
        for (const term of searchTerms) {
          if (nameField.includes(term)) kwScore += 1.0
          else if (descField.includes(term)) kwScore += 0.6
          else kwScore += 0.3
        }
        kwScore = kwScore / searchTerms.length // normalize to 0-1 per term
        keywordScores.set(skill.id, kwScore)
      }

      // 2. Semantic hits from server — only include if score is meaningful
      const SEMANTIC_MIN_SCORE = 0.45
      const semanticScoreMap = new Map(semanticResults.map(r => [r.skillId, r]))

      // 3. Combine: keyword hits always included, semantic-only hits need threshold
      const combinedScoreMap = new Map<string, number>()
      // Start with all keyword hits
      for (const [id, kwScore] of keywordScores) {
        const semResult = semanticScoreMap.get(id)
        combinedScoreMap.set(id, kwScore + (semResult?.score || 0))
      }
      // Add semantic-only hits above threshold
      for (const [skillId, semResult] of semanticScoreMap) {
        if (keywordScores.has(skillId)) continue // already counted
        const semScore = semResult.combined ?? semResult.score
        if (semScore >= SEMANTIC_MIN_SCORE) {
          combinedScoreMap.set(skillId, semScore)
        }
      }
      const unionIds = new Set(combinedScoreMap.keys())

      // If strong matches exist (name/desc hits), prune weak body-only keyword matches
      const hasStrongMatches = [...combinedScoreMap.values()].some(s => s >= 0.6)
      if (hasStrongMatches) {
        for (const [id, score] of combinedScoreMap) {
          if (score < 0.4) combinedScoreMap.delete(id)
        }
      }

      // Build result from the scored set
      const finalIds = new Set(combinedScoreMap.keys())
      const scopedById = new Map(result.map(s => [s.id, s]))
      const allById = new Map(skills.map(s => [s.id, s]))
      const unionSkills: UnifiedSkill[] = []
      for (const id of finalIds) {
        const skill = scopedById.get(id) || allById.get(id)
        if (skill) unionSkills.push(skill)
      }
      result = unionSkills

      // Store combinedScores for UI
      set({ combinedScores: combinedScoreMap })
    } else {
      set({ combinedScores: new Map() })
    }

    // ── Re-apply ground truth: only .claude/skills (skip when agent filter is active) ──
    if (!activeAgentFilter) {
      result = result.filter(skill =>
        Object.values(skill.sourceVariants).some(v => v.ecosystem === 'claude'),
      )
      if (ecosystemFilter) {
        result = result.filter(skill =>
          Object.values(skill.sourceVariants).some(v =>
            ecosystemFilter === 'agents'
              ? (v.ecosystem === 'agents' || v.ecosystem === 'agent')
              : v.ecosystem === ecosystemFilter,
          ),
        )
      }
    }

    // ── Apply non-search filters ──
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

    if (activeOriginFilter) {
      result = result.filter(s => s.originCategory === activeOriginFilter)
    }

    if (activeDepartments.size > 0) {
      result = result.filter(s => activeDepartments.has(s.department))
    }

    const { activePillars } = get()
    if (activePillars.size > 0) {
      result = result.filter(s => activePillars.has(s.pillar))
    }

    const { activeTagFilter } = get()
    if (activeTagFilter) {
      result = result.filter(s => s.tags.includes(activeTagFilter))
    }

    // ── Sort ──
    if (searchQuery) {
      // Sort by combined score descending when searching
      const scores = get().combinedScores
      result = [...result].sort((a, b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0))
    } else {
      result = [...result].sort((a, b) => {
        if (activeSavedView === 'recent') {
          return getAddedAtMs(b) - getAddedAtMs(a) || a.name.localeCompare(b.name)
        }
        const av = a[sortField], bv = b[sortField]
        const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
    }

    return result
  },
}))
