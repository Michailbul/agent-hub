import { useEffect, useState } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { v7Theme } from '@/lib/cmThemeV7'
import {
  Layers,
  Search,
  ArrowLeft,
  Settings2,
  ExternalLink,
  Copy,
  ArrowRight,
  Trash2,
  ChevronRight,
  Feather,
} from 'lucide-react'
import './v11b-ember.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V11Ember() {
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

  useEffect(() => {
    const t = setTimeout(() => setPanelsReady(true), 50)
    return () => clearTimeout(t)
  }, [])

  const pc = (base: string, panel: FocusedPanel) => {
    let c = `em-panel ${base}`
    if (panelsReady) c += ' em-visible'
    if (focusedPanel === panel) c += ' em-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' em-dimmed'
    return c
  }

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
      <div className="em-canvas">
        <div className="em-loading-state">
          <div className="em-loading-spinner" />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  if (error && !loaded) {
    return (
      <div className="em-canvas">
        <div className="em-loading-state em-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="em-canvas">
      <div className="em-panels">

        {/* Navigator Panel */}
        <aside
          className={pc('em-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms' }}
        >
          <header className="em-panel-header">
            <div className="em-panel-title-row">
              <Layers size={14} strokeWidth={1.5} className="em-panel-icon" />
              <h3 className="em-panel-title">Navigator</h3>
            </div>
            <span className="em-panel-badge">{skills.length}</span>
          </header>

          <div className="em-nav-controls">
            <div className="em-nav-tabs">
              <button
                className={`em-nav-tab${navTab === 'agents' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('agents') }}
              >Agents</button>
              <button
                className={`em-nav-tab${navTab === 'sources' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('sources') }}
              >Sources</button>
            </div>
            <div className="em-search-bar">
              <Search size={13} strokeWidth={1.5} className="em-search-icon" />
              <input
                className="em-search-input"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="em-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>
              )}
            </div>
          </div>

          <div className="em-nav-tree">
            {navTab === 'agents' && agents.map((agent, i) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="em-agent-group" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    className={`em-agent-row${isExpanded ? ' expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className={`em-chevron-icon${isExpanded ? ' open' : ''}`}
                    />
                    <span className="em-agent-emoji">{agent.emoji}</span>
                    <div className="em-agent-info">
                      <span className="em-agent-name">{agent.label}</span>
                      <span className="em-agent-path">{agent.skillsRoot}</span>
                    </div>
                    <span className="em-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="em-skill-list">
                      {visible.length === 0 && <div className="em-no-results">No skills match</div>}
                      {visible.map(sk => (
                        <button
                          key={sk.id}
                          className={`em-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                        >
                          <span className="em-skill-indicator" />
                          <span className="em-skill-name">{sk.displayName}</span>
                          <span className="em-skill-dept-label">{sk.department}</span>
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
                  className={`em-source-row${!activeSourceFilter ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}
                >
                  <span className="em-source-dot" style={{ background: '#d97757' }} />
                  <span className="em-source-name">All Skills</span>
                  <span className="em-source-count">{skills.length}</span>
                </button>
                {sources.map(src => {
                  const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                  const isOpen = !collapsedSources.has(src.id)
                  const isTreeExpanded = expandedTreeSources.has(src.id)
                  const LIMIT = 10
                  const showToggle = srcSkills.length > LIMIT
                  const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                  return (
                    <div key={src.id} className="em-source-group">
                      <button
                        className={`em-source-row${activeSourceFilter === src.id ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}
                      >
                        <span className="em-source-dot" style={{ background: src.color }} />
                        <span className="em-source-name">{src.label}</span>
                        <span className="em-source-count">{srcSkills.length}</span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={`em-chevron-icon${isOpen ? ' open' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }}
                        />
                      </button>
                      {isOpen && (
                        <div className="em-skill-list">
                          {visibleSkills.map(sk => (
                            <button
                              key={sk.id}
                              className={`em-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                            >
                              <span className="em-skill-indicator" />
                              <span className="em-skill-name">{sk.displayName}</span>
                            </button>
                          ))}
                          {showToggle && !isTreeExpanded && (
                            <button className="em-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
                              Show all {srcSkills.length}
                            </button>
                          )}
                          {showToggle && isTreeExpanded && (
                            <button className="em-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
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

          <footer className="em-nav-depts">
            <div className="em-dept-label">Departments</div>
            <div className="em-dept-pills">
              {departments.map(dept => {
                const count = skills.filter(s => s.department === dept).length
                return (
                  <button
                    key={dept}
                    className={`em-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                  >
                    {dept} <span className="em-dept-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </footer>
        </aside>

        {/* Editor Panel */}
        {selectedSkill ? (
          <main
            className={pc('em-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
            style={{ animationDelay: '80ms' }}
          >
            <header className="em-panel-header em-editor-header">
              <button className="em-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="em-filename-area">
                <span className="em-filename">SKILL.md</span>
                <span className="em-file-meta">{selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="em-editor-body">
              {skillContent !== null ? (
                <SkillCMEditor
                  key={selectedSkill.id}
                  content={skillContent}
                  filePath={selectedSkill.previewPath}
                  theme={v7Theme}
                  prefix="em"
                />
              ) : (
                <div className="em-editor-loading">
                  <div className="em-loading-spinner" />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className={`em-welcome${panelsReady ? ' em-visible' : ''}`} style={{ animationDelay: '80ms' }}>
            <div className="em-welcome-inner">
              <Feather size={28} strokeWidth={1} className="em-welcome-icon" />
              <h2 className="em-welcome-title">Skills Lab</h2>
              <p className="em-welcome-sub">Select a skill from the navigator to begin editing</p>
              <div className="em-welcome-stats">
                <span className="em-stat">{skills.length} skills</span>
                <span className="em-stat-sep">&middot;</span>
                <span className="em-stat">{agents.length} agents</span>
                <span className="em-stat-sep">&middot;</span>
                <span className="em-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* Inspector Panel */}
        {selectedSkill && (
          <aside
            className={pc('em-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
            style={{ animationDelay: '160ms' }}
          >
            <header className="em-panel-header">
              <div className="em-panel-title-row">
                <Settings2 size={14} strokeWidth={1.5} className="em-panel-icon" />
                <h3 className="em-panel-title">Inspector</h3>
              </div>
            </header>

            <section className="em-meta-section">
              <div className="em-meta-row">
                <span className="em-meta-key">Name</span>
                <span className="em-meta-val">{selectedSkill.displayName}</span>
              </div>
              <div className="em-meta-row">
                <span className="em-meta-key">Dept</span>
                <span className="em-meta-val">{selectedSkill.department}</span>
              </div>
              <div className="em-meta-row">
                <span className="em-meta-key">Source</span>
                <span className="em-meta-val">{selectedSkill.canonicalSource}</span>
              </div>
              {selectedSkill.metadata.author && (
                <div className="em-meta-row">
                  <span className="em-meta-key">Author</span>
                  <span className="em-meta-val">{selectedSkill.metadata.author}</span>
                </div>
              )}
              {selectedSkill.metadata.source && (
                <div className="em-meta-row">
                  <span className="em-meta-key">Origin</span>
                  <span className="em-meta-val">{selectedSkill.metadata.source}</span>
                </div>
              )}
              {selectedSkill.metadata.license && (
                <div className="em-meta-row">
                  <span className="em-meta-key">License</span>
                  <span className="em-meta-val">{selectedSkill.metadata.license}</span>
                </div>
              )}
            </section>

            <section className="em-meta-group">
              <div className="em-meta-group-label">Tags</div>
              <div className="em-meta-tags">
                <span className="em-tag">{selectedSkill.department}</span>
                {selectedSkill.canonicalSource && (
                  <span className="em-tag">{selectedSkill.canonicalSource}</span>
                )}
              </div>
            </section>

            <section className="em-meta-group">
              <div className="em-meta-group-label">Agents</div>
              <div className="em-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && (
                  <span className="em-meta-empty">Not installed in any agent</span>
                )}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => (
                  <span key={a.id} className="em-agent-badge">
                    <span className="em-agent-badge-emoji">{a.emoji}</span>
                    {a.label}
                  </span>
                ))}
              </div>
            </section>

            <section className="em-meta-group">
              <div className="em-meta-group-label">Presence</div>
              <div className="em-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="em-meta-source-row">
                    <span
                      className="em-meta-source-dot"
                      style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#3e3e38' }}
                    />
                    <span className="em-meta-source-name">{src.label}</span>
                    <span className={`em-meta-source-kind ${selectedSkill.presence[src.id]}`}>
                      {selectedSkill.presence[src.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="em-meta-actions">
              <div className="em-action-grid">
                <button className="em-action-btn em-action-primary" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={14} strokeWidth={1.5} />
                  <span className="em-action-label">Deploy</span>
                </button>
                <button className="em-action-btn" onClick={e => e.stopPropagation()}>
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="em-action-label">Duplicate</span>
                </button>
                <button className="em-action-btn" onClick={e => e.stopPropagation()}>
                  <ArrowRight size={14} strokeWidth={1.5} />
                  <span className="em-action-label">Move to</span>
                </button>
                <button className="em-action-btn em-action-danger" onClick={e => e.stopPropagation()}>
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="em-action-label">Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
