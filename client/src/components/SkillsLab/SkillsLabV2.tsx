import { useEffect, useMemo, useRef, useState } from 'react'
import { useSkillsLabStore, type UnifiedSkill } from '@/store/skillsLab'
import { useThemeStore } from '@/store/theme'
import { useResizable } from '@/lib/useResizable'
import { SkillCMEditor } from './SkillCMEditor'
import { SkillFileTree } from './SkillFileTree'
import { FacetedFilters } from './FacetedFilters'
import { ActiveFiltersBar } from './ActiveFiltersBar'
import { CommandPalette } from './CommandPalette'
import { SkillCardView } from './SkillCardView'
import { StatusBar } from './StatusBar'
import { brandTheme } from '@/lib/cmBrandTheme'
import { darkTheme } from '@/lib/cmDarkTheme'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Feather,
  Globe,
  Grid3x3,
  List,
  Package,
  Search,
  Sparkles,
  Star,
  TerminalSquare,
  Trash2,
  Upload,
} from 'lucide-react'

type FocusedPanel = 'nav' | 'results' | 'editor' | 'meta' | null

interface SkillsLabV2Props {
  themePrefix: string
  variant?: string
}

export function SkillsLabV2({ themePrefix: p, variant }: SkillsLabV2Props) {
  const sources = useSkillsLabStore(s => s.sources)
  const agents = useSkillsLabStore(s => s.agents)
  const departments = useSkillsLabStore(s => s.departments)
  const families = useSkillsLabStore(s => s.families)
  const skills = useSkillsLabStore(s => s.skills)
  const getFilteredSkills = useSkillsLabStore(s => s.filtered)
  const loading = useSkillsLabStore(s => s.loading)
  const loaded = useSkillsLabStore(s => s.loaded)
  const error = useSkillsLabStore(s => s.error)
  const searchQuery = useSkillsLabStore(s => s.searchQuery)
  const setSearchQuery = useSkillsLabStore(s => s.setSearchQuery)
  const sidebarMode = useSkillsLabStore(s => s.sidebarMode)
  const setSidebarMode = useSkillsLabStore(s => s.setSidebarMode)
  const expandedAgentNavIds = useSkillsLabStore(s => s.expandedAgentNavIds)
  const toggleAgentNavExpanded = useSkillsLabStore(s => s.toggleAgentNavExpanded)
  const activeSavedView = useSkillsLabStore(s => s.activeSavedView)
  const setActiveSavedView = useSkillsLabStore(s => s.setActiveSavedView)
  const activeSourceFilter = useSkillsLabStore(s => s.activeSourceFilter)
  const setActiveSourceFilter = useSkillsLabStore(s => s.setActiveSourceFilter)
  const activeAgentFilter = useSkillsLabStore(s => s.activeAgentFilter)
  const setActiveAgentFilter = useSkillsLabStore(s => s.setActiveAgentFilter)
  const activeFamilyFilter = useSkillsLabStore(s => s.activeFamilyFilter)
  const setActiveFamilyFilter = useSkillsLabStore(s => s.setActiveFamilyFilter)
  const duplicateOnly = useSkillsLabStore(s => s.duplicateOnly)
  const toggleDuplicateOnly = useSkillsLabStore(s => s.toggleDuplicateOnly)
  const activeDepartments = useSkillsLabStore(s => s.activeDepartments)
  const toggleDepartment = useSkillsLabStore(s => s.toggleDepartment)
  const clearAllFilters = useSkillsLabStore(s => s.clearAllFilters)
  const expandedSkillId = useSkillsLabStore(s => s.expandedSkillId)
  const setExpandedSkill = useSkillsLabStore(s => s.setExpandedSkill)
  const activeSkillFile = useSkillsLabStore(s => s.activeSkillFile)
  const setActiveSkillFile = useSkillsLabStore(s => s.setActiveSkillFile)
  const skillFileTreeCache = useSkillsLabStore(s => s.skillFileTreeCache)
  const loadingSkillTreeRoot = useSkillsLabStore(s => s.loadingSkillTreeRoot)
  const loadSkillFileTree = useSkillsLabStore(s => s.loadSkillFileTree)
  const loadFromAPI = useSkillsLabStore(s => s.loadFromAPI)
  const loadSkillContent = useSkillsLabStore(s => s.loadSkillContent)
  const skillContentCache = useSkillsLabStore(s => s.skillContentCache)
  const assignSkill = useSkillsLabStore(s => s.assignSkill)
  const unassignSkill = useSkillsLabStore(s => s.unassignSkill)
  const starredSkillIds = useSkillsLabStore(s => s.starredSkillIds)
  const toggleStarSkill = useSkillsLabStore(s => s.toggleStarSkill)
  const installBusy = useSkillsLabStore(s => s.installBusy)
  const installError = useSkillsLabStore(s => s.installError)
  const installLastOutput = useSkillsLabStore(s => s.installLastOutput)
  const installFromZip = useSkillsLabStore(s => s.installFromZip)
  const installFromCommand = useSkillsLabStore(s => s.installFromCommand)
  const clearInstallFeedback = useSkillsLabStore(s => s.clearInstallFeedback)
  const previewRemoveDuplicates = useSkillsLabStore(s => s.previewRemoveDuplicates)
  const removeDuplicates = useSkillsLabStore(s => s.removeDuplicates)
  const plugins = useSkillsLabStore(s => s.plugins)
  const pluginsLoaded = useSkillsLabStore(s => s.pluginsLoaded)
  const loadPlugins = useSkillsLabStore(s => s.loadPlugins)
  const activeOriginFilter = useSkillsLabStore(s => s.activeOriginFilter)
  const setActiveOriginFilter = useSkillsLabStore(s => s.setActiveOriginFilter)
  const activePluginFilter = useSkillsLabStore(s => s.activePluginFilter)
  const setActivePluginFilter = useSkillsLabStore(s => s.setActivePluginFilter)
  const previewDeleteSkill = useSkillsLabStore(s => s.previewDeleteSkill)
  const deleteSkill = useSkillsLabStore(s => s.deleteSkill)
  const categorizeSkill = useSkillsLabStore(s => s.categorizeSkill)
  const deleteAgent = useSkillsLabStore(s => s.deleteAgent)
  const deletingAgentId = useSkillsLabStore(s => s.deletingAgentId)
  const hasApiKey = useSkillsLabStore(s => s.hasApiKey)
  const hasEmbeddings = useSkillsLabStore(s => s.hasEmbeddings)
  const embeddingSkillCount = useSkillsLabStore(s => s.embeddingSkillCount)
  const isIndexing = useSkillsLabStore(s => s.isIndexing)
  const isSemanticSearching = useSkillsLabStore(s => s.isSemanticSearching)
  const semanticResults = useSkillsLabStore(s => s.semanticResults)
  const semanticScores = useSkillsLabStore(s => s.semanticScores)
  const loadEmbeddingsStatus = useSkillsLabStore(s => s.loadEmbeddingsStatus)
  const buildIndex = useSkillsLabStore(s => s.buildIndex)
  const runSemanticSearch = useSkillsLabStore(s => s.runSemanticSearch)
  const clearSemanticResults = useSkillsLabStore(s => s.clearSemanticResults)

  // Resizable panels — modernized proportions
  const { size: navWidth, handleProps: navHandleProps } = useResizable({
    key: `${p}-nav-w`, initial: 240, min: 200, max: 380,
  })
  const { size: resultsWidth, handleProps: resultsHandleProps } = useResizable({
    key: `${p}-results-w`, initial: 340, min: 240, max: 520,
  })
  const { size: fileTreeWidth, handleProps: fileTreeHandleProps } = useResizable({
    key: `${p}-filetree-w`, initial: 200, min: 140, max: 360,
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [focusedPanel, setFocusedPanel] = useState<FocusedPanel>(null)
  const [panelsReady, setPanelsReady] = useState(false)
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null)
  const [duplicateCleanupPending, setDuplicateCleanupPending] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  const [installDragActive, setInstallDragActive] = useState(false)
  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [installNotice, setInstallNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  // View mode + density + command palette
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const density = 'compact' as const
  const [commandOpen, setCommandOpen] = useState(false)

  // Dark / light mode — uses global theme store
  const { theme: colorMode } = useThemeStore()

  // Precompute skill counts per agent and dept-per-agent to avoid O(agents*skills) in render
  const skillsByAgentId = useMemo(() => {
    const map = new Map<string, UnifiedSkill[]>()
    for (const agent of agents) map.set(agent.id, [])
    for (const skill of skills) {
      for (const agentId of skill.installedAgentIds) {
        map.get(agentId)?.push(skill)
      }
    }
    return map
  }, [skills, agents])

  const deptsByAgentId = useMemo(() => {
    const map = new Map<string, { dept: string; count: number }[]>()
    for (const [agentId, agentSkills] of skillsByAgentId) {
      const deptCounts = new Map<string, number>()
      for (const skill of agentSkills) {
        deptCounts.set(skill.department, (deptCounts.get(skill.department) || 0) + 1)
      }
      map.set(agentId, [...deptCounts.entries()]
        .map(([dept, count]) => ({ dept, count }))
        .sort((a, b) => a.dept.localeCompare(b.dept)))
    }
    return map
  }, [skillsByAgentId])

  // Load plugins when entering claude-code mode
  useEffect(() => {
    if (sidebarMode === 'claude-code') void loadPlugins()
  }, [sidebarMode, loadPlugins])

  // Claude Code scoped skills and department counts
  const claudeSkills = useMemo(() => {
    return skills.filter(skill =>
      Object.values(skill.sourceVariants).some(v => v.ecosystem === 'claude'),
    )
  }, [skills])

  const claudeDeptCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of claudeSkills) map.set(s.department, (map.get(s.department) || 0) + 1)
    return map
  }, [claudeSkills])

  const claudeDepartments = useMemo(() =>
    [...claudeDeptCounts.keys()].sort(),
  [claudeDeptCounts])

  const scopedSkills = useMemo(() => {
    if (sidebarMode === 'agents' && activeAgentFilter) {
      return skills.filter(s => s.installedAgentIds.includes(activeAgentFilter))
    }
    if (sidebarMode === 'claude-code') return claudeSkills
    return skills
  }, [skills, claudeSkills, sidebarMode, activeAgentFilter])

  // Precompute counts for departments and sources to avoid inline .filter() in render
  const deptCounts = useMemo(() => {
    const pool = sidebarMode === 'agents' ? scopedSkills : sidebarMode === 'claude-code' ? claudeSkills : skills
    const map = new Map<string, number>()
    for (const s of pool) map.set(s.department, (map.get(s.department) || 0) + 1)
    return map
  }, [skills, scopedSkills, claudeSkills, sidebarMode])

  const sourceCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of skills) {
      for (const srcId of Object.keys(s.sourceVariants)) {
        map.set(srcId, (map.get(srcId) || 0) + 1)
      }
    }
    return map
  }, [skills])

  const originCounts = useMemo(() => {
    const counts = { custom: 0, community: 0, 'built-in': 0 }
    for (const s of skills) counts[s.originCategory]++
    return counts
  }, [skills])

  const hasActiveFilters = Boolean(
    searchQuery.trim()
    || activeSavedView !== 'all'
    || activeSourceFilter
    || activeAgentFilter
    || activeFamilyFilter
    || activeOriginFilter
    || activePluginFilter
    || duplicateOnly
    || activeDepartments.size > 0,
  )
  const selectedFamily = activeFamilyFilter
    ? families.find(family => family.key === activeFamilyFilter) || null
    : null
  const selectedAgent = activeAgentFilter
    ? agents.find(agent => agent.id === activeAgentFilter) || null
    : null
  const selectedSource = activeSourceFilter
    ? sources.find(source => source.id === activeSourceFilter) || null
    : null

  const filteredSkills = useMemo(
    () => getFilteredSkills(),
    [getFilteredSkills, skills, sources, agents, searchQuery, activeSavedView, activeSourceFilter, activeAgentFilter, activeFamilyFilter, activeOriginFilter, activePluginFilter, duplicateOnly, activeDepartments, semanticResults],
  )
  const starredCount = starredSkillIds.size
  const removableDuplicateSkillIds = useMemo(
    () => filteredSkills
      .filter(skill => Object.values(skill.sourceVariants).some(
        variant => variant.kind === 'library' && variant.sourceId !== skill.canonicalSource,
      ))
      .map(skill => skill.id),
    [filteredSkills],
  )
  const removableDuplicateCount = useMemo(
    () => filteredSkills.reduce((count, skill) => (
      count + Object.values(skill.sourceVariants).filter(
        variant => variant.kind === 'library' && variant.sourceId !== skill.canonicalSource,
      ).length
    ), 0),
    [filteredSkills],
  )

  const selectedSkill = expandedSkillId ? skills.find(skill => skill.id === expandedSkillId) || null : null
  // Derive variant from the agent's workspace source if agent is filtered, else canonical
  const selectedVariant = useMemo(() => {
    if (!selectedSkill) return null
    if (activeAgentFilter) {
      // Find the variant from the agent's workspace source
      const agentWorkspaceKey = `workspace-${activeAgentFilter}`
      const agentVariant = selectedSkill.sourceVariants[agentWorkspaceKey]
      if (agentVariant) return agentVariant
    }
    return selectedSkill.sourceVariants[selectedSkill.canonicalSource]
      || Object.values(selectedSkill.sourceVariants)[0]
      || null
  }, [selectedSkill, activeAgentFilter])
  const selectedSkillHasClaude = Boolean(selectedSkill?.sourceVariants.claude)
  const selectedClaudeVariantPath = selectedSkill?.sourceVariants.claude?.path || null
  const selectedSkillRoot = selectedVariant?.path
    ? selectedVariant.path.replace(/\/[^/]+$/, '')
    : null
  const selectedSkillFiles = selectedSkillRoot ? (skillFileTreeCache[selectedSkillRoot] || []) : []
  const editorFilePath = activeSkillFile || selectedVariant?.previewPath || selectedSkill?.previewPath || null
  const editorCacheKey = selectedSkill && editorFilePath
    ? `${selectedSkill.id}:${editorFilePath}`
    : selectedSkill?.id || null
  const editorContent = editorCacheKey ? (skillContentCache[editorCacheKey] || null) : null

  useEffect(() => { loadFromAPI() }, [loadFromAPI])

  // Load embeddings status on mount
  useEffect(() => { void loadEmbeddingsStatus() }, [loadEmbeddingsStatus])

  // Debounced semantic search (400ms after typing)
  useEffect(() => {
    if (!searchQuery.trim()) {
      clearSemanticResults()
      return
    }
    if (!hasEmbeddings) return
    const timer = setTimeout(() => {
      void runSemanticSearch(searchQuery)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, hasEmbeddings, runSemanticSearch, clearSemanticResults])

  // Cross-view refresh: reload when agent data changes (e.g. deletion from Canvas)
  useEffect(() => {
    const handler = () => void loadFromAPI(true)
    window.addEventListener('agent-hub:data-changed', handler)
    return () => window.removeEventListener('agent-hub:data-changed', handler)
  }, [loadFromAPI])

  useEffect(() => {
    if (!selectedSkillRoot) return
    void loadSkillFileTree(selectedSkillRoot)
  }, [selectedSkillRoot, loadSkillFileTree])

  useEffect(() => {
    if (!selectedSkill || !selectedVariant?.previewPath) return
    const nextPath = activeSkillFile || selectedVariant.previewPath
    if (!activeSkillFile) setActiveSkillFile(selectedVariant.previewPath)
    void loadSkillContent(selectedSkill.id, nextPath)
  }, [selectedSkill?.id, selectedVariant?.previewPath, activeSkillFile, loadSkillContent, setActiveSkillFile])

  useEffect(() => {
    const t = setTimeout(() => setPanelsReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!installDialogOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setInstallDialogOpen(false)
        setInstallDragActive(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [installDialogOpen])

  // Cmd+K listener — skip when focused on inputs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        const target = e.target as HTMLElement
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable) return
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const pc = (base: string, panel: FocusedPanel) => {
    let c = `${p}-panel ${base}`
    if (panelsReady) c += ` ${p}-visible`
    if (focusedPanel === panel) c += ` ${p}-focused`
    else if (focusedPanel && focusedPanel !== panel) c += ` ${p}-dimmed`
    return c
  }

  const openSkill = (skillId: string) => setExpandedSkill(skillId)

  const buildSkillSections = (skillList: UnifiedSkill[]) => {
    if (skillList.length === 0) return []
    const familyOrder = new Map(families.map((family, index) => [family.key, index]))
    const grouped = new Map<string, { key: string; label: string; skills: UnifiedSkill[] }>()
    const standalone: UnifiedSkill[] = []
    for (const skill of skillList) {
      if (skill.familyKey && skill.familyLabel) {
        const current = grouped.get(skill.familyKey)
        if (current) current.skills.push(skill)
        else grouped.set(skill.familyKey, { key: skill.familyKey, label: skill.familyLabel, skills: [skill] })
      } else {
        standalone.push(skill)
      }
    }
    if (grouped.size === 0) return [{ key: 'all', label: null as string | null, skills: skillList }]
    const sections = [...grouped.values()].sort((left, right) => {
      const leftOrder = familyOrder.get(left.key) ?? Number.MAX_SAFE_INTEGER
      const rightOrder = familyOrder.get(right.key) ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return left.label.localeCompare(right.label)
    })
    if (standalone.length > 0) sections.push({ key: 'standalone', label: 'Standalone', skills: standalone })
    return sections
  }

  const toggleAgentSkill = async (agentId: string) => {
    if (!selectedSkill) return
    const isInstalled = selectedSkill.installedAgentIds.includes(agentId)
    if (!isInstalled && !selectedClaudeVariantPath) return
    setPendingAgentId(agentId)
    try {
      if (isInstalled) await unassignSkill(agentId, selectedSkill.id)
      else if (selectedClaudeVariantPath) await assignSkill(agentId, selectedClaudeVariantPath)
    } catch (err) {
      console.error('Skill toggle failed:', err)
    } finally {
      setPendingAgentId(null)
    }
  }

  const handleRemoveDuplicates = async (skillIds: string[]) => {
    if (skillIds.length === 0) { window.alert('No removable duplicate sources found.'); return }
    setDuplicateCleanupPending(true)
    try {
      const plan = await previewRemoveDuplicates(skillIds)
      if (plan.totalVariants === 0) { window.alert('No removable duplicate sources found.'); return }
      const confirmLines = [
        `Remove ${plan.totalVariants} duplicate source variant(s) across ${plan.totalSkills} skill(s)?`,
        'The primary source for each skill will be kept.',
        plan.totalInstalls > 0 ? `This will also remove ${plan.totalInstalls} linked agent install(s).` : 'No agent installs will be removed.',
      ]
      if (plan.blockedVariants > 0) confirmLines.push(`${plan.blockedVariants} duplicate variant(s) cannot be removed automatically and will be skipped.`)
      if (!window.confirm(confirmLines.join('\n\n'))) return
      const result = await removeDuplicates(skillIds)
      window.alert(result.totalVariants > 0 ? `Removed ${result.totalVariants} duplicate variant(s) across ${result.totalSkills} skill(s).` : 'No removable duplicate sources were found.')
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Duplicate cleanup failed')
    } finally {
      setDuplicateCleanupPending(false)
    }
  }

  const handleZipInstall = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) { setInstallNotice({ tone: 'error', text: 'Only .zip skill bundles are supported.' }); return }
    clearInstallFeedback()
    setInstallNotice(null)
    try {
      await installFromZip(file)
      setInstallNotice({ tone: 'success', text: `Installed ${file.name} into the shared library.` })
      setCommandInput('')
    } catch (err) {
      setInstallNotice({ tone: 'error', text: err instanceof Error ? err.message : 'ZIP install failed' })
    }
  }

  const handleCommandInstall = async () => {
    const trimmed = commandInput.trim()
    if (!trimmed) { setInstallNotice({ tone: 'error', text: 'Paste an npx command first.' }); return }
    clearInstallFeedback()
    setInstallNotice(null)
    try {
      await installFromCommand(trimmed)
      setInstallNotice({ tone: 'success', text: 'Command finished and installed a new skill.' })
      setCommandInput('')
    } catch (err) {
      setInstallNotice({ tone: 'error', text: err instanceof Error ? err.message : 'Command install failed' })
    }
  }

  const renderSkillRow = (skill: UnifiedSkill) => {
    const agentWorkspaceKey = activeAgentFilter ? `workspace-${activeAgentFilter}` : null
    const variant = (agentWorkspaceKey ? skill.sourceVariants[agentWorkspaceKey] : null)
      || skill.sourceVariants[skill.canonicalSource] || Object.values(skill.sourceVariants)[0]
    const sourceLabel = variant?.sourceLabel || skill.canonicalSource
    const meta = sourceLabel
    const semScore = semanticScores.get(skill.id)

    return (
      <button
        key={skill.id}
        className={`${p}-skill-row${expandedSkillId === skill.id ? ' active' : ''}${skill.isDuplicate ? ` ${p}-skill-row-duplicate` : ''}${semScore !== undefined ? ` ${p}-skill-row-semantic` : ''}`}
        onClick={e => { e.stopPropagation(); openSkill(skill.id) }}
      >
        <span className={`${p}-skill-name`}>{skill.displayName}</span>
        {semScore !== undefined && (
          <span className={`${p}-semantic-badge`} title={`Semantic similarity: ${(semScore * 100).toFixed(0)}%`}>
            <Sparkles size={10} strokeWidth={1.5} />
            {(semScore * 100).toFixed(0)}%
          </span>
        )}
        <span className={`${p}-skill-meta`}>{meta}</span>
        <span
          role="button"
          tabIndex={0}
          className={`${p}-star-btn${starredSkillIds.has(skill.id) ? ' starred' : ''}`}
          onClick={e => { e.stopPropagation(); void toggleStarSkill(skill.id) }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); void toggleStarSkill(skill.id) } }}
          title={starredSkillIds.has(skill.id) ? 'Unstar' : 'Star'}
          aria-pressed={starredSkillIds.has(skill.id)}
          aria-label={starredSkillIds.has(skill.id) ? `Unstar ${skill.displayName}` : `Star ${skill.displayName}`}
        >
          <Star size={12} strokeWidth={1.5} fill={starredSkillIds.has(skill.id) ? 'currentColor' : 'none'} />
        </span>
      </button>
    )
  }

  const renderGroupedSkillList = (skillList: UnifiedSkill[]) => {
    const sections = buildSkillSections(skillList)
    return (
      <div className={`${p}-skill-groups`}>
        {sections.map(section => (
          <div key={section.key} className={`${p}-skill-group-block`}>
            {section.label && (
              <div className={`${p}-skill-group-head`}>
                <span className={`${p}-skill-group-title`}>{section.label}</span>
                <span className={`${p}-skill-group-count`}>{section.skills.length}</span>
              </div>
            )}
            <div className={`${p}-skill-list`}>
              {section.skills.map(skill => renderSkillRow(skill))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Faceted filter sections — family only (agent handled by sidebar mode)
  const facetSections = useMemo(() => {
    const familyItems = families.map(f => ({ value: f.key, label: f.label, count: f.count }))
    return [
      { id: 'family', label: 'Family', items: familyItems, activeValue: activeFamilyFilter, onSelect: (v: string | null) => setActiveFamilyFilter(v) },
    ]
  }, [families, activeFamilyFilter, setActiveFamilyFilter])

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []
    if (activeSavedView === 'starred') chips.push({ key: 'view', label: 'Starred', onRemove: () => setActiveSavedView('all') })
    if (activeSavedView === 'recent') chips.push({ key: 'view', label: 'Sort: Recent first', onRemove: () => setActiveSavedView('all') })
    if (duplicateOnly) chips.push({ key: 'dupes', label: 'Duplicates', onRemove: () => toggleDuplicateOnly() })
    if (selectedFamily) chips.push({ key: 'family', label: `Family: ${selectedFamily.label}`, onRemove: () => setActiveFamilyFilter(null) })
    if (selectedAgent) chips.push({ key: 'agent', label: `Agent: ${selectedAgent.label}`, onRemove: () => setActiveAgentFilter(null) })
    if (selectedSource) chips.push({ key: 'source', label: `Source: ${selectedSource.label}`, onRemove: () => setActiveSourceFilter(null) })
    if (activeOriginFilter) {
      const originLabels: Record<string, string> = { custom: 'Custom Made', community: 'Community', 'built-in': 'Built-in' }
      chips.push({ key: 'origin', label: `Origin: ${originLabels[activeOriginFilter]}`, onRemove: () => setActiveOriginFilter(null) })
    }
    if (activePluginFilter) {
      const pluginName = plugins.find(pl => pl.id === activePluginFilter)?.name || activePluginFilter
      chips.push({ key: 'plugin', label: `Plugin: ${pluginName}`, onRemove: () => setActivePluginFilter(null) })
    }
    for (const dept of activeDepartments) {
      chips.push({ key: `dept-${dept}`, label: dept, onRemove: () => toggleDepartment(dept) })
    }
    return chips
  }, [activeSavedView, duplicateOnly, selectedFamily, selectedAgent, selectedSource, activeOriginFilter, activeDepartments, setActiveSavedView, toggleDepartment, toggleDuplicateOnly, setActiveFamilyFilter, setActiveAgentFilter, setActiveSourceFilter, setActiveOriginFilter])

  const listedSkills = filteredSkills
  const navSkillCount = skills.length

  // Results panel title: show active department if single, else generic
  const resultsPanelTitle = useMemo(() => {
    if (activeDepartments.size === 1) return [...activeDepartments][0]
    if (selectedAgent) return `${selectedAgent.emoji} ${selectedAgent.label}`
    return 'Skills'
  }, [activeDepartments, selectedAgent])

  if (loading && !loaded) {
    return (
      <div className={`${p}-canvas`} data-theme={colorMode} data-variant={variant}>
        <div className={`${p}-loading-state`}>
          <div className={`${p}-loading-spinner`} />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  if (error && !loaded) {
    return (
      <div className={`${p}-canvas`} data-theme={colorMode} data-variant={variant}>
        <div className={`${p}-loading-state ${p}-error`}>
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`${p}-canvas`} data-theme={colorMode} data-variant={variant}>
      <div className={`${p}-panels`}>
        {/* ═══ Nav ═══ */}
        <div className={`${p}-nav-shell`}>
          <aside
            className={pc(`${p}-nav`, 'nav')}
            onClick={() => setFocusedPanel('nav')}
            style={{ width: navWidth, minWidth: navWidth }}
          >
            {/* Header */}
            <header className={`${p}-panel-header`}>
              <div className={`${p}-traffic-lights`}>
                <span className={`${p}-traffic-dot ${p}-dot-close`} />
                <span className={`${p}-traffic-dot ${p}-dot-minimize`} />
                <span className={`${p}-traffic-dot ${p}-dot-maximize`} />
              </div>
              <h3 className={`${p}-panel-title`}>Skills</h3>
              <span className={`${p}-panel-badge`}>{navSkillCount}</span>
            </header>

            {/* Search + Scope */}
            <div className={`${p}-nav-controls`}>
              <div className={`${p}-search-bar`} onClick={e => e.stopPropagation()}>
                <Search size={14} strokeWidth={1.5} className={`${p}-search-icon`} />
                <input
                  className={`${p}-search-input`}
                  placeholder={hasEmbeddings ? 'Search skills (semantic)...' : 'Search skills...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {isSemanticSearching && (
                  <span className={`${p}-search-spinner`} title="Semantic search...">
                    <Sparkles size={12} strokeWidth={1.5} />
                  </span>
                )}
                {searchQuery && (
                  <button className={`${p}-search-clear`} onClick={() => setSearchQuery('')}>&times;</button>
                )}
              </div>
              {hasApiKey && (
                <div className={`${p}-embedding-controls`} onClick={e => e.stopPropagation()}>
                  <span
                    className={`${p}-embedding-dot${hasEmbeddings ? ' active' : ''}`}
                    title={hasEmbeddings
                      ? `Semantic index: ${embeddingSkillCount} skills`
                      : 'No semantic index'
                    }
                  />
                  <button
                    className={`${p}-embedding-btn`}
                    onClick={() => void buildIndex(!hasEmbeddings ? false : true)}
                    disabled={isIndexing}
                    title={hasEmbeddings ? 'Rebuild semantic index' : 'Build semantic index'}
                  >
                    {isIndexing ? 'Indexing...' : hasEmbeddings ? 'Rebuild' : 'Build Index'}
                  </button>
                </div>
              )}

              <div className={`${p}-mode-switch`} onClick={e => e.stopPropagation()}>
                <button
                  className={`${p}-mode-pill${sidebarMode === 'agents' ? ' active' : ''}`}
                  onClick={() => setSidebarMode('agents')}
                >
                  Agents
                </button>
                <button
                  className={`${p}-mode-pill${sidebarMode === 'claude-code' ? ' active' : ''}`}
                  onClick={() => setSidebarMode('claude-code')}
                >
                  Claude Code
                </button>
              </div>
            </div>

            {/* Scrollable nav body */}
            <div className={`${p}-nav-tree`}>
              <div className={`${p}-nav-divider`} />

              {sidebarMode === 'agents' ? (
                <>
                  {/* Agent list */}
                  <div className={`${p}-nav-section`}>
                    <div className={`${p}-nav-section-label`}>Agents</div>
                    {agents.map(agent => {
                      const agentSkills = skillsByAgentId.get(agent.id) || []
                      const agentSkillCount = agentSkills.length
                      const isActive = activeAgentFilter === agent.id
                      const isExpanded = expandedAgentNavIds.has(agent.id)
                      const agentDepts = isExpanded ? (deptsByAgentId.get(agent.id) || []) : []
                      return (
                        <div key={agent.id}>
                          <button
                            className={`${p}-agent-nav-item${isActive ? ' active' : ''}${isExpanded ? ' expanded' : ''}`}
                            onClick={e => {
                              e.stopPropagation()
                              setActiveAgentFilter(isActive ? null : agent.id)
                              if (!isActive) {
                                if (!expandedAgentNavIds.has(agent.id)) toggleAgentNavExpanded(agent.id)
                              }
                            }}
                          >
                            <span className={`${p}-agent-nav-emoji`}>{agent.emoji}</span>
                            <span className={`${p}-agent-nav-label`}>{agent.label}</span>
                            <span className={`${p}-nav-section-item-count`}>{agentSkillCount}</span>
                            <span
                              className={`${p}-agent-nav-delete`}
                              role="button"
                              tabIndex={0}
                              title={deletingAgentId === agent.id ? 'Deleting...' : `Delete ${agent.label}`}
                              onClick={e => {
                                e.stopPropagation()
                                if (deletingAgentId) return
                                const confirmed = window.confirm(
                                  `Delete agent "${agent.label}"?\n\nThis permanently removes its workspace, installed skills, cron jobs, and config references.`,
                                )
                                if (confirmed) void deleteAgent(agent.id)
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (deletingAgentId) return
                                  const confirmed = window.confirm(
                                    `Delete agent "${agent.label}"?\n\nThis permanently removes its workspace, installed skills, cron jobs, and config references.`,
                                  )
                                  if (confirmed) void deleteAgent(agent.id)
                                }
                              }}
                            >
                              <Trash2 size={12} strokeWidth={1.5} />
                            </span>
                            <span
                              className={`${p}-agent-nav-chevron`}
                              onClick={e => { e.stopPropagation(); toggleAgentNavExpanded(agent.id) }}
                            >
                              {isExpanded ? <ChevronDown size={12} strokeWidth={1.5} /> : <ChevronRight size={12} strokeWidth={1.5} />}
                            </span>
                          </button>
                          {isExpanded && agentDepts.length > 0 && (
                            <div className={`${p}-agent-dept-list`}>
                              {agentDepts.map(({ dept, count }) => {
                                const isDeptActive = activeDepartments.has(dept)
                                return (
                                  <button
                                    key={dept}
                                    className={`${p}-agent-dept-item${isDeptActive ? ' active' : ''}`}
                                    onClick={e => {
                                      e.stopPropagation()
                                      // Enforce agent scope: selecting a dept inside an agent also sets the agent filter
                                      if (!isActive) setActiveAgentFilter(agent.id)
                                      toggleDepartment(dept)
                                    }}
                                  >
                                    <span>{dept}</span>
                                    <span className={`${p}-nav-section-item-count`}>{count}</span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className={`${p}-nav-divider`} />

                  {/* Departments */}
                  <div className={`${p}-nav-section`}>
                    <div className={`${p}-nav-section-label`}>Departments</div>
                    {departments.map(dept => {
                      const isActive = activeDepartments.has(dept)
                      return (
                        <button
                          key={dept}
                          className={`${p}-nav-section-item${isActive ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                        >
                          <span className={`${p}-nav-section-item-left`}>
                            <span className={`${p}-nav-section-item-name`}>{dept}</span>
                          </span>
                          <span className={`${p}-nav-section-item-count`}>{deptCounts.get(dept) || 0}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <>
                  {/* Installed Plugins */}
                  <div className={`${p}-nav-section`}>
                    <div className={`${p}-nav-section-label`}>Installed Plugins</div>
                    {!pluginsLoaded ? (
                      <div className={`${p}-nav-section-empty`}>Loading plugins...</div>
                    ) : plugins.length === 0 ? (
                      <div className={`${p}-nav-section-empty`}>No plugins installed</div>
                    ) : (
                      plugins.map(plugin => {
                        const isActive = activePluginFilter === plugin.id
                        return (
                          <button
                            key={plugin.id}
                            className={`${p}-nav-section-item${isActive ? ' active' : ''}`}
                            onClick={e => { e.stopPropagation(); setActivePluginFilter(isActive ? null : plugin.id) }}
                          >
                            <span className={`${p}-nav-section-item-left`}>
                              <span
                                className={`${p}-nav-section-item-dot`}
                                style={{ background: plugin.enabled ? '#22c55e' : '#6b7280' }}
                              />
                              <span className={`${p}-nav-section-item-name`}>{plugin.name}</span>
                            </span>
                            <span className={`${p}-nav-section-item-count`}>{plugin.version || plugin.skillCount}</span>
                          </button>
                        )
                      })
                    )}
                  </div>

                  <div className={`${p}-nav-divider`} />

                  {/* Skills Library — claude departments */}
                  <div className={`${p}-nav-section`}>
                    <div className={`${p}-nav-section-label`}>Skills Library</div>
                    {claudeDepartments.map(dept => {
                      const isActive = activeDepartments.has(dept)
                      return (
                        <button
                          key={dept}
                          className={`${p}-nav-section-item${isActive ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                        >
                          <span className={`${p}-nav-section-item-left`}>
                            <span className={`${p}-nav-section-item-name`}>{dept}</span>
                          </span>
                          <span className={`${p}-nav-section-item-count`}>{claudeDeptCounts.get(dept) || 0}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* ═══ Shared sections (both modes) ═══ */}

              <div className={`${p}-nav-divider`} />

              {/* Saved Views */}
              <div className={`${p}-nav-section`}>
                <div className={`${p}-nav-section-label`}>Views</div>
                <button
                  className={`${p}-nav-section-item${activeSavedView === 'starred' ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSavedView(activeSavedView === 'starred' ? 'all' : 'starred') }}
                >
                  <span className={`${p}-nav-section-item-left`}>
                    <Star size={13} strokeWidth={1.5} fill={activeSavedView === 'starred' ? 'currentColor' : 'none'} />
                    <span className={`${p}-nav-section-item-name`}>Starred</span>
                  </span>
                  <span className={`${p}-nav-section-item-count`}>{starredCount}</span>
                </button>
                <button
                  className={`${p}-nav-section-item${activeSavedView === 'recent' ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSavedView(activeSavedView === 'recent' ? 'all' : 'recent') }}
                >
                  <span className={`${p}-nav-section-item-left`}>
                    <Feather size={13} strokeWidth={1.5} />
                    <span className={`${p}-nav-section-item-name`}>Recent</span>
                  </span>
                </button>
              </div>

              <div className={`${p}-nav-divider`} />

              {/* Origin */}
              <div className={`${p}-nav-section`}>
                <div className={`${p}-nav-section-label`}>Origin</div>
                {([
                  { key: 'custom' as const, label: 'Custom Made', Icon: Sparkles },
                  { key: 'community' as const, label: 'Community', Icon: Globe },
                  { key: 'built-in' as const, label: 'Built-in', Icon: Package },
                ]).map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    className={`${p}-nav-section-item${activeOriginFilter === key ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); setActiveOriginFilter(key) }}
                  >
                    <span className={`${p}-nav-section-item-left`}>
                      <Icon size={13} strokeWidth={1.5} />
                      <span className={`${p}-nav-section-item-name`}>{label}</span>
                    </span>
                    <span className={`${p}-nav-section-item-count`}>{originCounts[key]}</span>
                  </button>
                ))}
              </div>

              <div className={`${p}-nav-divider`} />

              {/* Sources */}
              <div className={`${p}-nav-section`}>
                <div className={`${p}-nav-section-label`}>Sources</div>
                {sources.map(source => {
                  const isActive = activeSourceFilter === source.id
                  return (
                    <button
                      key={source.id}
                      className={`${p}-nav-section-item${isActive ? ' active' : ''}`}
                      onClick={e => { e.stopPropagation(); setActiveSourceFilter(isActive ? null : source.id) }}
                    >
                      <span className={`${p}-nav-section-item-left`}>
                        <span
                          className={`${p}-nav-section-item-dot`}
                          style={{ background: source.color }}
                        />
                        <span className={`${p}-nav-section-item-name`}>{source.label}</span>
                      </span>
                      <span className={`${p}-nav-section-item-count`}>{sourceCounts.get(source.id) || 0}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Status */}
            <div className={`${p}-nav-status`}>
              <span>{listedSkills.length} of {skills.length}</span>
              {hasActiveFilters && (
                <button className={`${p}-nav-status-clear`} onClick={e => { e.stopPropagation(); clearAllFilters() }}>
                  Clear
                </button>
              )}
            </div>
          </aside>

          <div className={`${p}-panel-resizer`} {...navHandleProps} />
        </div>

        {/* ═══ Results ═══ */}
        <aside
          className={pc(`${p}-results-panel`, 'results')}
          onClick={() => setFocusedPanel('results')}
          style={{ width: resultsWidth, minWidth: resultsWidth }}
        >
          <header className={`${p}-panel-header ${p}-results-header`}>
            <h3 className={`${p}-panel-title`}>{resultsPanelTitle}</h3>
            <div className={`${p}-results-header-actions`}>
              <div className={`${p}-view-toggles`}>
                <button
                  className={`${p}-view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setViewMode('list') }}
                  title="List view"
                >
                  <List size={13} strokeWidth={1.5} />
                </button>
                <button
                  className={`${p}-view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setViewMode('grid') }}
                  title="Grid view"
                >
                  <Grid3x3 size={13} strokeWidth={1.5} />
                </button>
              </div>

              <span className={`${p}-results-header-note`}>{listedSkills.length}</span>
              <button
                className={`${p}-results-install-btn`}
                onClick={e => { e.stopPropagation(); setInstallDialogOpen(true) }}
              >
                <Upload size={12} strokeWidth={1.7} />
                <span>Install</span>
              </button>
            </div>
          </header>

          <div className={`${p}-results-search`} onClick={e => e.stopPropagation()}>
            <Search size={13} strokeWidth={1.5} className={`${p}-results-search-icon`} />
            <input
              className={`${p}-results-search-input`}
              placeholder={hasEmbeddings ? 'Search skills (semantic)...' : 'Filter skills...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className={`${p}-results-search-clear`} onClick={() => setSearchQuery('')}>&times;</button>
            )}
          </div>

          <ActiveFiltersBar chips={activeFilterChips} onClearAll={clearAllFilters} />

          <div className={`${p}-results-panel-body`}>
            {listedSkills.length === 0 ? (
              <div className={`${p}-no-results ${p}-no-results-block`}>
                No skills match the current filters.
                <div className={`${p}-no-results-actions`}>
                  {activeFamilyFilter && (
                    <button className={`${p}-no-results-action`} onClick={() => setActiveFamilyFilter(null)}>Remove family filter</button>
                  )}
                  {activeAgentFilter && (
                    <button className={`${p}-no-results-action`} onClick={() => setActiveAgentFilter(null)}>Remove agent filter</button>
                  )}
                  <button className={`${p}-no-results-action`} onClick={() => clearAllFilters()}>Clear all filters</button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              <SkillCardView
                skills={listedSkills}
                activeSkillId={expandedSkillId}
                starredIds={starredSkillIds}
                onSelect={openSkill}
                onToggleStar={id => void toggleStarSkill(id)}
              />
            ) : (
              <div className={`${p}-density-${density}`}>
                {renderGroupedSkillList(listedSkills)}
              </div>
            )}

            {removableDuplicateCount > 0 && (
              <div className={`${p}-filter-summary`} style={{ margin: '8px' }} onClick={e => e.stopPropagation()}>
                <span className={`${p}-filter-summary-count`}>{removableDuplicateCount} removable duplicates</span>
                <div className={`${p}-filter-actions`}>
                  <button
                    className={`${p}-filter-bulk`}
                    onClick={() => { void handleRemoveDuplicates(removableDuplicateSkillIds) }}
                    disabled={duplicateCleanupPending}
                  >
                    {duplicateCleanupPending ? 'Removing...' : 'Remove duplicates'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className={`${p}-panel-resizer`} {...resultsHandleProps} />

        {/* ═══ Editor ═══ */}
        {selectedSkill ? (
          <main
            className={pc(`${p}-editor-panel`, 'editor')}
            onClick={() => setFocusedPanel('editor')}
          >
            <header className={`${p}-panel-header ${p}-editor-header`}>
              <div className={`${p}-panel-title-row`}>
                <button className={`${p}-back-btn`} onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                  <ArrowLeft size={16} strokeWidth={1.5} />
                </button>
                <div className={`${p}-filename-area`}>
                  <span className={`${p}-filename`}>{editorFilePath?.split('/').pop() || 'SKILL.md'}</span>
                  <span className={`${p}-file-meta`}>{selectedVariant?.sourceLabel || selectedSkill.displayName}</span>
                </div>
              </div>
              <div className={`${p}-results-header-actions`}>
                <button className={`${p}-editor-icon-btn`} onClick={e => e.stopPropagation()} title="Copy path">
                  <Copy size={13} strokeWidth={1.5} />
                </button>
                <button className={`${p}-editor-icon-btn`} onClick={e => e.stopPropagation()} title="Open externally">
                  <ExternalLink size={13} strokeWidth={1.5} />
                </button>
              </div>
            </header>
            <div className={`${p}-editor-body`}>
              <div className={`${p}-editor-shell`}>
                <aside className={`${p}-files-panel`} style={{ width: fileTreeWidth, minWidth: fileTreeWidth }}>
                  <div className={`${p}-files-panel-head`}>
                    <span className={`${p}-files-panel-label`}>Files</span>
                    {selectedSkillRoot && (
                      <span className={`${p}-files-panel-root`}>{selectedSkillRoot.split('/').pop()}</span>
                    )}
                  </div>
                  {loadingSkillTreeRoot === selectedSkillRoot && selectedSkillFiles.length === 0 ? (
                    <div className={`${p}-tree-empty`}>
                      <span className={`${p}-tree-empty-icon`}>&hellip;</span>
                      <span className={`${p}-tree-empty-text`}>Loading skill files...</span>
                    </div>
                  ) : (
                    <SkillFileTree files={selectedSkillFiles} prefix={p} />
                  )}
                </aside>
                <div className={`${p}-panel-resizer ${p}-filetree-resizer`} {...fileTreeHandleProps} />
                <div className={`${p}-editor-pane`}>
                  {editorContent !== null ? (
                    <SkillCMEditor
                      key={`${selectedSkill.id}:${editorFilePath || 'default'}:${colorMode}`}
                      content={editorContent}
                      filePath={editorFilePath}
                      theme={colorMode === 'dark' ? darkTheme : brandTheme}
                      prefix={p}
                    />
                  ) : (
                    <div className={`${p}-editor-loading`}>
                      <div className={`${p}-loading-spinner`} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        ) : (
          <div className={`${p}-welcome${panelsReady ? ` ${p}-visible` : ''}`}>
            <div className={`${p}-welcome-inner`}>
              <Feather size={28} strokeWidth={1} className={`${p}-welcome-icon`} />
              <h2 className={`${p}-welcome-title`}>Skills Lab</h2>
              <p className={`${p}-welcome-sub`}>
                Select a skill from the list to begin editing.
              </p>
              <div className={`${p}-welcome-stats`}>
                <span className={`${p}-stat`}>{skills.length} skills</span>
                <span className={`${p}-stat`}>{agents.length} agents</span>
                <span className={`${p}-stat`}>{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Inspector ═══ */}
        {selectedSkill && (
          <aside
            className={pc(`${p}-meta-panel`, 'meta')}
            onClick={() => setFocusedPanel('meta')}
          >
            <header className={`${p}-panel-header`}>
              <h3 className={`${p}-panel-title`}>Details</h3>
              <button
                className={`${p}-star-toggle${starredSkillIds.has(selectedSkill.id) ? ' starred' : ''}`}
                onClick={e => { e.stopPropagation(); void toggleStarSkill(selectedSkill.id) }}
                title={starredSkillIds.has(selectedSkill.id) ? 'Unstar skill' : 'Star skill'}
              >
                <Star size={14} strokeWidth={1.5} fill={starredSkillIds.has(selectedSkill.id) ? 'currentColor' : 'none'} />
              </button>
            </header>

            <section className={`${p}-meta-section`}>
              <div className={`${p}-meta-skill-name`}>{selectedSkill.displayName}</div>
              <div className={`${p}-meta-badges`}>
                <span className={`${p}-meta-badge`}>{selectedSkill.department}</span>
                {selectedVariant?.sourceLabel && <span className={`${p}-meta-badge`}>{selectedVariant.sourceLabel}</span>}
                {selectedSkillHasClaude && <span className={`${p}-meta-badge`}>Claude Code</span>}
              </div>

              <div className={`${p}-meta-divider`} />

              <p className={`${p}-meta-desc`}>
                {selectedSkill.familyLabel
                  ? `${selectedSkill.displayName} — part of the ${selectedSkill.familyLabel} skill family.`
                  : `${selectedSkill.displayName} — ${selectedSkill.department.toLowerCase()} skill.`}
                {selectedSkill.installedAgentIds.length > 0
                  ? ` Active on ${selectedSkill.installedAgentIds.length} agent(s).`
                  : ' Not installed on any agents.'}
              </p>

              <div className={`${p}-meta-divider`} />

              <div className={`${p}-meta-group-label`}>Department</div>
              <select
                className={`${p}-dept-select`}
                value={selectedSkill.department}
                onChange={async e => {
                  e.stopPropagation()
                  try { await categorizeSkill(selectedSkill.id, e.target.value) }
                  catch (err) { window.alert(err instanceof Error ? err.message : 'Failed to categorize') }
                }}
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <div className={`${p}-meta-group-label`} style={{ marginTop: 8 }}>Tags</div>
              <div className={`${p}-meta-tags`}>
                <span className={`${p}-tag`}>{selectedSkill.department}</span>
                {selectedVariant?.sourceLabel && <span className={`${p}-tag`}>{selectedVariant.sourceLabel}</span>}
                {selectedSkillHasClaude && <span className={`${p}-tag`}>Claude Code</span>}
                {selectedSkill.familyLabel && <span className={`${p}-tag`}>{selectedSkill.familyLabel}</span>}
              </div>
            </section>

            <section className={`${p}-meta-group`}>
              <div className={`${p}-meta-group-label`}>Agents</div>
              <div className={`${p}-meta-agents`}>
                {agents.map(agent => {
                  const isInstalled = selectedSkill.installedAgentIds.includes(agent.id)
                  return (
                    <div key={agent.id} className={`${p}-agent-badge`}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`${p}-agent-badge-emoji`}>{agent.emoji}</span>
                        {agent.label}
                      </span>
                      {isInstalled
                        ? <span className={`${p}-meta-agent-status`}>Installed</span>
                        : <span style={{ fontSize: 11, color: 'var(--sh-text-tertiary)' }}>Not installed</span>
                      }
                    </div>
                  )
                })}
              </div>
            </section>

            {selectedSkillHasClaude && (
              <section className={`${p}-meta-group`}>
                <div className={`${p}-meta-group-head`}>
                  <div className={`${p}-meta-group-label`}>Rollout</div>
                  <span className={`${p}-meta-caption`}>{selectedSkill.installedAgentIds.length}/{agents.length} active</span>
                </div>
                <div className={`${p}-rollout-grid`}>
                  {agents.map(agent => {
                    const isInstalled = selectedSkill.installedAgentIds.includes(agent.id)
                    const isPending = pendingAgentId === agent.id
                    return (
                      <button
                        key={agent.id}
                        className={`${p}-rollout-chip${isInstalled ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); void toggleAgentSkill(agent.id) }}
                        disabled={isPending}
                        title={isInstalled ? `Remove from ${agent.label}` : `Install for ${agent.label}`}
                      >
                        <span className={`${p}-rollout-chip-main`}>
                          <span className={`${p}-rollout-emoji`}>{agent.emoji}</span>
                          <span className={`${p}-rollout-name`}>{agent.label}</span>
                        </span>
                        <span className={`${p}-rollout-state`}>
                          {isPending ? '...' : isInstalled ? <Check size={12} strokeWidth={2} /> : 'Install'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            <section className={`${p}-meta-group`}>
              <div className={`${p}-meta-group-label`}>Presence</div>
              <div className={`${p}-meta-sources`}>
                {sources.map(src => (
                  <div key={src.id} className={`${p}-meta-source-row`}>
                    <span className={`${p}-meta-source-dot`} style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#E5E5E5' }} />
                    <span className={`${p}-meta-source-name`}>{src.label}</span>
                    <span className={`${p}-meta-source-kind ${selectedSkill.presence[src.id]}`}>{selectedSkill.presence[src.id]}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className={`${p}-meta-actions`}>
              <div className={`${p}-action-grid`}>
                <span title="Coming soon">
                  <button className={`${p}-action-btn ${p}-action-primary`} disabled onClick={e => e.stopPropagation()}>
                    <ExternalLink size={14} strokeWidth={1.5} />
                    <span className={`${p}-action-label`}>Deploy to All Agents</span>
                  </button>
                </span>
                <span title="Coming soon">
                  <button className={`${p}-action-btn`} disabled onClick={e => e.stopPropagation()}>
                    <Copy size={14} strokeWidth={1.5} />
                    <span className={`${p}-action-label`}>Duplicate</span>
                  </button>
                </span>
                <button
                  className={`${p}-action-btn ${p}-action-danger`}
                  onClick={async e => {
                    e.stopPropagation()
                    try {
                      const preview = await previewDeleteSkill(selectedSkill.id)
                      if (!preview.allowed) { window.alert(preview.message); return }
                      const lines = [`Delete "${selectedSkill.displayName}"?`]
                      if (preview.impactedInstalls.length > 0) {
                        lines.push(`This will remove it from ${preview.impactedInstalls.length} agent(s): ${preview.impactedInstalls.map(i => i.label).join(', ')}`)
                      }
                      lines.push(preview.message)
                      if (!window.confirm(lines.join('\n\n'))) return
                      await deleteSkill(selectedSkill.id)
                    } catch (err) {
                      window.alert(err instanceof Error ? err.message : 'Delete failed')
                    }
                  }}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className={`${p}-action-label`}>Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>

      {/* Status bar */}
      <StatusBar filtered={listedSkills.length} total={skills.length} scope={sidebarMode} hasFilters={hasActiveFilters} onResetFilters={clearAllFilters} />

      {/* Command palette */}
      {commandOpen && (
        <CommandPalette skills={skills} onSelectSkill={openSkill} onClose={() => setCommandOpen(false)} />
      )}

      {/* Install dialog */}
      {installDialogOpen && (
        <div className={`${p}-install-modal-backdrop`} onClick={() => { setInstallDialogOpen(false); setInstallDragActive(false) }}>
          <div
            className={`${p}-install-modal${installDragActive ? ' drag-active' : ''}`}
            onClick={e => e.stopPropagation()}
            onDragEnter={e => { e.preventDefault(); setInstallDragActive(true) }}
            onDragOver={e => { e.preventDefault(); setInstallDragActive(true) }}
            onDragLeave={e => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setInstallDragActive(false) }}
            onDrop={e => {
              e.preventDefault()
              setInstallDragActive(false)
              const file = Array.from(e.dataTransfer.files).find(item => item.name.toLowerCase().endsWith('.zip'))
              if (file) void handleZipInstall(file)
              else setInstallNotice({ tone: 'error', text: 'Drop a .zip skill bundle to install it.' })
            }}
          >
            <div className={`${p}-install-modal-head`}>
              <div className={`${p}-install-head`}>
                <span className={`${p}-install-kicker`}>Install skill</span>
                <span className={`${p}-install-caption`}>ZIP drop or npx command</span>
              </div>
              <button className={`${p}-install-close`} onClick={() => { setInstallDialogOpen(false); setInstallDragActive(false) }}>
                Close
              </button>
            </div>
            <div className={`${p}-install-actions`}>
              <button className={`${p}-install-zip-btn`} onClick={() => fileInputRef.current?.click()} disabled={installBusy}>
                <Upload size={12} strokeWidth={1.7} />
                <span>{installBusy ? 'Working\u2026' : 'Choose ZIP'}</span>
              </button>
              <span className={`${p}-install-drop-hint`}>or drop archive here</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              style={{ display: 'none' }}
              onChange={e => { const file = e.target.files?.[0]; if (file) void handleZipInstall(file); e.currentTarget.value = '' }}
            />
            <div className={`${p}-install-command-row`}>
              <div className={`${p}-install-command-input-wrap`}>
                <TerminalSquare size={12} strokeWidth={1.7} className={`${p}-install-command-icon`} />
                <input
                  className={`${p}-install-command-input`}
                  placeholder="npx ..."
                  value={commandInput}
                  onChange={e => setCommandInput(e.target.value)}
                  onFocus={() => clearInstallFeedback()}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleCommandInstall() } }}
                />
              </div>
              <button className={`${p}-install-command-btn`} onClick={() => void handleCommandInstall()} disabled={installBusy}>Run</button>
            </div>
            {(installNotice || installError || installLastOutput) && (
              <div className={`${p}-install-feedback-wrap`}>
                {(installNotice || installError) && (
                  <div className={`${p}-install-feedback ${(installNotice?.tone === 'error' || installError) ? 'error' : 'success'}`}>
                    {installNotice?.text || installError}
                  </div>
                )}
                {installLastOutput && <pre className={`${p}-install-output`}>{installLastOutput}</pre>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
