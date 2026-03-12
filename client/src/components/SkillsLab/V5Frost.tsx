import { useEffect, useState } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { v5Theme } from '@/lib/cmThemeV5'
import {
  Terminal,
  Search,
  ArrowLeft,
  Activity,
  Zap,
  Copy,
  ArrowRight,
  Trash2,
  ChevronRight,
  Cpu,
} from 'lucide-react'
import './v5-frost.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V5Frost() {
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

  useEffect(() => { loadFromAPI() }, [loadFromAPI])

  useEffect(() => {
    if (selectedSkill) loadSkillContent(selectedSkill.id)
  }, [selectedSkill?.id, loadSkillContent])

  // Panel entrance animation
  useEffect(() => {
    const t = setTimeout(() => setPanelsReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  const pc = (base: string, panel: FocusedPanel) => {
    let c = `fv-panel ${base}`
    if (panelsReady) c += ' fv-visible'
    if (focusedPanel === panel) c += ' fv-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' fv-dimmed'
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

  if (loading && !loaded) {
    return (
      <div className="fv-canvas">
        <div className="fv-loading-state">
          <div className="fv-loading-spinner" />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  if (error && !loaded) {
    return (
      <div className="fv-canvas">
        <div className="fv-loading-state fv-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="fv-canvas">
      <div className="fv-panels">

        {/* ═══ Navigator Panel (Left, 280px) ═══ */}
        <aside
          className={pc('fv-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms' }}
        >
          <header className="fv-panel-header">
            <div className="fv-panel-title-row">
              <Terminal size={14} strokeWidth={1.5} className="fv-panel-icon" />
              <h3 className="fv-panel-title">Navigator</h3>
            </div>
            <span className="fv-panel-badge">{skills.length}</span>
          </header>

          <div className="fv-nav-controls">
            <div className="fv-nav-tabs">
              <button
                className={`fv-nav-tab${navTab === 'agents' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('agents') }}
              >Agents</button>
              <button
                className={`fv-nav-tab${navTab === 'sources' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('sources') }}
              >Sources</button>
            </div>
            <div className="fv-search-bar">
              <Search size={13} strokeWidth={1.5} className="fv-search-icon" />
              <input
                className="fv-search-input"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="fv-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>
              )}
            </div>
          </div>

          <div className="fv-nav-tree">
            {navTab === 'agents' && agents.map((agent, i) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="fv-agent-group" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    className={`fv-agent-row${isExpanded ? ' expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className={`fv-chevron-icon${isExpanded ? ' open' : ''}`}
                    />
                    <span className="fv-agent-emoji">{agent.emoji}</span>
                    <div className="fv-agent-info">
                      <span className="fv-agent-name">{agent.label}</span>
                      <span className="fv-agent-path">{agent.skillsRoot}</span>
                    </div>
                    <span className="fv-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="fv-skill-list">
                      {visible.length === 0 && <div className="fv-no-results">No skills match</div>}
                      {visible.map(sk => (
                        <button
                          key={sk.id}
                          className={`fv-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                        >
                          <span className="fv-skill-indicator" />
                          <span className="fv-skill-name">{sk.displayName}</span>
                          <span className="fv-skill-dept-label">{sk.department}</span>
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
                  className={`fv-source-row${!activeSourceFilter ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}
                >
                  <span className="fv-source-dot" style={{ background: '#E8ECF0' }} />
                  <span className="fv-source-name">All Skills</span>
                  <span className="fv-source-count">{skills.length}</span>
                </button>
                {sources.map(src => {
                  const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                  const isOpen = !collapsedSources.has(src.id)
                  const isTreeExpanded = expandedTreeSources.has(src.id)
                  const LIMIT = 10
                  const showToggle = srcSkills.length > LIMIT
                  const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                  return (
                    <div key={src.id} className="fv-source-group">
                      <button
                        className={`fv-source-row${activeSourceFilter === src.id ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}
                      >
                        <span className="fv-source-dot" style={{ background: src.color }} />
                        <span className="fv-source-name">{src.label}</span>
                        <span className="fv-source-count">{srcSkills.length}</span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={`fv-chevron-icon${isOpen ? ' open' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }}
                        />
                      </button>
                      {isOpen && (
                        <div className="fv-skill-list">
                          {visibleSkills.map(sk => (
                            <button
                              key={sk.id}
                              className={`fv-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                            >
                              <span className="fv-skill-indicator" />
                              <span className="fv-skill-name">{sk.displayName}</span>
                            </button>
                          ))}
                          {showToggle && !isTreeExpanded && (
                            <button className="fv-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
                              Show all {srcSkills.length}
                            </button>
                          )}
                          {showToggle && isTreeExpanded && (
                            <button className="fv-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
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

          <footer className="fv-nav-depts">
            <div className="fv-dept-label">Departments</div>
            <div className="fv-dept-pills">
              {departments.map(dept => {
                const count = skills.filter(s => s.department === dept).length
                return (
                  <button
                    key={dept}
                    className={`fv-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                  >
                    {dept} <span className="fv-dept-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </footer>
        </aside>

        {/* ═══ Editor Panel (Center, flex:1) ═══ */}
        {selectedSkill ? (
          <main
            className={pc('fv-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
            style={{ animationDelay: '80ms' }}
          >
            <header className="fv-panel-header fv-editor-header">
              <button className="fv-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="fv-filename-area">
                <span className="fv-filename">SKILL.md</span>
                <span className="fv-file-meta">{selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="fv-editor-body">
              {skillContent !== null ? (
                <SkillCMEditor
                  key={selectedSkill.id}
                  content={skillContent}
                  filePath={selectedSkill.previewPath}
                  theme={v5Theme}
                  prefix="fv"
                />
              ) : (
                <div className="fv-editor-loading">
                  <div className="fv-loading-spinner" />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className={`fv-welcome${panelsReady ? ' fv-visible' : ''}`} style={{ animationDelay: '80ms' }}>
            <div className="fv-welcome-inner">
              <Cpu size={28} strokeWidth={1} className="fv-welcome-icon" />
              <h2 className="fv-welcome-title">Skills Lab</h2>
              <p className="fv-welcome-sub">Select a skill from the navigator to begin editing</p>
              <hr className="fv-welcome-rule" />
              <div className="fv-welcome-stats">
                <span className="fv-stat">{skills.length} skills</span>
                <span className="fv-stat-sep">&middot;</span>
                <span className="fv-stat">{agents.length} agents</span>
                <span className="fv-stat-sep">&middot;</span>
                <span className="fv-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Inspector Panel (Right, 300px) ═══ */}
        {selectedSkill && (
          <aside
            className={pc('fv-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
            style={{ animationDelay: '160ms' }}
          >
            <header className="fv-panel-header">
              <div className="fv-panel-title-row">
                <Activity size={14} strokeWidth={1.5} className="fv-panel-icon" />
                <h3 className="fv-panel-title">Inspector</h3>
              </div>
            </header>

            {/* Metadata key-value pairs */}
            <section className="fv-meta-section">
              <div className="fv-meta-row">
                <span className="fv-meta-key">Name</span>
                <span className="fv-meta-val">{selectedSkill.displayName}</span>
              </div>
              <div className="fv-meta-row">
                <span className="fv-meta-key">Dept</span>
                <span className="fv-meta-val">{selectedSkill.department}</span>
              </div>
              <div className="fv-meta-row">
                <span className="fv-meta-key">Source</span>
                <span className="fv-meta-val">{selectedSkill.canonicalSource}</span>
              </div>
              {selectedSkill.metadata.author && (
                <div className="fv-meta-row">
                  <span className="fv-meta-key">Author</span>
                  <span className="fv-meta-val">{selectedSkill.metadata.author}</span>
                </div>
              )}
              {selectedSkill.metadata.source && (
                <div className="fv-meta-row">
                  <span className="fv-meta-key">Origin</span>
                  <span className="fv-meta-val">{selectedSkill.metadata.source}</span>
                </div>
              )}
              {selectedSkill.metadata.license && (
                <div className="fv-meta-row">
                  <span className="fv-meta-key">License</span>
                  <span className="fv-meta-val">{selectedSkill.metadata.license}</span>
                </div>
              )}
            </section>

            {/* Tags */}
            <section className="fv-meta-group">
              <div className="fv-meta-group-label">Tags</div>
              <div className="fv-meta-tags">
                <span className="fv-tag">{selectedSkill.department}</span>
                {selectedSkill.canonicalSource && (
                  <span className="fv-tag">{selectedSkill.canonicalSource}</span>
                )}
              </div>
            </section>

            {/* Installed agents */}
            <section className="fv-meta-group">
              <div className="fv-meta-group-label">Agents</div>
              <div className="fv-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && (
                  <span className="fv-meta-empty">Not installed in any agent</span>
                )}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => (
                  <span key={a.id} className="fv-agent-badge">
                    <span className="fv-agent-badge-emoji">{a.emoji}</span>
                    {a.label}
                  </span>
                ))}
              </div>
            </section>

            {/* Source presence */}
            <section className="fv-meta-group">
              <div className="fv-meta-group-label">Presence</div>
              <div className="fv-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="fv-meta-source-row">
                    <span
                      className="fv-meta-source-dot"
                      style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : 'rgba(0,212,170,0.08)' }}
                    />
                    <span className="fv-meta-source-name">{src.label}</span>
                    <span className={`fv-meta-source-kind ${selectedSkill.presence[src.id]}`}>
                      {selectedSkill.presence[src.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}
            <section className="fv-meta-actions">
              <div className="fv-action-grid">
                <button className="fv-action-btn fv-action-primary" onClick={e => e.stopPropagation()}>
                  <Zap size={14} strokeWidth={1.5} />
                  <span className="fv-action-label">Deploy</span>
                </button>
                <button className="fv-action-btn" onClick={e => e.stopPropagation()}>
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="fv-action-label">Duplicate</span>
                </button>
                <button className="fv-action-btn" onClick={e => e.stopPropagation()}>
                  <ArrowRight size={14} strokeWidth={1.5} />
                  <span className="fv-action-label">Move to</span>
                </button>
                <button className="fv-action-btn fv-action-danger" onClick={e => e.stopPropagation()}>
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="fv-action-label">Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
