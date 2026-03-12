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
import './v11c-carbon.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V11Carbon() {
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
    let c = `cb-panel ${base}`
    if (panelsReady) c += ' cb-visible'
    if (focusedPanel === panel) c += ' cb-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' cb-dimmed'
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
      <div className="cb-canvas">
        <div className="cb-loading-state">
          <div className="cb-loading-spinner" />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  if (error && !loaded) {
    return (
      <div className="cb-canvas">
        <div className="cb-loading-state cb-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="cb-canvas">
      <div className="cb-panels">

        {/* Navigator Panel */}
        <aside
          className={pc('cb-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms' }}
        >
          <header className="cb-panel-header">
            <div className="cb-panel-title-row">
              <Layers size={14} strokeWidth={1.5} className="cb-panel-icon" />
              <h3 className="cb-panel-title">Navigator</h3>
            </div>
            <span className="cb-panel-badge">{skills.length}</span>
          </header>

          <div className="cb-nav-controls">
            <div className="cb-nav-tabs">
              <button
                className={`cb-nav-tab${navTab === 'agents' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('agents') }}
              >Agents</button>
              <button
                className={`cb-nav-tab${navTab === 'sources' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('sources') }}
              >Sources</button>
            </div>
            <div className="cb-search-bar">
              <Search size={13} strokeWidth={1.5} className="cb-search-icon" />
              <input
                className="cb-search-input"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="cb-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>
              )}
            </div>
          </div>

          <div className="cb-nav-tree">
            {navTab === 'agents' && agents.map((agent, i) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="cb-agent-group" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    className={`cb-agent-row${isExpanded ? ' expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className={`cb-chevron-icon${isExpanded ? ' open' : ''}`}
                    />
                    <span className="cb-agent-emoji">{agent.emoji}</span>
                    <div className="cb-agent-info">
                      <span className="cb-agent-name">{agent.label}</span>
                      <span className="cb-agent-path">{agent.skillsRoot}</span>
                    </div>
                    <span className="cb-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="cb-skill-list">
                      {visible.length === 0 && <div className="cb-no-results">No skills match</div>}
                      {visible.map(sk => (
                        <button
                          key={sk.id}
                          className={`cb-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                        >
                          <span className="cb-skill-indicator" />
                          <span className="cb-skill-name">{sk.displayName}</span>
                          <span className="cb-skill-dept-label">{sk.department}</span>
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
                  className={`cb-source-row${!activeSourceFilter ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}
                >
                  <span className="cb-source-dot" style={{ background: '#d97757' }} />
                  <span className="cb-source-name">All Skills</span>
                  <span className="cb-source-count">{skills.length}</span>
                </button>
                {sources.map(src => {
                  const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                  const isOpen = !collapsedSources.has(src.id)
                  const isTreeExpanded = expandedTreeSources.has(src.id)
                  const LIMIT = 10
                  const showToggle = srcSkills.length > LIMIT
                  const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                  return (
                    <div key={src.id} className="cb-source-group">
                      <button
                        className={`cb-source-row${activeSourceFilter === src.id ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}
                      >
                        <span className="cb-source-dot" style={{ background: src.color }} />
                        <span className="cb-source-name">{src.label}</span>
                        <span className="cb-source-count">{srcSkills.length}</span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={`cb-chevron-icon${isOpen ? ' open' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }}
                        />
                      </button>
                      {isOpen && (
                        <div className="cb-skill-list">
                          {visibleSkills.map(sk => (
                            <button
                              key={sk.id}
                              className={`cb-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                            >
                              <span className="cb-skill-indicator" />
                              <span className="cb-skill-name">{sk.displayName}</span>
                            </button>
                          ))}
                          {showToggle && !isTreeExpanded && (
                            <button className="cb-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
                              Show all {srcSkills.length}
                            </button>
                          )}
                          {showToggle && isTreeExpanded && (
                            <button className="cb-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
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

          <footer className="cb-nav-depts">
            <div className="cb-dept-label">Departments</div>
            <div className="cb-dept-pills">
              {departments.map(dept => {
                const count = skills.filter(s => s.department === dept).length
                return (
                  <button
                    key={dept}
                    className={`cb-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                  >
                    {dept} <span className="cb-dept-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </footer>
        </aside>

        {/* Editor Panel */}
        {selectedSkill ? (
          <main
            className={pc('cb-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
            style={{ animationDelay: '80ms' }}
          >
            <header className="cb-panel-header cb-editor-header">
              <button className="cb-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="cb-filename-area">
                <span className="cb-filename">SKILL.md</span>
                <span className="cb-file-meta">{selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="cb-editor-body">
              {skillContent !== null ? (
                <SkillCMEditor
                  key={selectedSkill.id}
                  content={skillContent}
                  filePath={selectedSkill.previewPath}
                  theme={v7Theme}
                  prefix="cb"
                />
              ) : (
                <div className="cb-editor-loading">
                  <div className="cb-loading-spinner" />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className={`cb-welcome${panelsReady ? ' cb-visible' : ''}`} style={{ animationDelay: '80ms' }}>
            <div className="cb-welcome-inner">
              <Feather size={28} strokeWidth={1} className="cb-welcome-icon" />
              <h2 className="cb-welcome-title">Skills Lab</h2>
              <p className="cb-welcome-sub">Select a skill from the navigator to begin editing</p>
              <div className="cb-welcome-stats">
                <span className="cb-stat">{skills.length} skills</span>
                <span className="cb-stat-sep">&middot;</span>
                <span className="cb-stat">{agents.length} agents</span>
                <span className="cb-stat-sep">&middot;</span>
                <span className="cb-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* Inspector Panel */}
        {selectedSkill && (
          <aside
            className={pc('cb-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
            style={{ animationDelay: '160ms' }}
          >
            <header className="cb-panel-header">
              <div className="cb-panel-title-row">
                <Settings2 size={14} strokeWidth={1.5} className="cb-panel-icon" />
                <h3 className="cb-panel-title">Inspector</h3>
              </div>
            </header>

            <section className="cb-meta-section">
              <div className="cb-meta-row">
                <span className="cb-meta-key">Name</span>
                <span className="cb-meta-val">{selectedSkill.displayName}</span>
              </div>
              <div className="cb-meta-row">
                <span className="cb-meta-key">Dept</span>
                <span className="cb-meta-val">{selectedSkill.department}</span>
              </div>
              <div className="cb-meta-row">
                <span className="cb-meta-key">Source</span>
                <span className="cb-meta-val">{selectedSkill.canonicalSource}</span>
              </div>
              {selectedSkill.metadata.author && (
                <div className="cb-meta-row">
                  <span className="cb-meta-key">Author</span>
                  <span className="cb-meta-val">{selectedSkill.metadata.author}</span>
                </div>
              )}
              {selectedSkill.metadata.source && (
                <div className="cb-meta-row">
                  <span className="cb-meta-key">Origin</span>
                  <span className="cb-meta-val">{selectedSkill.metadata.source}</span>
                </div>
              )}
              {selectedSkill.metadata.license && (
                <div className="cb-meta-row">
                  <span className="cb-meta-key">License</span>
                  <span className="cb-meta-val">{selectedSkill.metadata.license}</span>
                </div>
              )}
            </section>

            <section className="cb-meta-group">
              <div className="cb-meta-group-label">Tags</div>
              <div className="cb-meta-tags">
                <span className="cb-tag">{selectedSkill.department}</span>
                {selectedSkill.canonicalSource && (
                  <span className="cb-tag">{selectedSkill.canonicalSource}</span>
                )}
              </div>
            </section>

            <section className="cb-meta-group">
              <div className="cb-meta-group-label">Agents</div>
              <div className="cb-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && (
                  <span className="cb-meta-empty">Not installed in any agent</span>
                )}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => (
                  <span key={a.id} className="cb-agent-badge">
                    <span className="cb-agent-badge-emoji">{a.emoji}</span>
                    {a.label}
                  </span>
                ))}
              </div>
            </section>

            <section className="cb-meta-group">
              <div className="cb-meta-group-label">Presence</div>
              <div className="cb-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="cb-meta-source-row">
                    <span
                      className="cb-meta-source-dot"
                      style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#3e3e38' }}
                    />
                    <span className="cb-meta-source-name">{src.label}</span>
                    <span className={`cb-meta-source-kind ${selectedSkill.presence[src.id]}`}>
                      {selectedSkill.presence[src.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="cb-meta-actions">
              <div className="cb-action-grid">
                <button className="cb-action-btn cb-action-primary" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={14} strokeWidth={1.5} />
                  <span className="cb-action-label">Deploy</span>
                </button>
                <button className="cb-action-btn" onClick={e => e.stopPropagation()}>
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="cb-action-label">Duplicate</span>
                </button>
                <button className="cb-action-btn" onClick={e => e.stopPropagation()}>
                  <ArrowRight size={14} strokeWidth={1.5} />
                  <span className="cb-action-label">Move to</span>
                </button>
                <button className="cb-action-btn cb-action-danger" onClick={e => e.stopPropagation()}>
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="cb-action-label">Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
