import { useEffect, useMemo, useRef, useState } from 'react'
import { useSkillsLabStore, type SkillDeletePreview, type UnifiedSkill } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { SkillFileTree } from './SkillFileTree'
import { useResizable } from '@/lib/useResizable'
import { v7Theme } from '@/lib/cmThemeV7'
import {
  ArrowLeft,
  Bot,
  Clock3,
  Check,
  Feather,
  Layers,
  Package,
  Search,
  Settings2,
  Star,
  TerminalSquare,
  Trash2,
  Upload,
} from 'lucide-react'
import './v11-kiln.css'

type FocusedPanel = 'nav' | 'results' | 'editor' | 'meta' | null
type SkillRowOptions = { status?: string; muted?: boolean }

export function V11Kiln() {
  const {
    size: navWidth,
    setSize: setNavWidth,
    handleProps: navResizeHandleProps,
  } = useResizable({
    key: 'skills-lab-nav-width',
    initial: 300,
    min: 280,
    max: 560,
  })

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
  const previewDeleteSkill = useSkillsLabStore(s => s.previewDeleteSkill)
  const deleteSkill = useSkillsLabStore(s => s.deleteSkill)
  const previewRemoveDuplicates = useSkillsLabStore(s => s.previewRemoveDuplicates)
  const removeDuplicates = useSkillsLabStore(s => s.removeDuplicates)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [focusedPanel, setFocusedPanel] = useState<FocusedPanel>(null)
  const [panelsReady, setPanelsReady] = useState(false)
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null)
  const [deletePreview, setDeletePreview] = useState<SkillDeletePreview | null>(null)
  const [deletePreviewError, setDeletePreviewError] = useState<string | null>(null)
  const [deletePending, setDeletePending] = useState(false)
  const [duplicateCleanupPending, setDuplicateCleanupPending] = useState(false)
  const [commandInput, setCommandInput] = useState('')
  const [installDragActive, setInstallDragActive] = useState(false)
  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [installNotice, setInstallNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const claudeSource = sources.find(source => source.id === 'claude') || null
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
  const featuredFamilies = useMemo(() => families.slice(0, 6), [families])
  const hasActiveFilters = Boolean(
    searchQuery.trim()
    || activeSavedView !== 'all'
    || activeSourceFilter
    || activeAgentFilter
    || activeFamilyFilter
    || duplicateOnly
    || activeDepartments.size > 0,
  )
  const selectedSource = activeSourceFilter
    ? sources.find(source => source.id === activeSourceFilter) || null
    : null
  const selectedAgent = activeAgentFilter
    ? agents.find(agent => agent.id === activeAgentFilter) || null
    : null
  const selectedFamily = activeFamilyFilter
    ? families.find(family => family.key === activeFamilyFilter) || null
    : null
  const filteredSkills = useMemo(
    () => getFilteredSkills(),
    [
      getFilteredSkills,
      skills,
      sources,
      agents,
      searchQuery,
      activeScope,
      activeSavedView,
      activeSourceFilter,
      activeAgentFilter,
      activeFamilyFilter,
      duplicateOnly,
      activeDepartments,
    ],
  )
  const starredCount = starredSkillIds.size
  const recentCount = skills.filter(skill => Boolean(skill.addedAt)).length
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
    if (!activeSkillFile) {
      setActiveSkillFile(selectedVariant.previewPath)
    }
    void loadSkillContent(selectedSkill.id, nextPath)
  }, [selectedSkill?.id, selectedVariant?.previewPath, activeSkillFile, loadSkillContent, setActiveSkillFile])

  useEffect(() => {
    if (activeScope === 'claude' && selectedSkill && !selectedSkill.sourceVariants.claude) {
      setExpandedSkill(null)
    }
  }, [activeScope, selectedSkill, setExpandedSkill])

  useEffect(() => {
    if (!selectedSkill || !selectedVariant?.sourceId) {
      setDeletePreview(null)
      setDeletePreviewError(null)
      return
    }

    let cancelled = false
    setDeletePreview(null)
    setDeletePreviewError(null)

    void previewDeleteSkill(selectedSkill.id, selectedVariant.sourceId)
      .then(preview => {
        if (!cancelled) setDeletePreview(preview)
      })
      .catch(error => {
        if (!cancelled) setDeletePreviewError(error instanceof Error ? error.message : 'Failed to load delete preview')
      })

    return () => { cancelled = true }
  }, [previewDeleteSkill, selectedSkill?.id, selectedVariant?.sourceId])

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

  const pc = (base: string, panel: FocusedPanel) => {
    let c = `kn-panel ${base}`
    if (panelsReady) c += ' kn-visible'
    if (focusedPanel === panel) c += ' kn-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' kn-dimmed'
    return c
  }

  const openSkill = (skillId: string) => {
    setExpandedSkill(skillId)
  }

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

    if (grouped.size === 0) {
      return [{ key: 'all', label: null as string | null, skills: skillList }]
    }

    const sections = [...grouped.values()].sort((left, right) => {
      const leftOrder = familyOrder.get(left.key) ?? Number.MAX_SAFE_INTEGER
      const rightOrder = familyOrder.get(right.key) ?? Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
      return left.label.localeCompare(right.label)
    })

    if (standalone.length > 0) {
      sections.push({ key: 'standalone', label: 'Standalone', skills: standalone })
    }

    return sections
  }

  const toggleAgentSkill = async (agentId: string) => {
    if (!selectedSkill) return
    const isInstalled = selectedSkill.installedAgentIds.includes(agentId)
    if (!isInstalled && !selectedClaudeVariantPath) return

    setPendingAgentId(agentId)
    try {
      if (isInstalled) {
        await unassignSkill(agentId, selectedSkill.id)
      } else if (selectedClaudeVariantPath) {
        await assignSkill(agentId, selectedClaudeVariantPath)
      }
    } catch (error) {
      console.error('Skill toggle failed:', error)
    } finally {
      setPendingAgentId(null)
    }
  }

  const handleDeleteAction = async () => {
    if (!selectedSkill || !deletePreview) return
    if (!deletePreview.allowed) return

    const confirmLines = deletePreview.action === 'unassign-agent'
      ? [
          `Remove "${deletePreview.skillName}" from ${deletePreview.impactedInstalls[0]?.label || 'this agent'}?`,
          'This removes only the agent install. The source skill stays intact.',
        ]
      : [
          `Delete "${deletePreview.skillName}" from ${deletePreview.sourceLabel}?`,
          deletePreview.impactedInstalls.length > 0
            ? `This will also remove ${deletePreview.impactedInstalls.length} linked agent install(s).`
            : 'No agent installs will be removed.',
          deletePreview.otherLibraryVariants.length > 0
            ? `${deletePreview.otherLibraryVariants.length} other library variant(s) will remain untouched.`
            : 'No other library variants will remain.',
        ]

    if (!window.confirm(confirmLines.join('\n\n'))) return

    setDeletePending(true)
    try {
      await deleteSkill(selectedSkill.id, deletePreview.sourceId)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setDeletePending(false)
    }
  }

  const handleRemoveDuplicates = async (skillIds: string[]) => {
    if (skillIds.length === 0) {
      window.alert('No removable duplicate sources found.')
      return
    }

    setDuplicateCleanupPending(true)
    try {
      const plan = await previewRemoveDuplicates(skillIds)
      if (plan.totalVariants === 0) {
        window.alert('No removable duplicate sources found.')
        return
      }

      const confirmLines = [
        `Remove ${plan.totalVariants} duplicate source variant(s) across ${plan.totalSkills} skill(s)?`,
        'The primary source for each skill will be kept.',
        plan.totalInstalls > 0
          ? `This will also remove ${plan.totalInstalls} linked agent install(s).`
          : 'No agent installs will be removed.',
      ]

      if (plan.blockedVariants > 0) {
        confirmLines.push(`${plan.blockedVariants} duplicate variant(s) cannot be removed automatically and will be skipped.`)
      }

      if (!window.confirm(confirmLines.join('\n\n'))) return

      const result = await removeDuplicates(skillIds)
      window.alert(
        result.totalVariants > 0
          ? `Removed ${result.totalVariants} duplicate variant(s) across ${result.totalSkills} skill(s).`
          : 'No removable duplicate sources were found.',
      )
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Duplicate cleanup failed')
    } finally {
      setDuplicateCleanupPending(false)
    }
  }

  const handleZipInstall = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setInstallNotice({ tone: 'error', text: 'Only .zip skill bundles are supported.' })
      return
    }

    clearInstallFeedback()
    setInstallNotice(null)
    try {
      await installFromZip(file)
      setInstallNotice({ tone: 'success', text: `Installed ${file.name} into the shared library.` })
      setCommandInput('')
    } catch (error) {
      setInstallNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'ZIP install failed',
      })
    }
  }

  const handleCommandInstall = async () => {
    const trimmed = commandInput.trim()
    if (!trimmed) {
      setInstallNotice({ tone: 'error', text: 'Paste an npx command first.' })
      return
    }

    clearInstallFeedback()
    setInstallNotice(null)
    try {
      await installFromCommand(trimmed)
      setInstallNotice({ tone: 'success', text: 'Command finished and installed a new skill.' })
      setCommandInput('')
    } catch (error) {
      setInstallNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Command install failed',
      })
    }
  }

  const renderSkillRow = (skill: UnifiedSkill, options?: SkillRowOptions) => (
    <button
      key={skill.id}
      className={`kn-skill-row${expandedSkillId === skill.id ? ' active' : ''}${options?.muted ? ' kn-skill-row-muted' : ''}${skill.isDuplicate ? ' kn-skill-row-duplicate' : ''}`}
      onClick={e => { e.stopPropagation(); openSkill(skill.id) }}
    >
      <span className="kn-skill-indicator" />
      <span className="kn-skill-name">{skill.displayName}</span>
      <span className="kn-skill-meta">
        {skill.familyLabel && (
          <span className="kn-skill-chip kn-skill-chip-family">{skill.familyLabel}</span>
        )}
        {options?.status && <span className="kn-skill-chip kn-skill-chip-status">{options.status}</span>}
        {!options?.status && <span className="kn-skill-chip kn-skill-chip-dept">{skill.department}</span>}
        {skill.isDuplicate && (
          <span className="kn-skill-chip kn-skill-chip-duplicate">{skill.sourceVariantCount}x</span>
        )}
      </span>
      <span
        className={`kn-star-btn${starredSkillIds.has(skill.id) ? ' starred' : ''}`}
        onClick={e => { e.stopPropagation(); void toggleStarSkill(skill.id) }}
        title={starredSkillIds.has(skill.id) ? 'Unstar' : 'Star'}
      >
        <Star size={12} strokeWidth={1.5} fill={starredSkillIds.has(skill.id) ? 'currentColor' : 'none'} />
      </span>
    </button>
  )

  const renderGroupedSkillList = (
    skillList: UnifiedSkill[],
    getOptions?: (skill: UnifiedSkill) => SkillRowOptions | undefined,
  ) => {
    const sections = buildSkillSections(skillList)
    return (
      <div className="kn-skill-groups">
        {sections.map(section => (
          <div key={section.key} className="kn-skill-group-block">
            {section.label && (
              <div className="kn-skill-group-head">
                <span className="kn-skill-group-title">{section.label}</span>
                <span className="kn-skill-group-count">{section.skills.length}</span>
              </div>
            )}
            <div className="kn-skill-list">
              {section.skills.map(skill => renderSkillRow(skill, getOptions?.(skill)))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const navSkillCount = activeScope === 'claude' ? claudeSkills.length : skills.length
  const installedClaudeCount = claudeSkills.length
  const listedSkills = filteredSkills
  const resultsTitle = activeScope === 'claude'
    ? 'Installed Claude Skills'
    : hasActiveFilters
      ? 'Matching Skills'
      : 'Browse Skills'
  const resultsSubtitle = activeScope === 'claude'
    ? 'Every installed Claude skill lives here. Search and filters narrow the library instantly.'
    : hasActiveFilters
      ? 'Filtered results update live as you refine source, family, and agent constraints.'
      : 'Browse the full skill catalog here. Use the filter panel to focus the list without losing your place.'

  if (loading && !loaded) {
    return (
      <div className="kn-canvas">
        <div className="kn-loading-state">
          <div className="kn-loading-spinner" />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  if (error && !loaded) {
    return (
      <div className="kn-canvas">
        <div className="kn-loading-state kn-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="kn-canvas">
      <div className="kn-panels">
        <div
          className="kn-nav-shell"
          style={{ width: navWidth + 14, minWidth: navWidth + 14 }}
        >
        <aside
          className={pc('kn-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms', width: navWidth, minWidth: navWidth, maxWidth: navWidth }}
        >
          <header className="kn-panel-header">
            <div className="kn-panel-title-row">
              <Layers size={14} strokeWidth={1.5} className="kn-panel-icon" />
              <h3 className="kn-panel-title">Navigator</h3>
            </div>
            <span className="kn-panel-badge">{navSkillCount}</span>
          </header>

          <div className="kn-nav-controls">
            <div className="kn-scope-switch" onClick={e => e.stopPropagation()}>
              <button
                className={`kn-scope-pill${activeScope === 'all' ? ' active' : ''}`}
                onClick={() => setActiveScope('all')}
              >
                <Package size={12} strokeWidth={1.7} />
                <span>All libraries</span>
              </button>
              <button
                className={`kn-scope-pill${activeScope === 'claude' ? ' active' : ''}`}
                onClick={() => setActiveScope('claude')}
              >
                <Bot size={12} strokeWidth={1.7} />
                <span>Claude Code</span>
              </button>
            </div>

            <div className="kn-saved-views" onClick={e => e.stopPropagation()}>
              <button
                className={`kn-saved-view-pill${activeSavedView === 'all' ? ' active' : ''}`}
                onClick={() => setActiveSavedView('all')}
              >
                <Package size={12} strokeWidth={1.7} />
                <span>All</span>
                <strong>{scopedSkills.length}</strong>
              </button>
              <button
                className={`kn-saved-view-pill${activeSavedView === 'starred' ? ' active' : ''}`}
                onClick={() => setActiveSavedView('starred')}
              >
                <Star size={12} strokeWidth={1.7} />
                <span>Starred</span>
                <strong>{starredCount}</strong>
              </button>
              <button
                className={`kn-saved-view-pill${activeSavedView === 'recent' ? ' active' : ''}`}
                onClick={() => setActiveSavedView('recent')}
              >
                <Clock3 size={12} strokeWidth={1.7} />
                <span>Recently added</span>
                <strong>{recentCount}</strong>
              </button>
            </div>

            <div className="kn-search-bar">
              <Search size={13} strokeWidth={1.5} className="kn-search-icon" />
              <input
                className="kn-search-input"
                placeholder={activeScope === 'claude' ? 'Filter installed Claude skills...' : 'Filter skills...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="kn-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>
              )}
            </div>

            <div className="kn-filter-pills" onClick={e => e.stopPropagation()}>
              {designDepartment && (
                <button
                  className={`kn-filter-pill${designFilterActive ? ' active' : ''}`}
                  onClick={() => toggleDepartment(designDepartment)}
                >
                  Design
                </button>
              )}
              <button
                className={`kn-filter-pill${duplicateOnly ? ' active' : ''}`}
                onClick={() => toggleDuplicateOnly()}
              >
                Duplicates
              </button>
              {featuredFamilies.map(family => (
                <button
                  key={family.key}
                  className={`kn-filter-pill${activeFamilyFilter === family.key ? ' active' : ''}`}
                  onClick={() => setActiveFamilyFilter(family.key)}
                >
                  {family.label} <span className="kn-filter-pill-count">{family.count}</span>
                </button>
              ))}
            </div>

            {activeScope !== 'claude' && (
              <>
                <div className="kn-filter-grid" onClick={e => e.stopPropagation()}>
                  <label className="kn-filter-field">
                    <span className="kn-filter-label">Agent</span>
                    <select
                      className="kn-filter-select"
                      value={activeAgentFilter || ''}
                      onChange={e => setActiveAgentFilter(e.target.value || null)}
                    >
                      <option value="">Any agent</option>
                      {agents.map(agent => (
                        <option key={agent.id} value={agent.id}>
                          {agent.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="kn-filter-field">
                    <span className="kn-filter-label">Source</span>
                    <select
                      className="kn-filter-select"
                      value={activeSourceFilter || ''}
                      onChange={e => setActiveSourceFilter(e.target.value || null)}
                    >
                      <option value="">Any source</option>
                      {sources.map(source => (
                        <option key={source.id} value={source.id}>
                          {source.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="kn-filter-summary" onClick={e => e.stopPropagation()}>
                  <span className="kn-filter-summary-count">
                    {filteredSkills.length} of {scopedSkills.length} skills
                  </span>
                  {activeSavedView === 'starred' && (
                    <span className="kn-filter-summary-chip">Starred</span>
                  )}
                  {activeSavedView === 'recent' && (
                    <span className="kn-filter-summary-chip">Recently added</span>
                  )}
                  {designFilterActive && (
                    <span className="kn-filter-summary-chip">Design</span>
                  )}
                  {duplicateOnly && (
                    <span className="kn-filter-summary-chip">Duplicates</span>
                  )}
                  {selectedFamily && (
                    <span className="kn-filter-summary-chip">Family: {selectedFamily.label}</span>
                  )}
                  {selectedAgent && (
                    <span className="kn-filter-summary-chip">Agent: {selectedAgent.label}</span>
                  )}
                  {selectedSource && (
                    <span className="kn-filter-summary-chip">Source: {selectedSource.label}</span>
                  )}
                  <div className="kn-filter-actions">
                    {removableDuplicateCount > 0 && (
                      <button
                        className="kn-filter-bulk"
                        onClick={() => { void handleRemoveDuplicates(removableDuplicateSkillIds) }}
                        disabled={duplicateCleanupPending}
                      >
                        {duplicateCleanupPending
                          ? 'Removing...'
                          : `Remove duplicates (${removableDuplicateCount})`}
                      </button>
                    )}
                    {hasActiveFilters && (
                      <button className="kn-filter-reset" onClick={() => clearAllFilters()}>
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="kn-nav-tree">
            <div className="kn-nav-filter-state">
              <span className="kn-nav-filter-kicker">{activeScope === 'claude' ? 'Installed library' : 'Filter workspace'}</span>
              <h4 className="kn-nav-filter-title">
                {activeScope === 'claude' ? 'Refine the installed Claude library' : 'Shape the skills list without losing context'}
              </h4>
              <p className="kn-nav-filter-copy">
                The skill browser stays visible in the next panel. Adjust search, source, family, and agent filters here, then pick a skill from the live list.
              </p>
              <div className="kn-nav-filter-stats">
                <span>{listedSkills.length} visible</span>
                <span>{scopedSkills.length} total</span>
              </div>
            </div>
          </div>

          <footer className="kn-nav-depts">
            <div className="kn-dept-label">Departments</div>
            <div className="kn-dept-pills">
              {departments.map(dept => {
                const count = scopedSkills.filter(skill => skill.department === dept).length
                return (
                  <button
                    key={dept}
                    className={`kn-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                  >
                    {dept} <span className="kn-dept-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </footer>
        </aside>
          <div
            className="kn-panel-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize navigator panel"
            title="Drag to resize navigator"
            {...navResizeHandleProps}
            onDoubleClick={() => setNavWidth(300)}
          >
            <span className="kn-panel-resizer-grip" />
          </div>
        </div>

        <aside
          className={pc('kn-results-panel', 'results')}
          onClick={() => setFocusedPanel('results')}
          style={{ animationDelay: '40ms' }}
        >
          <header className="kn-panel-header kn-results-header">
            <div className="kn-panel-title-row">
              <Search size={14} strokeWidth={1.5} className="kn-panel-icon" />
              <h3 className="kn-panel-title">Skills</h3>
            </div>
            <div className="kn-results-header-actions">
              <span className="kn-results-header-note">{listedSkills.length} visible</span>
              <button
                className="kn-results-install-btn"
                onClick={e => {
                  e.stopPropagation()
                  setInstallDialogOpen(true)
                  setInstallDragActive(false)
                }}
              >
                <Upload size={12} strokeWidth={1.7} />
                <span>Install</span>
              </button>
            </div>
          </header>
          <div className="kn-results-panel-body">
            <div className="kn-claude-header">
              <div>
                <span className="kn-claude-kicker">{activeScope === 'claude' ? 'Claude Code scope' : 'Live browser'}</span>
                <h4 className="kn-claude-title">{resultsTitle}</h4>
              </div>
              {activeScope === 'claude' && claudeSource ? (
                <span className="kn-claude-source-tag">{claudeSource.label}</span>
              ) : (
                <span className="kn-claude-source-tag">{listedSkills.length}</span>
              )}
            </div>
            <div className="kn-results-intro">
              <p className="kn-results-copy">{resultsSubtitle}</p>
            </div>

            {listedSkills.length === 0 ? (
              <div className="kn-no-results kn-no-results-block">
                No skills match the current filters.
              </div>
            ) : (
              renderGroupedSkillList(listedSkills, skill => ({
                status: activeScope === 'claude'
                  ? (skill.installedAgentIds.length > 0 ? `${skill.installedAgentIds.length} agents` : 'installed')
                  : skill.installedAgentIds.length > 0
                    ? `${skill.installedAgentIds.length} active`
                    : 'library only',
                muted: false,
              }))
            )}
          </div>
        </aside>

        {selectedSkill ? (
          <main
            className={pc('kn-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
            style={{ animationDelay: '80ms' }}
          >
            <header className="kn-panel-header kn-editor-header">
              <button className="kn-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="kn-filename-area">
                <span className="kn-filename">{editorFilePath?.split('/').pop() || 'SKILL.md'}</span>
                <span className="kn-file-meta">{selectedVariant?.sourceLabel || selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="kn-editor-body">
              <div className="kn-editor-shell">
                <aside className="kn-files-panel">
                  <div className="kn-files-panel-head">
                    <span className="kn-files-panel-label">Files</span>
                    {selectedSkillRoot && (
                      <span className="kn-files-panel-root">{selectedSkillRoot.split('/').pop()}</span>
                    )}
                  </div>
                  {loadingSkillTreeRoot === selectedSkillRoot && selectedSkillFiles.length === 0 ? (
                    <div className="kn-tree-empty">
                      <span className="kn-tree-empty-icon">⋯</span>
                      <span className="kn-tree-empty-text">Loading skill files...</span>
                    </div>
                  ) : (
                    <SkillFileTree files={selectedSkillFiles} />
                  )}
                </aside>

                <div className="kn-editor-pane">
                  {editorContent !== null ? (
                    <SkillCMEditor
                      key={`${selectedSkill.id}:${editorFilePath || 'default'}`}
                      content={editorContent}
                      filePath={editorFilePath}
                      theme={v7Theme}
                      prefix="kn"
                    />
                  ) : (
                    <div className="kn-editor-loading">
                      <div className="kn-loading-spinner" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        ) : (
          <div className={`kn-welcome${panelsReady ? ' kn-visible' : ''}`} style={{ animationDelay: '80ms' }}>
            <div className="kn-welcome-inner">
              <Feather size={28} strokeWidth={1} className="kn-welcome-icon" />
              <h2 className="kn-welcome-title">{activeScope === 'claude' ? 'Claude Code Skills' : 'Skills Lab'}</h2>
              <p className="kn-welcome-sub">
                {activeScope === 'claude'
                  ? 'Review the Claude Code library, then install or remove skills from agents.'
                  : 'Select a skill from the navigator to begin editing.'}
              </p>
              <div className="kn-welcome-stats">
                <span className="kn-stat">{activeScope === 'claude' ? installedClaudeCount : skills.length} skills</span>
                <span className="kn-stat-sep">&middot;</span>
                <span className="kn-stat">{agents.length} agents</span>
                <span className="kn-stat-sep">&middot;</span>
                <span className="kn-stat">
                  {activeScope === 'claude' ? `${installedClaudeCount} installed` : `${sources.length} sources`}
                </span>
              </div>
            </div>
          </div>
        )}

        {selectedSkill && (
          <aside
            className={pc('kn-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
            style={{ animationDelay: '160ms' }}
          >
            <header className="kn-panel-header">
              <div className="kn-panel-title-row">
                <Settings2 size={14} strokeWidth={1.5} className="kn-panel-icon" />
                <h3 className="kn-panel-title">Inspector</h3>
              </div>
              <button
                className={`kn-star-toggle${starredSkillIds.has(selectedSkill.id) ? ' starred' : ''}`}
                onClick={e => { e.stopPropagation(); void toggleStarSkill(selectedSkill.id) }}
                title={starredSkillIds.has(selectedSkill.id) ? 'Unstar skill' : 'Star skill'}
              >
                <Star size={14} strokeWidth={1.5} fill={starredSkillIds.has(selectedSkill.id) ? 'currentColor' : 'none'} />
              </button>
            </header>

            <section className="kn-meta-section">
              <div className="kn-meta-row">
                <span className="kn-meta-key">Name</span>
                <span className="kn-meta-val">{selectedSkill.displayName}</span>
              </div>
              <div className="kn-meta-row">
                <span className="kn-meta-key">Dept</span>
                <span className="kn-meta-val">{selectedSkill.department}</span>
              </div>
              <div className="kn-meta-row">
                <span className="kn-meta-key">Source</span>
                <span className="kn-meta-val">{selectedVariant?.sourceLabel || selectedSkill.canonicalSource}</span>
              </div>
              <div className="kn-meta-row">
                <span className="kn-meta-key">Status</span>
                <span className="kn-meta-val">
                  {selectedSkill.installedAgentIds.length > 0
                    ? `${selectedSkill.installedAgentIds.length} active`
                    : 'Library only'}
                </span>
              </div>
              {selectedSkill.metadata.author && (
                <div className="kn-meta-row">
                  <span className="kn-meta-key">Author</span>
                  <span className="kn-meta-val">{selectedSkill.metadata.author}</span>
                </div>
              )}
              {selectedSkill.metadata.source && (
                <div className="kn-meta-row">
                  <span className="kn-meta-key">Origin</span>
                  <span className="kn-meta-val">{selectedSkill.metadata.source}</span>
                </div>
              )}
              {selectedSkill.metadata.license && (
                <div className="kn-meta-row">
                  <span className="kn-meta-key">License</span>
                  <span className="kn-meta-val">{selectedSkill.metadata.license}</span>
                </div>
              )}
            </section>

            <section className="kn-meta-group">
              <div className="kn-meta-group-label">Tags</div>
              <div className="kn-meta-tags">
                <span className="kn-tag">{selectedSkill.department}</span>
                {selectedVariant?.sourceLabel && <span className="kn-tag">{selectedVariant.sourceLabel}</span>}
                {selectedSkillHasClaude && <span className="kn-tag">Claude Code</span>}
              </div>
            </section>

            <section className="kn-meta-group">
              <div className="kn-meta-group-head">
                <div className="kn-meta-group-label">Claude Code rollout</div>
                <span className="kn-meta-caption">
                  {selectedSkill.installedAgentIds.length}/{agents.length} active
                </span>
              </div>
              {selectedSkillHasClaude ? (
                <div className="kn-rollout-grid">
                  {agents.map(agent => {
                    const isInstalled = selectedSkill.installedAgentIds.includes(agent.id)
                    const isPending = pendingAgentId === agent.id
                    return (
                      <button
                        key={agent.id}
                        className={`kn-rollout-chip${isInstalled ? ' active' : ''}`}
                        onClick={e => {
                          e.stopPropagation()
                          void toggleAgentSkill(agent.id)
                        }}
                        disabled={isPending}
                        title={isInstalled ? `Remove from ${agent.label}` : `Install for ${agent.label}`}
                      >
                        <span className="kn-rollout-chip-main">
                          <span className="kn-rollout-emoji">{agent.emoji}</span>
                          <span className="kn-rollout-name">{agent.label}</span>
                        </span>
                        <span className="kn-rollout-state">
                          {isPending ? '...' : isInstalled ? <Check size={12} strokeWidth={2} /> : 'Install'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <span className="kn-meta-empty">This skill is not installed in the Claude Code library.</span>
              )}
            </section>

            <section className="kn-meta-group">
              <div className="kn-meta-group-label">Active agents</div>
              <div className="kn-meta-agents">
                {selectedSkillAgents.length === 0 && (
                  <span className="kn-meta-empty">Not active on any agent</span>
                )}
                {selectedSkillAgents.map(agent => (
                  <span key={agent.id} className="kn-agent-badge">
                    <span className="kn-agent-badge-emoji">{agent.emoji}</span>
                    {agent.label}
                  </span>
                ))}
              </div>
            </section>

            <section className="kn-meta-group">
              <div className="kn-meta-group-label">Presence</div>
              <div className="kn-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="kn-meta-source-row">
                    <span
                      className="kn-meta-source-dot"
                      style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#3e3e38' }}
                    />
                    <span className="kn-meta-source-name">{src.label}</span>
                    <span className={`kn-meta-source-kind ${selectedSkill.presence[src.id]}`}>
                      {selectedSkill.presence[src.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="kn-meta-actions">
              <div className="kn-meta-group-label">Delete behavior</div>
              {deletePreview ? (
                <div className="kn-delete-card">
                  <p className="kn-delete-message">{deletePreview.message}</p>

                  {deletePreview.impactedInstalls.length > 0 ? (
                    <div className="kn-delete-impact-list">
                      {deletePreview.impactedInstalls.map(install => (
                        <div key={install.agentId} className="kn-delete-impact-row">
                          <span className="kn-delete-impact-agent">
                            <span className="kn-delete-impact-emoji">{install.emoji}</span>
                            {install.label}
                          </span>
                          <span className="kn-delete-impact-type">
                            {deletePreview.action === 'unassign-agent'
                              ? 'remove'
                              : install.isSymlink ? 'unlink' : 'delete'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="kn-meta-empty">No agent installs are affected.</span>
                  )}

                  {deletePreview.otherLibraryVariants.length > 0 && (
                    <div className="kn-delete-note">
                      Other variants remain in {deletePreview.otherLibraryVariants.map(variant => variant.sourceLabel).join(', ')}.
                    </div>
                  )}
                </div>
              ) : deletePreviewError ? (
                <div className="kn-delete-card">
                  <span className="kn-meta-empty">{deletePreviewError}</span>
                </div>
              ) : (
                <div className="kn-delete-card">
                  <span className="kn-meta-empty">Loading delete scope…</span>
                </div>
              )}

              <div className="kn-action-grid kn-action-grid-single">
                <button
                  className="kn-action-btn kn-action-danger"
                  onClick={e => {
                    e.stopPropagation()
                    void handleDeleteAction()
                  }}
                  disabled={!deletePreview?.allowed || deletePending}
                  title={deletePreview?.allowed ? undefined : deletePreview?.message || undefined}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="kn-action-label">
                    {deletePending
                      ? 'Working...'
                      : deletePreview?.action === 'unassign-agent'
                        ? 'Remove From Agent'
                        : deletePreview?.action === 'delete-library'
                          ? 'Delete Source Skill'
                          : 'Delete Unavailable'}
                  </span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>

      {installDialogOpen && (
        <div
          className="kn-install-modal-backdrop"
          onClick={() => {
            setInstallDialogOpen(false)
            setInstallDragActive(false)
          }}
        >
          <div
            className={`kn-install-modal${installDragActive ? ' drag-active' : ''}`}
            onClick={e => e.stopPropagation()}
            onDragEnter={e => {
              e.preventDefault()
              setInstallDragActive(true)
            }}
            onDragOver={e => {
              e.preventDefault()
              setInstallDragActive(true)
            }}
            onDragLeave={e => {
              e.preventDefault()
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setInstallDragActive(false)
            }}
            onDrop={e => {
              e.preventDefault()
              setInstallDragActive(false)
              const file = Array.from(e.dataTransfer.files).find(item => item.name.toLowerCase().endsWith('.zip'))
              if (file) void handleZipInstall(file)
              else setInstallNotice({ tone: 'error', text: 'Drop a .zip skill bundle to install it.' })
            }}
          >
            <div className="kn-install-modal-head">
              <div className="kn-install-head">
                <span className="kn-install-kicker">Install skill</span>
                <span className="kn-install-caption">ZIP drop or `npx` command</span>
              </div>
              <button
                className="kn-install-close"
                onClick={() => {
                  setInstallDialogOpen(false)
                  setInstallDragActive(false)
                }}
              >
                Close
              </button>
            </div>
            <div className="kn-install-actions">
              <button
                className="kn-install-zip-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={installBusy}
              >
                <Upload size={12} strokeWidth={1.7} />
                <span>{installBusy ? 'Working…' : 'Choose ZIP'}</span>
              </button>
              <span className="kn-install-drop-hint">or drop archive here</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,application/zip"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) void handleZipInstall(file)
                e.currentTarget.value = ''
              }}
            />
            <div className="kn-install-command-row">
              <div className="kn-install-command-input-wrap">
                <TerminalSquare size={12} strokeWidth={1.7} className="kn-install-command-icon" />
                <input
                  className="kn-install-command-input"
                  placeholder="npx ..."
                  value={commandInput}
                  onChange={e => setCommandInput(e.target.value)}
                  onFocus={() => clearInstallFeedback()}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void handleCommandInstall()
                    }
                  }}
                />
              </div>
              <button
                className="kn-install-command-btn"
                onClick={() => void handleCommandInstall()}
                disabled={installBusy}
              >
                Run
              </button>
            </div>
            {(installNotice || installError || installLastOutput) && (
              <div className="kn-install-feedback-wrap">
                {(installNotice || installError) && (
                  <div className={`kn-install-feedback ${(installNotice?.tone === 'error' || installError) ? 'error' : 'success'}`}>
                    {installNotice?.text || installError}
                  </div>
                )}
                {installLastOutput && (
                  <pre className="kn-install-output">{installLastOutput}</pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
