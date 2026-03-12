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
import './v11-kiln.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V11Kiln() {
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
    let c = `kn-panel ${base}`
    if (panelsReady) c += ' kn-visible'
    if (focusedPanel === panel) c += ' kn-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' kn-dimmed'
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

        {/* Navigator Panel */}
        <aside
          className={pc('kn-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms' }}
        >
          <header className="kn-panel-header">
            <div className="kn-panel-title-row">
              <Layers size={14} strokeWidth={1.5} className="kn-panel-icon" />
              <h3 className="kn-panel-title">Navigator</h3>
            </div>
            <span className="kn-panel-badge">{skills.length}</span>
          </header>

          <div className="kn-nav-controls">
            <div className="kn-nav-tabs">
              <button
                className={`kn-nav-tab${navTab === 'agents' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('agents') }}
              >Agents</button>
              <button
                className={`kn-nav-tab${navTab === 'sources' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('sources') }}
              >Sources</button>
            </div>
            <div className="kn-search-bar">
              <Search size={13} strokeWidth={1.5} className="kn-search-icon" />
              <input
                className="kn-search-input"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="kn-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>
              )}
            </div>
          </div>

          <div className="kn-nav-tree">
            {navTab === 'agents' && agents.map((agent, i) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="kn-agent-group" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    className={`kn-agent-row${isExpanded ? ' expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className={`kn-chevron-icon${isExpanded ? ' open' : ''}`}
                    />
                    <span className="kn-agent-emoji">{agent.emoji}</span>
                    <div className="kn-agent-info">
                      <span className="kn-agent-name">{agent.label}</span>
                      <span className="kn-agent-path">{agent.skillsRoot}</span>
                    </div>
                    <span className="kn-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="kn-skill-list">
                      {visible.length === 0 && <div className="kn-no-results">No skills match</div>}
                      {visible.map(sk => (
                        <button
                          key={sk.id}
                          className={`kn-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                        >
                          <span className="kn-skill-indicator" />
                          <span className="kn-skill-name">{sk.displayName}</span>
                          <span className="kn-skill-dept-label">{sk.department}</span>
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
                  className={`kn-source-row${!activeSourceFilter ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}
                >
                  <span className="kn-source-dot" style={{ background: '#d97757' }} />
                  <span className="kn-source-name">All Skills</span>
                  <span className="kn-source-count">{skills.length}</span>
                </button>
                {sources.map(src => {
                  const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                  const isOpen = !collapsedSources.has(src.id)
                  const isTreeExpanded = expandedTreeSources.has(src.id)
                  const LIMIT = 10
                  const showToggle = srcSkills.length > LIMIT
                  const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                  return (
                    <div key={src.id} className="kn-source-group">
                      <button
                        className={`kn-source-row${activeSourceFilter === src.id ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}
                      >
                        <span className="kn-source-dot" style={{ background: src.color }} />
                        <span className="kn-source-name">{src.label}</span>
                        <span className="kn-source-count">{srcSkills.length}</span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={`kn-chevron-icon${isOpen ? ' open' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }}
                        />
                      </button>
                      {isOpen && (
                        <div className="kn-skill-list">
                          {visibleSkills.map(sk => (
                            <button
                              key={sk.id}
                              className={`kn-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                            >
                              <span className="kn-skill-indicator" />
                              <span className="kn-skill-name">{sk.displayName}</span>
                            </button>
                          ))}
                          {showToggle && !isTreeExpanded && (
                            <button className="kn-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
                              Show all {srcSkills.length}
                            </button>
                          )}
                          {showToggle && isTreeExpanded && (
                            <button className="kn-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
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

          <footer className="kn-nav-depts">
            <div className="kn-dept-label">Departments</div>
            <div className="kn-dept-pills">
              {departments.map(dept => {
                const count = skills.filter(s => s.department === dept).length
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

        {/* Editor Panel */}
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
                <span className="kn-filename">SKILL.md</span>
                <span className="kn-file-meta">{selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="kn-editor-body">
              {skillContent !== null ? (
                <SkillCMEditor
                  key={selectedSkill.id}
                  content={skillContent}
                  filePath={selectedSkill.previewPath}
                  theme={v7Theme}
                  prefix="kn"
                />
              ) : (
                <div className="kn-editor-loading">
                  <div className="kn-loading-spinner" />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className={`kn-welcome${panelsReady ? ' kn-visible' : ''}`} style={{ animationDelay: '80ms' }}>
            <div className="kn-welcome-inner">
              <Feather size={28} strokeWidth={1} className="kn-welcome-icon" />
              <h2 className="kn-welcome-title">Skills Lab</h2>
              <p className="kn-welcome-sub">Select a skill from the navigator to begin editing</p>
              <div className="kn-welcome-stats">
                <span className="kn-stat">{skills.length} skills</span>
                <span className="kn-stat-sep">&middot;</span>
                <span className="kn-stat">{agents.length} agents</span>
                <span className="kn-stat-sep">&middot;</span>
                <span className="kn-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* Inspector Panel */}
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
                <span className="kn-meta-val">{selectedSkill.canonicalSource}</span>
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
                {selectedSkill.canonicalSource && (
                  <span className="kn-tag">{selectedSkill.canonicalSource}</span>
                )}
              </div>
            </section>

            <section className="kn-meta-group">
              <div className="kn-meta-group-label">Agents</div>
              <div className="kn-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && (
                  <span className="kn-meta-empty">Not installed in any agent</span>
                )}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => (
                  <span key={a.id} className="kn-agent-badge">
                    <span className="kn-agent-badge-emoji">{a.emoji}</span>
                    {a.label}
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
              <div className="kn-action-grid">
                <button className="kn-action-btn kn-action-primary" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={14} strokeWidth={1.5} />
                  <span className="kn-action-label">Deploy</span>
                </button>
                <button className="kn-action-btn" onClick={e => e.stopPropagation()}>
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="kn-action-label">Duplicate</span>
                </button>
                <button className="kn-action-btn" onClick={e => e.stopPropagation()}>
                  <ArrowRight size={14} strokeWidth={1.5} />
                  <span className="kn-action-label">Move to</span>
                </button>
                <button className="kn-action-btn kn-action-danger" onClick={e => e.stopPropagation()}>
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="kn-action-label">Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
