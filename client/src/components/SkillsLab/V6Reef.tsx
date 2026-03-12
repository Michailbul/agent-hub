import { useEffect, useState } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { v6Theme } from '@/lib/cmThemeV6'
import {
  Waves,
  Search,
  ArrowLeft,
  Shell,
  Rocket,
  Copy,
  ArrowRight,
  Trash2,
  ChevronRight,
} from 'lucide-react'
import './v6-reef.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V6Reef() {
  const sources = useSkillsLabStore(s => s.sources)
  const agents = useSkillsLabStore(s => s.agents)
  const departments = useSkillsLabStore(s => s.departments)
  const skills = useSkillsLabStore(s => s.skills)
  const loading = useSkillsLabStore(s => s.loading)
  const loaded = useSkillsLabStore(s => s.loaded)
  const error = useSkillsLabStore(s => s.error)
  const searchQuery = useSkillsLabStore(s => s.searchQuery)
  const setSearchQuery = useSkillsLabStore(s => s.setSearchQuery)
  const activeSourceFilter = useSkillsLabStore(s => s.activeSourceFilter)
  const setActiveSourceFilter = useSkillsLabStore(s => s.setActiveSourceFilter)
  const activeDepartments = useSkillsLabStore(s => s.activeDepartments)
  const toggleDepartment = useSkillsLabStore(s => s.toggleDepartment)
  const expandedSkillId = useSkillsLabStore(s => s.expandedSkillId)
  const setExpandedSkill = useSkillsLabStore(s => s.setExpandedSkill)
  const expandedAgentId = useSkillsLabStore(s => s.expandedAgentId)
  const setExpandedAgentId = useSkillsLabStore(s => s.setExpandedAgentId)
  const collapsedSources = useSkillsLabStore(s => s.collapsedSources)
  const toggleSourceCollapse = useSkillsLabStore(s => s.toggleSourceCollapse)
  const expandedTreeSources = useSkillsLabStore(s => s.expandedTreeSources)
  const toggleExpandTreeSource = useSkillsLabStore(s => s.toggleExpandTreeSource)
  const loadFromAPI = useSkillsLabStore(s => s.loadFromAPI)
  const loadSkillContent = useSkillsLabStore(s => s.loadSkillContent)
  const skillContentCache = useSkillsLabStore(s => s.skillContentCache)

  const [navTab, setNavTab] = useState<NavTab>('agents')
  const [focusedPanel, setFocusedPanel] = useState<FocusedPanel>(null)
  const [panelsReady, setPanelsReady] = useState(false)

  const selectedSkill = expandedSkillId ? skills.find(s => s.id === expandedSkillId) : null
  const skillContent = selectedSkill ? (skillContentCache[selectedSkill.id] || null) : null

  // Load data on mount
  useEffect(() => { loadFromAPI() }, [loadFromAPI])

  // Load skill content when selection changes
  useEffect(() => {
    if (selectedSkill) loadSkillContent(selectedSkill.id)
  }, [selectedSkill?.id, loadSkillContent])

  // Staggered panel entrance
  useEffect(() => {
    const t = setTimeout(() => setPanelsReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  // Panel class builder
  const pc = (base: string, panel: FocusedPanel) => {
    let c = `cr-panel ${base}`
    if (panelsReady) c += ' cr-visible'
    if (focusedPanel === panel) c += ' cr-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' cr-dimmed'
    return c
  }

  // Filter skills for agent tree
  const filterSkills = (agentSkills: typeof skills) => {
    let result = agentSkills
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s =>
        s.displayName.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      )
    }
    if (activeDepartments.size > 0) {
      result = result.filter(s => activeDepartments.has(s.department))
    }
    return result
  }

  // ── Loading state ──
  if (loading && !loaded) {
    return (
      <div className="cr-canvas">
        <div className="cr-loading-state">
          <div className="cr-loading-spinner" />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  // ── Error state ──
  if (error && !loaded) {
    return (
      <div className="cr-canvas">
        <div className="cr-loading-state cr-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="cr-canvas">
      <div className="cr-panels">

        {/* ═══ Navigator Panel (Left, 300px) ═══ */}
        <aside
          className={pc('cr-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms' }}
        >
          <header className="cr-panel-header">
            <h3 className="cr-panel-title">
              <Waves size={16} strokeWidth={1.5} />
              Navigator
            </h3>
            <span className="cr-panel-badge">{skills.length}</span>
          </header>

          <div className="cr-nav-controls">
            <div className="cr-nav-tabs">
              <button
                className={`cr-nav-tab${navTab === 'agents' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('agents') }}
              >Agents</button>
              <button
                className={`cr-nav-tab${navTab === 'sources' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('sources') }}
              >Sources</button>
            </div>
            <div className="cr-search-bar">
              <Search className="cr-search-icon" size={13} strokeWidth={2.5} />
              <input
                className="cr-search-input"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button
                  className="cr-search-clear"
                  onClick={e => { e.stopPropagation(); setSearchQuery('') }}
                >&times;</button>
              )}
            </div>
          </div>

          <div className="cr-nav-tree">
            {navTab === 'agents' && agents.map((agent, i) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="cr-agent-group" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    className={`cr-agent-row${isExpanded ? ' expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}
                  >
                    <span className="cr-agent-emoji">{agent.emoji}</span>
                    <div className="cr-agent-info">
                      <span className="cr-agent-name">{agent.label}</span>
                      <span className="cr-agent-path">{agent.skillsRoot}</span>
                    </div>
                    <span className="cr-agent-count">{all.length}</span>
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className={`cr-chevron${isExpanded ? ' open' : ''}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="cr-skill-list">
                      {visible.length === 0 && <div className="cr-no-results">No skills match</div>}
                      {visible.map(sk => (
                        <button
                          key={sk.id}
                          className={`cr-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                        >
                          <span className="cr-skill-indicator" />
                          <span className="cr-skill-name">{sk.displayName}</span>
                          <span className="cr-skill-dept-label">{sk.department}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {navTab === 'sources' && (
              <>
                <button
                  className={`cr-source-row${!activeSourceFilter ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}
                >
                  <span className="cr-source-dot" style={{ background: '#F2EBE5' }} />
                  <span className="cr-source-name">All Skills</span>
                  <span className="cr-source-count">{skills.length}</span>
                </button>
                {sources.map(src => {
                  const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                  const isOpen = !collapsedSources.has(src.id)
                  const isTreeExpanded = expandedTreeSources.has(src.id)
                  const LIMIT = 10
                  const showToggle = srcSkills.length > LIMIT
                  const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                  return (
                    <div key={src.id} className="cr-source-group">
                      <button
                        className={`cr-source-row${activeSourceFilter === src.id ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}
                      >
                        <span className="cr-source-dot" style={{ background: src.color }} />
                        <span className="cr-source-name">{src.label}</span>
                        <span className="cr-source-count">{srcSkills.length}</span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={`cr-chevron${isOpen ? ' open' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }}
                        />
                      </button>
                      {isOpen && (
                        <div className="cr-skill-list">
                          {visibleSkills.map(sk => (
                            <button
                              key={sk.id}
                              className={`cr-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                            >
                              <span className="cr-skill-indicator" />
                              <span className="cr-skill-name">{sk.displayName}</span>
                            </button>
                          ))}
                          {showToggle && !isTreeExpanded && (
                            <button
                              className="cr-show-more"
                              onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}
                            >
                              Show all {srcSkills.length}
                            </button>
                          )}
                          {showToggle && isTreeExpanded && (
                            <button
                              className="cr-show-more"
                              onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}
                            >
                              Collapse
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>

          <footer className="cr-nav-depts">
            <div className="cr-dept-label">Departments</div>
            <div className="cr-dept-pills">
              {departments.map(dept => {
                const count = skills.filter(s => s.department === dept).length
                return (
                  <button
                    key={dept}
                    className={`cr-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                  >
                    {dept} <span className="cr-dept-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </footer>
        </aside>

        {/* ═══ Editor Panel (Center) or Welcome ═══ */}
        {selectedSkill ? (
          <main
            className={pc('cr-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
            style={{ animationDelay: '80ms' }}
          >
            <header className="cr-panel-header cr-editor-header">
              <button
                className="cr-back-btn"
                onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}
              >
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="cr-filename-area">
                <span className="cr-filename">SKILL.md</span>
                <span className="cr-file-meta">{selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="cr-editor-body">
              {skillContent !== null ? (
                <SkillCMEditor
                  key={selectedSkill.id}
                  content={skillContent}
                  filePath={selectedSkill.previewPath}
                  theme={v6Theme}
                  prefix="cr"
                />
              ) : (
                <div className="cr-editor-loading">
                  <div className="cr-loading-spinner" />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div
            className={`cr-welcome${panelsReady ? ' cr-visible' : ''}`}
            style={{ animationDelay: '80ms' }}
          >
            <div className="cr-welcome-inner">
              <div className="cr-welcome-icon-wrap">
                <Waves size={36} strokeWidth={1.5} />
              </div>
              <h2 className="cr-welcome-title">Coral Reef</h2>
              <p className="cr-welcome-sub">
                Select a skill from the navigator to begin editing
              </p>
              <div className="cr-welcome-stats">
                <span className="cr-stat">{skills.length} skills</span>
                <span className="cr-stat-sep">{'\u00B7'}</span>
                <span className="cr-stat">{agents.length} agents</span>
                <span className="cr-stat-sep">{'\u00B7'}</span>
                <span className="cr-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Inspector Panel (Right, 320px) ═══ */}
        {selectedSkill && (
          <aside
            className={pc('cr-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
            style={{ animationDelay: '160ms' }}
          >
            <header className="cr-panel-header">
              <h3 className="cr-panel-title">
                <Shell size={16} strokeWidth={1.5} />
                Inspector
              </h3>
            </header>

            {/* Metadata key-value pairs */}
            <section className="cr-meta-section">
              <div className="cr-meta-row">
                <span className="cr-meta-key">Name</span>
                <span className="cr-meta-val">{selectedSkill.displayName}</span>
              </div>
              <div className="cr-meta-row">
                <span className="cr-meta-key">Dept</span>
                <span className="cr-meta-val">{selectedSkill.department}</span>
              </div>
              {selectedSkill.metadata.author && (
                <div className="cr-meta-row">
                  <span className="cr-meta-key">Author</span>
                  <span className="cr-meta-val">{selectedSkill.metadata.author}</span>
                </div>
              )}
              {selectedSkill.metadata.source && (
                <div className="cr-meta-row">
                  <span className="cr-meta-key">Source</span>
                  <span className="cr-meta-val">{selectedSkill.metadata.source}</span>
                </div>
              )}
              {selectedSkill.metadata.license && (
                <div className="cr-meta-row">
                  <span className="cr-meta-key">License</span>
                  <span className="cr-meta-val">{selectedSkill.metadata.license}</span>
                </div>
              )}
            </section>

            {/* Tags */}
            <section className="cr-meta-group">
              <div className="cr-meta-group-label">Tags</div>
              <div className="cr-meta-tags">
                <span className="cr-tag">{selectedSkill.department}</span>
              </div>
            </section>

            {/* Installed agents */}
            <section className="cr-meta-group">
              <div className="cr-meta-group-label">Agents</div>
              <div className="cr-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && (
                  <span className="cr-meta-empty">Not installed in any agent</span>
                )}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => (
                  <span key={a.id} className="cr-agent-badge">
                    <span className="cr-agent-badge-emoji">{a.emoji}</span>
                    {a.label}
                  </span>
                ))}
              </div>
            </section>

            {/* Source presence */}
            <section className="cr-meta-group">
              <div className="cr-meta-group-label">Sources</div>
              <div className="cr-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="cr-meta-source-row">
                    <span
                      className={`cr-meta-source-dot${selectedSkill.presence[src.id] === 'canonical' ? ' canonical' : ''}`}
                      style={{
                        background: selectedSkill.presence[src.id] !== 'absent'
                          ? src.color
                          : 'rgba(255,255,255,0.15)',
                      }}
                    />
                    <span className="cr-meta-source-name">{src.label}</span>
                    <span className={`cr-meta-source-kind ${selectedSkill.presence[src.id]}`}>
                      {selectedSkill.presence[src.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Action grid */}
            <section className="cr-meta-actions">
              <div className="cr-action-grid">
                <button
                  className="cr-action-btn cr-action-primary"
                  onClick={e => e.stopPropagation()}
                >
                  <Rocket size={14} strokeWidth={1.5} />
                  <span className="cr-action-label">Deploy</span>
                </button>
                <button
                  className="cr-action-btn"
                  onClick={e => e.stopPropagation()}
                >
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="cr-action-label">Duplicate</span>
                </button>
                <button
                  className="cr-action-btn"
                  onClick={e => e.stopPropagation()}
                >
                  <ArrowRight size={14} strokeWidth={1.5} />
                  <span className="cr-action-label">Move to</span>
                </button>
                <button
                  className="cr-action-btn cr-action-danger"
                  onClick={e => e.stopPropagation()}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="cr-action-label">Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
