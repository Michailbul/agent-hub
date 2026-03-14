import { useEffect, useMemo, useRef, useState } from 'react'
import { useSkillsLabStore, type UnifiedSkill } from '@/store/skillsLab'
import { useResizable } from '@/lib/useResizable'
import { SkillCMEditor } from './SkillCMEditor'
import { SkillFileTree } from './SkillFileTree'
import { FacetedFilters } from './FacetedFilters'
import { ActiveFiltersBar } from './ActiveFiltersBar'
import { CommandPalette } from './CommandPalette'
import { SkillCardView } from './SkillCardView'
import { StatusBar } from './StatusBar'
import { brandTheme } from '@/lib/cmBrandTheme'
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Feather,
  Grid3x3,
  List,
  Package,
  Search,
  Star,
  TerminalSquare,
  Trash2,
  Upload,
} from 'lucide-react'
import './v11-kiln-light.css'

type FocusedPanel = 'nav' | 'results' | 'editor' | 'meta' | null

export function V11KilnLight() {
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
  const activeScope = useSkillsLabStore(s => s.activeScope)
  const setActiveScope = useSkillsLabStore(s => s.setActiveScope)
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

  // Resizable panels
  const { size: navWidth, handleProps: navHandleProps } = useResizable({
    key: 'kl-nav-w', initial: 280, min: 220, max: 420,
  })
  const { size: resultsWidth, handleProps: resultsHandleProps } = useResizable({
    key: 'kl-results-w', initial: 340, min: 260, max: 560,
  })
  const { size: fileTreeWidth, handleProps: fileTreeHandleProps } = useResizable({
    key: 'kl-filetree-w', initial: 200, min: 140, max: 360,
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
  const [density, setDensity] = useState<'compact' | 'comfortable' | 'spacious'>('comfortable')
  const [commandOpen, setCommandOpen] = useState(false)

  const claudeSkills = useMemo(
    () => skills.filter(skill => Boolean(skill.sourceVariants.claude)),
    [skills],
  )
  const scopedSkills = activeScope === 'claude' ? claudeSkills : skills
  const designDepartment = useMemo(
    () => departments.find(department => /design/i.test(department)) || null,
    [departments],
  )
  const designFilterActive = Boolean(designDepartment && activeDepartments.has(designDepartment))
  const hasActiveFilters = Boolean(
    searchQuery.trim()
    || activeSavedView !== 'all'
    || activeSourceFilter
    || activeAgentFilter
    || activeFamilyFilter
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
    [getFilteredSkills, skills, sources, agents, searchQuery, activeScope, activeSavedView, activeSourceFilter, activeAgentFilter, activeFamilyFilter, duplicateOnly, activeDepartments],
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
  const selectedVariant = selectedSkill
    ? (
        (activeScope === 'claude' ? selectedSkill.sourceVariants.claude : null) ||
        selectedSkill.sourceVariants[selectedSkill.canonicalSource] ||
        Object.values(selectedSkill.sourceVariants)[0] ||
        null
      )
    : null
  const selectedSkillAgents = selectedSkill
    ? agents.filter(agent => selectedSkill.installedAgentIds.includes(agent.id))
    : []
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
    if (activeScope === 'claude' && selectedSkill && !selectedSkill.sourceVariants.claude) {
      setExpandedSkill(null)
    }
  }, [activeScope, selectedSkill, setExpandedSkill])

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

  // Cmd+K listener
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const pc = (base: string, panel: FocusedPanel) => {
    let c = `kl-panel ${base}`
    if (panelsReady) c += ' kl-visible'
    if (focusedPanel === panel) c += ' kl-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' kl-dimmed'
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

  const renderSkillRow = (skill: UnifiedSkill, sectionFamilyKey?: string) => {
    const variant = activeScope === 'claude'
      ? skill.sourceVariants.claude
      : skill.sourceVariants[skill.canonicalSource] || Object.values(skill.sourceVariants)[0]
    const sourceLabel = variant?.sourceLabel || skill.canonicalSource
    const version = variant?.version ? `v${variant.version}` : null
    const meta = [sourceLabel, version].filter(Boolean).join(' \u00b7 ')

    return (
      <button
        key={skill.id}
        className={`kl-skill-row${expandedSkillId === skill.id ? ' active' : ''}${skill.isDuplicate ? ' kl-skill-row-duplicate' : ''}`}
        onClick={e => { e.stopPropagation(); openSkill(skill.id) }}
      >
        <span className="kl-skill-name">{skill.displayName}</span>
        <span className="kl-skill-meta">{meta}</span>
        <span
          className={`kl-star-btn${starredSkillIds.has(skill.id) ? ' starred' : ''}`}
          onClick={e => { e.stopPropagation(); void toggleStarSkill(skill.id) }}
          title={starredSkillIds.has(skill.id) ? 'Unstar' : 'Star'}
        >
          <Star size={12} strokeWidth={1.5} fill={starredSkillIds.has(skill.id) ? 'currentColor' : 'none'} />
        </span>
      </button>
    )
  }

  const renderGroupedSkillList = (skillList: UnifiedSkill[]) => {
    const sections = buildSkillSections(skillList)
    return (
      <div className="kl-skill-groups">
        {sections.map(section => (
          <div key={section.key} className="kl-skill-group-block">
            {section.label && (
              <div className="kl-skill-group-head">
                <span className="kl-skill-group-title">{section.label}</span>
                <span className="kl-skill-group-count">{section.skills.length}</span>
              </div>
            )}
            <div className="kl-skill-list">
              {section.skills.map(skill => renderSkillRow(skill, section.key !== 'all' && section.key !== 'standalone' ? section.key : undefined))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Faceted filter sections
  const facetSections = useMemo(() => {
    const sourceItems = sources.map(src => ({
      value: src.id, label: src.label,
      count: scopedSkills.filter(s => Boolean(s.sourceVariants[src.id])).length,
      color: src.color,
    }))
    const agentItems = agents.map(agent => ({
      value: agent.id, label: agent.label,
      count: scopedSkills.filter(s => s.installedAgentIds.includes(agent.id)).length,
      emoji: agent.emoji,
    }))
    const familyItems = families.map(f => ({ value: f.key, label: f.label, count: f.count }))
    return [
      { id: 'source', label: 'Source', items: sourceItems, activeValue: activeSourceFilter, onSelect: (v: string | null) => setActiveSourceFilter(v) },
      { id: 'agent', label: 'Agent', items: agentItems, activeValue: activeAgentFilter, onSelect: (v: string | null) => setActiveAgentFilter(v) },
      { id: 'family', label: 'Family', items: familyItems, activeValue: activeFamilyFilter, onSelect: (v: string | null) => setActiveFamilyFilter(v) },
    ]
  }, [sources, agents, families, scopedSkills, activeSourceFilter, activeAgentFilter, activeFamilyFilter, setActiveSourceFilter, setActiveAgentFilter, setActiveFamilyFilter])

  const facetToggles = useMemo(() => {
    const list: { id: string; label: string; active: boolean; onToggle: () => void }[] = []
    if (designDepartment) list.push({ id: 'design', label: 'Design skills', active: designFilterActive, onToggle: () => toggleDepartment(designDepartment) })
    list.push({ id: 'duplicates', label: 'Duplicates only', active: duplicateOnly, onToggle: () => toggleDuplicateOnly() })
    return list
  }, [designDepartment, designFilterActive, duplicateOnly, toggleDepartment, toggleDuplicateOnly])

  // Active filter chips
  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = []
    if (activeSavedView === 'starred') chips.push({ key: 'view', label: 'Starred', onRemove: () => setActiveSavedView('all') })
    if (activeSavedView === 'recent') chips.push({ key: 'view', label: 'Recently added', onRemove: () => setActiveSavedView('all') })
    if (designFilterActive && designDepartment) chips.push({ key: 'design', label: 'Design', onRemove: () => toggleDepartment(designDepartment) })
    if (duplicateOnly) chips.push({ key: 'dupes', label: 'Duplicates', onRemove: () => toggleDuplicateOnly() })
    if (selectedFamily) chips.push({ key: 'family', label: `Family: ${selectedFamily.label}`, onRemove: () => setActiveFamilyFilter(null) })
    if (selectedAgent) chips.push({ key: 'agent', label: `Agent: ${selectedAgent.label}`, onRemove: () => setActiveAgentFilter(null) })
    if (selectedSource) chips.push({ key: 'source', label: `Source: ${selectedSource.label}`, onRemove: () => setActiveSourceFilter(null) })
    for (const dept of activeDepartments) {
      if (dept !== designDepartment) chips.push({ key: `dept-${dept}`, label: dept, onRemove: () => toggleDepartment(dept) })
    }
    return chips
  }, [activeSavedView, designFilterActive, designDepartment, duplicateOnly, selectedFamily, selectedAgent, selectedSource, activeDepartments, setActiveSavedView, toggleDepartment, toggleDuplicateOnly, setActiveFamilyFilter, setActiveAgentFilter, setActiveSourceFilter])

  const listedSkills = filteredSkills
  const navSkillCount = activeScope === 'claude' ? claudeSkills.length : skills.length

  // Results panel title: show active department if single, else generic
  const resultsPanelTitle = useMemo(() => {
    if (activeDepartments.size === 1) return [...activeDepartments][0]
    if (activeScope === 'claude') return 'Claude Code'
    return 'Skills'
  }, [activeDepartments, activeScope])

  if (loading && !loaded) {
    return (
      <div className="kl-canvas">
        <div className="kl-loading-state">
          <div className="kl-loading-spinner" />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  if (error && !loaded) {
    return (
      <div className="kl-canvas">
        <div className="kl-loading-state kl-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="kl-canvas">
      <div className="kl-panels">
        {/* ═══ Nav ═══ */}
        <div className="kl-nav-shell">
          <aside
            className={pc('kl-nav', 'nav')}
            onClick={() => setFocusedPanel('nav')}
            style={{ width: navWidth, minWidth: navWidth }}
          >
            {/* Header */}
            <header className="kl-panel-header">
              <h3 className="kl-panel-title">Skills</h3>
              <span className="kl-panel-badge">{navSkillCount}</span>
            </header>

            {/* Search + Scope */}
            <div className="kl-nav-controls">
              <div className="kl-search-bar" onClick={e => e.stopPropagation()}>
                <Search size={14} strokeWidth={1.5} className="kl-search-icon" />
                <input
                  className="kl-search-input"
                  placeholder="Search skills..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="kl-search-clear" onClick={() => setSearchQuery('')}>&times;</button>
                )}
              </div>

              <div className="kl-scope-switch" onClick={e => e.stopPropagation()}>
                <button
                  className={`kl-scope-pill${activeScope === 'all' && activeSavedView === 'all' ? ' active' : ''}`}
                  onClick={() => { setActiveScope('all'); setActiveSavedView('all') }}
                >
                  All Libraries
                </button>
                <button
                  className={`kl-scope-pill${activeScope === 'claude' ? ' active' : ''}`}
                  onClick={() => { setActiveScope('claude'); setActiveSavedView('all') }}
                >
                  Claude Code
                </button>
                <button
                  className={`kl-scope-pill${activeSavedView === 'starred' ? ' active' : ''}`}
                  onClick={() => { setActiveScope('all'); setActiveSavedView('starred') }}
                >
                  Starred{starredCount > 0 ? ` (${starredCount})` : ''}
                </button>
              </div>
            </div>

            {/* Scrollable nav body: departments + sources + facets */}
            <div className="kl-nav-tree">
              <div className="kl-nav-divider" />

              {/* Departments */}
              <div className="kl-nav-section">
                <div className="kl-nav-section-label">Departments</div>
                {departments.map(dept => {
                  const count = scopedSkills.filter(s => s.department === dept).length
                  const isActive = activeDepartments.has(dept)
                  return (
                    <button
                      key={dept}
                      className={`kl-nav-section-item${isActive ? ' active' : ''}`}
                      onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                    >
                      <span className="kl-nav-section-item-left">
                        <span className="kl-nav-section-item-name">{dept}</span>
                      </span>
                      <span className="kl-nav-section-item-count">{count}</span>
                    </button>
                  )
                })}
              </div>

              <div className="kl-nav-divider" />

              {/* Sources */}
              <div className="kl-nav-section">
                <div className="kl-nav-section-label">Sources</div>
                {sources.map(src => {
                  const count = scopedSkills.filter(s => Boolean(s.sourceVariants[src.id])).length
                  const isActive = activeSourceFilter === src.id
                  return (
                    <button
                      key={src.id}
                      className={`kl-nav-section-item${isActive ? ' active' : ''}`}
                      onClick={e => { e.stopPropagation(); setActiveSourceFilter(isActive ? null : src.id) }}
                    >
                      <span className="kl-nav-section-item-left">
                        <span className="kl-nav-section-item-dot" style={{ background: src.color }} />
                        <span className="kl-nav-section-item-name">{src.label}</span>
                      </span>
                      <span className="kl-nav-section-item-count">{count}</span>
                    </button>
                  )
                })}
              </div>

              {/* Faceted filters (family, agent, toggles) — only in all-libraries scope */}
              {activeScope !== 'claude' && (
                <FacetedFilters sections={facetSections} toggles={facetToggles} />
              )}
            </div>

            {/* Status */}
            <div className="kl-nav-status">
              <span>{listedSkills.length} of {scopedSkills.length}</span>
              {hasActiveFilters && (
                <button className="kl-nav-status-clear" onClick={e => { e.stopPropagation(); clearAllFilters() }}>
                  Clear
                </button>
              )}
            </div>
          </aside>

          <div className="kl-panel-resizer" {...navHandleProps} />
        </div>

        {/* ═══ Results ═══ */}
        <aside
          className={pc('kl-results-panel', 'results')}
          onClick={() => setFocusedPanel('results')}
          style={{ width: resultsWidth, minWidth: resultsWidth }}
        >
          <header className="kl-panel-header kl-results-header">
            <h3 className="kl-panel-title">{resultsPanelTitle}</h3>
            <div className="kl-results-header-actions">
              <div className="kl-view-toggles">
                <button
                  className={`kl-view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setViewMode('list') }}
                  title="List view"
                >
                  <List size={13} strokeWidth={1.5} />
                </button>
                <button
                  className={`kl-view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setViewMode('grid') }}
                  title="Grid view"
                >
                  <Grid3x3 size={13} strokeWidth={1.5} />
                </button>
                {viewMode === 'list' && (
                  <>
                    <span className="kl-density-sep" />
                    {(['compact', 'comfortable', 'spacious'] as const).map(d => (
                      <button
                        key={d}
                        className={`kl-view-toggle-btn${density === d ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setDensity(d) }}
                        title={d.charAt(0).toUpperCase() + d.slice(1)}
                      >
                        <span style={{ fontSize: 9, fontWeight: 600 }}>
                          {d === 'compact' ? 'S' : d === 'comfortable' ? 'M' : 'L'}
                        </span>
                      </button>
                    ))}
                  </>
                )}
              </div>

              <span className="kl-results-header-note">{listedSkills.length}</span>
              <button
                className="kl-results-install-btn"
                onClick={e => { e.stopPropagation(); setInstallDialogOpen(true) }}
              >
                <Upload size={12} strokeWidth={1.7} />
                <span>Install</span>
              </button>
            </div>
          </header>

          <ActiveFiltersBar chips={activeFilterChips} onClearAll={clearAllFilters} />

          <div className="kl-results-panel-body">
            {listedSkills.length === 0 ? (
              <div className="kl-no-results kl-no-results-block">
                No skills match the current filters.
                <div className="kl-no-results-actions">
                  {activeFamilyFilter && (
                    <button className="kl-no-results-action" onClick={() => setActiveFamilyFilter(null)}>Remove family filter</button>
                  )}
                  {activeAgentFilter && (
                    <button className="kl-no-results-action" onClick={() => setActiveAgentFilter(null)}>Remove agent filter</button>
                  )}
                  <button className="kl-no-results-action" onClick={() => clearAllFilters()}>Clear all filters</button>
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
              <div className={density !== 'comfortable' ? `kl-density-${density}` : undefined}>
                {renderGroupedSkillList(listedSkills)}
              </div>
            )}

            {removableDuplicateCount > 0 && (
              <div className="kl-filter-summary" style={{ margin: '8px' }} onClick={e => e.stopPropagation()}>
                <span className="kl-filter-summary-count">{removableDuplicateCount} removable duplicates</span>
                <div className="kl-filter-actions">
                  <button
                    className="kl-filter-bulk"
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

        <div className="kl-panel-resizer" {...resultsHandleProps} />

        {/* ═══ Editor ═══ */}
        {selectedSkill ? (
          <main
            className={pc('kl-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
          >
            <header className="kl-panel-header kl-editor-header">
              <div className="kl-panel-title-row">
                <button className="kl-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                  <ArrowLeft size={16} strokeWidth={1.5} />
                </button>
                <div className="kl-filename-area">
                  <span className="kl-filename">{editorFilePath?.split('/').pop() || 'SKILL.md'}</span>
                  <span className="kl-file-meta">{selectedVariant?.sourceLabel || selectedSkill.displayName}</span>
                </div>
              </div>
              <div className="kl-results-header-actions">
                <button className="kl-results-install-btn" onClick={e => e.stopPropagation()} title="Copy path">
                  <Copy size={12} strokeWidth={1.7} />
                </button>
                <button className="kl-results-install-btn" onClick={e => e.stopPropagation()} title="Open externally">
                  <ExternalLink size={12} strokeWidth={1.7} />
                </button>
              </div>
            </header>
            <div className="kl-editor-body">
              <div className="kl-editor-shell">
                <aside className="kl-files-panel" style={{ width: fileTreeWidth, minWidth: fileTreeWidth }}>
                  <div className="kl-files-panel-head">
                    <span className="kl-files-panel-label">Files</span>
                    {selectedSkillRoot && (
                      <span className="kl-files-panel-root">{selectedSkillRoot.split('/').pop()}</span>
                    )}
                  </div>
                  {loadingSkillTreeRoot === selectedSkillRoot && selectedSkillFiles.length === 0 ? (
                    <div className="kl-tree-empty">
                      <span className="kl-tree-empty-icon">&hellip;</span>
                      <span className="kl-tree-empty-text">Loading skill files...</span>
                    </div>
                  ) : (
                    <SkillFileTree files={selectedSkillFiles} prefix="kl" />
                  )}
                </aside>
                <div className="kl-panel-resizer kl-filetree-resizer" {...fileTreeHandleProps} />
                <div className="kl-editor-pane">
                  {editorContent !== null ? (
                    <SkillCMEditor
                      key={`${selectedSkill.id}:${editorFilePath || 'default'}`}
                      content={editorContent}
                      filePath={editorFilePath}
                      theme={brandTheme}
                      prefix="kl"
                    />
                  ) : (
                    <div className="kl-editor-loading">
                      <div className="kl-loading-spinner" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        ) : (
          <div className={`kl-welcome${panelsReady ? ' kl-visible' : ''}`}>
            <div className="kl-welcome-inner">
              <Feather size={28} strokeWidth={1} className="kl-welcome-icon" />
              <h2 className="kl-welcome-title">{activeScope === 'claude' ? 'Claude Code Skills' : 'Skills Lab'}</h2>
              <p className="kl-welcome-sub">
                {activeScope === 'claude'
                  ? 'Review the Claude Code library, then install or remove skills from agents.'
                  : 'Select a skill from the list to begin editing.'}
              </p>
              <div className="kl-welcome-stats">
                <span className="kl-stat">{skills.length} skills</span>
                <span className="kl-stat">{agents.length} agents</span>
                <span className="kl-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Inspector ═══ */}
        {selectedSkill && (
          <aside
            className={pc('kl-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
          >
            <header className="kl-panel-header">
              <h3 className="kl-panel-title">Details</h3>
              <button
                className={`kl-star-toggle${starredSkillIds.has(selectedSkill.id) ? ' starred' : ''}`}
                onClick={e => { e.stopPropagation(); void toggleStarSkill(selectedSkill.id) }}
                title={starredSkillIds.has(selectedSkill.id) ? 'Unstar skill' : 'Star skill'}
              >
                <Star size={14} strokeWidth={1.5} fill={starredSkillIds.has(selectedSkill.id) ? 'currentColor' : 'none'} />
              </button>
            </header>

            <section className="kl-meta-section">
              <div className="kl-meta-skill-name">{selectedSkill.displayName}</div>
              <div className="kl-meta-badges">
                <span className="kl-meta-badge">{selectedSkill.department}</span>
                {selectedVariant?.sourceLabel && <span className="kl-meta-badge">{selectedVariant.sourceLabel}</span>}
                {selectedSkillHasClaude && <span className="kl-meta-badge">Claude Code</span>}
              </div>

              <div className="kl-meta-divider" />

              <p className="kl-meta-desc">
                {selectedSkill.familyLabel
                  ? `${selectedSkill.displayName} — part of the ${selectedSkill.familyLabel} skill family.`
                  : `${selectedSkill.displayName} — ${selectedSkill.department.toLowerCase()} skill.`}
                {selectedSkill.installedAgentIds.length > 0
                  ? ` Active on ${selectedSkill.installedAgentIds.length} agent(s).`
                  : ' Not installed on any agents.'}
              </p>

              <div className="kl-meta-divider" />

              <div className="kl-meta-group-label">Tags</div>
              <div className="kl-meta-tags">
                <span className="kl-tag">{selectedSkill.department}</span>
                {selectedVariant?.sourceLabel && <span className="kl-tag">{selectedVariant.sourceLabel}</span>}
                {selectedSkillHasClaude && <span className="kl-tag">Claude Code</span>}
                {selectedSkill.familyLabel && <span className="kl-tag">{selectedSkill.familyLabel}</span>}
              </div>
            </section>

            <section className="kl-meta-group">
              <div className="kl-meta-group-label">Agents</div>
              <div className="kl-meta-agents">
                {agents.map(agent => {
                  const isInstalled = selectedSkill.installedAgentIds.includes(agent.id)
                  return (
                    <div key={agent.id} className="kl-agent-badge">
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="kl-agent-badge-emoji">{agent.emoji}</span>
                        {agent.label}
                      </span>
                      {isInstalled
                        ? <span className="kl-meta-agent-status">Installed</span>
                        : <span style={{ fontSize: 11, color: 'var(--sh-text-tertiary)' }}>Not installed</span>
                      }
                    </div>
                  )
                })}
              </div>
            </section>

            {selectedSkillHasClaude && (
              <section className="kl-meta-group">
                <div className="kl-meta-group-head">
                  <div className="kl-meta-group-label">Rollout</div>
                  <span className="kl-meta-caption">{selectedSkill.installedAgentIds.length}/{agents.length} active</span>
                </div>
                <div className="kl-rollout-grid">
                  {agents.map(agent => {
                    const isInstalled = selectedSkill.installedAgentIds.includes(agent.id)
                    const isPending = pendingAgentId === agent.id
                    return (
                      <button
                        key={agent.id}
                        className={`kl-rollout-chip${isInstalled ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); void toggleAgentSkill(agent.id) }}
                        disabled={isPending}
                        title={isInstalled ? `Remove from ${agent.label}` : `Install for ${agent.label}`}
                      >
                        <span className="kl-rollout-chip-main">
                          <span className="kl-rollout-emoji">{agent.emoji}</span>
                          <span className="kl-rollout-name">{agent.label}</span>
                        </span>
                        <span className="kl-rollout-state">
                          {isPending ? '...' : isInstalled ? <Check size={12} strokeWidth={2} /> : 'Install'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </section>
            )}

            <section className="kl-meta-group">
              <div className="kl-meta-group-label">Presence</div>
              <div className="kl-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="kl-meta-source-row">
                    <span className="kl-meta-source-dot" style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#E5E5E5' }} />
                    <span className="kl-meta-source-name">{src.label}</span>
                    <span className={`kl-meta-source-kind ${selectedSkill.presence[src.id]}`}>{selectedSkill.presence[src.id]}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="kl-meta-actions">
              <div className="kl-action-grid">
                <button className="kl-action-btn kl-action-primary" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={14} strokeWidth={1.5} />
                  <span className="kl-action-label">Deploy to All Agents</span>
                </button>
                <button className="kl-action-btn" onClick={e => e.stopPropagation()}>
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="kl-action-label">Duplicate</span>
                </button>
                <button className="kl-action-btn kl-action-danger" onClick={e => e.stopPropagation()}>
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="kl-action-label">Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>

      {/* Status bar */}
      <StatusBar filtered={listedSkills.length} total={scopedSkills.length} scope={activeScope} hasFilters={hasActiveFilters} />

      {/* Command palette */}
      {commandOpen && (
        <CommandPalette skills={skills} onSelectSkill={openSkill} onClose={() => setCommandOpen(false)} />
      )}

      {/* Install dialog */}
      {installDialogOpen && (
        <div className="kl-install-modal-backdrop" onClick={() => { setInstallDialogOpen(false); setInstallDragActive(false) }}>
          <div
            className={`kl-install-modal${installDragActive ? ' drag-active' : ''}`}
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
            <div className="kl-install-modal-head">
              <div className="kl-install-head">
                <span className="kl-install-kicker">Install skill</span>
                <span className="kl-install-caption">ZIP drop or npx command</span>
              </div>
              <button className="kl-install-close" onClick={() => { setInstallDialogOpen(false); setInstallDragActive(false) }}>
                Close
              </button>
            </div>
            <div className="kl-install-actions">
              <button className="kl-install-zip-btn" onClick={() => fileInputRef.current?.click()} disabled={installBusy}>
                <Upload size={12} strokeWidth={1.7} />
                <span>{installBusy ? 'Working\u2026' : 'Choose ZIP'}</span>
              </button>
              <span className="kl-install-drop-hint">or drop archive here</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              style={{ display: 'none' }}
              onChange={e => { const file = e.target.files?.[0]; if (file) void handleZipInstall(file); e.currentTarget.value = '' }}
            />
            <div className="kl-install-command-row">
              <div className="kl-install-command-input-wrap">
                <TerminalSquare size={12} strokeWidth={1.7} className="kl-install-command-icon" />
                <input
                  className="kl-install-command-input"
                  placeholder="npx ..."
                  value={commandInput}
                  onChange={e => setCommandInput(e.target.value)}
                  onFocus={() => clearInstallFeedback()}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void handleCommandInstall() } }}
                />
              </div>
              <button className="kl-install-command-btn" onClick={() => void handleCommandInstall()} disabled={installBusy}>Run</button>
            </div>
            {(installNotice || installError || installLastOutput) && (
              <div className="kl-install-feedback-wrap">
                {(installNotice || installError) && (
                  <div className={`kl-install-feedback ${(installNotice?.tone === 'error' || installError) ? 'error' : 'success'}`}>
                    {installNotice?.text || installError}
                  </div>
                )}
                {installLastOutput && <pre className="kl-install-output">{installLastOutput}</pre>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
