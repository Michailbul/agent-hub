import { useEffect, useState } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { brandTheme } from '@/lib/cmBrandTheme'
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
import './v11-kiln-light.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V11KilnLight() {
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
    let c = `kl-panel ${base}`
    if (panelsReady) c += ' kl-visible'
    if (focusedPanel === panel) c += ' kl-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' kl-dimmed'
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

        {/* Navigator Panel */}
        <aside
          className={pc('kl-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms' }}
        >
          <header className="kl-panel-header">
            <div className="kl-panel-title-row">
              <Layers size={14} strokeWidth={1.5} className="kl-panel-icon" />
              <h3 className="kl-panel-title">Navigator</h3>
            </div>
            <span className="kl-panel-badge">{skills.length}</span>
          </header>

          <div className="kl-nav-controls">
            <div className="kl-nav-tabs">
              <button
                className={`kl-nav-tab${navTab === 'agents' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('agents') }}
              >Agents</button>
              <button
                className={`kl-nav-tab${navTab === 'sources' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('sources') }}
              >Sources</button>
            </div>
            <div className="kl-search-bar">
              <Search size={13} strokeWidth={1.5} className="kl-search-icon" />
              <input
                className="kl-search-input"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="kl-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>
              )}
            </div>
          </div>

          <div className="kl-nav-tree">
            {navTab === 'agents' && agents.map((agent, i) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="kl-agent-group" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    className={`kl-agent-row${isExpanded ? ' expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className={`kl-chevron-icon${isExpanded ? ' open' : ''}`}
                    />
                    <span className="kl-agent-emoji">{agent.emoji}</span>
                    <div className="kl-agent-info">
                      <span className="kl-agent-name">{agent.label}</span>
                      <span className="kl-agent-path">{agent.skillsRoot}</span>
                    </div>
                    <span className="kl-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="kl-skill-list">
                      {visible.length === 0 && <div className="kl-no-results">No skills match</div>}
                      {visible.map(sk => (
                        <button
                          key={sk.id}
                          className={`kl-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                        >
                          <span className="kl-skill-indicator" />
                          <span className="kl-skill-name">{sk.displayName}</span>
                          <span className="kl-skill-dept-label">{sk.department}</span>
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
                  className={`kl-source-row${!activeSourceFilter ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}
                >
                  <span className="kl-source-dot" style={{ background: '#d97757' }} />
                  <span className="kl-source-name">All Skills</span>
                  <span className="kl-source-count">{skills.length}</span>
                </button>
                {sources.map(src => {
                  const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                  const isOpen = !collapsedSources.has(src.id)
                  const isTreeExpanded = expandedTreeSources.has(src.id)
                  const LIMIT = 10
                  const showToggle = srcSkills.length > LIMIT
                  const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                  return (
                    <div key={src.id} className="kl-source-group">
                      <button
                        className={`kl-source-row${activeSourceFilter === src.id ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}
                      >
                        <span className="kl-source-dot" style={{ background: src.color }} />
                        <span className="kl-source-name">{src.label}</span>
                        <span className="kl-source-count">{srcSkills.length}</span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={`kl-chevron-icon${isOpen ? ' open' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }}
                        />
                      </button>
                      {isOpen && (
                        <div className="kl-skill-list">
                          {visibleSkills.map(sk => (
                            <button
                              key={sk.id}
                              className={`kl-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                            >
                              <span className="kl-skill-indicator" />
                              <span className="kl-skill-name">{sk.displayName}</span>
                            </button>
                          ))}
                          {showToggle && !isTreeExpanded && (
                            <button className="kl-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
                              Show all {srcSkills.length}
                            </button>
                          )}
                          {showToggle && isTreeExpanded && (
                            <button className="kl-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
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

          <footer className="kl-nav-depts">
            <div className="kl-dept-label">Departments</div>
            <div className="kl-dept-pills">
              {departments.map(dept => {
                const count = skills.filter(s => s.department === dept).length
                return (
                  <button
                    key={dept}
                    className={`kl-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                  >
                    {dept} <span className="kl-dept-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </footer>
        </aside>

        {/* Editor Panel */}
        {selectedSkill ? (
          <main
            className={pc('kl-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
            style={{ animationDelay: '80ms' }}
          >
            <header className="kl-panel-header kl-editor-header">
              <button className="kl-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="kl-filename-area">
                <span className="kl-filename">SKILL.md</span>
                <span className="kl-file-meta">{selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="kl-editor-body">
              {skillContent !== null ? (
                <SkillCMEditor
                  key={selectedSkill.id}
                  content={skillContent}
                  filePath={selectedSkill.previewPath}
                  theme={brandTheme}
                  prefix="kn"
                />
              ) : (
                <div className="kl-editor-loading">
                  <div className="kl-loading-spinner" />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className={`kl-welcome${panelsReady ? ' kl-visible' : ''}`} style={{ animationDelay: '80ms' }}>
            <div className="kl-welcome-inner">
              <Feather size={28} strokeWidth={1} className="kl-welcome-icon" />
              <h2 className="kl-welcome-title">Skills Lab</h2>
              <p className="kl-welcome-sub">Select a skill from the navigator to begin editing</p>
              <div className="kl-welcome-stats">
                <span className="kl-stat">{skills.length} skills</span>
                <span className="kl-stat-sep">&middot;</span>
                <span className="kl-stat">{agents.length} agents</span>
                <span className="kl-stat-sep">&middot;</span>
                <span className="kl-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* Inspector Panel */}
        {selectedSkill && (
          <aside
            className={pc('kl-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
            style={{ animationDelay: '160ms' }}
          >
            <header className="kl-panel-header">
              <div className="kl-panel-title-row">
                <Settings2 size={14} strokeWidth={1.5} className="kl-panel-icon" />
                <h3 className="kl-panel-title">Inspector</h3>
              </div>
            </header>

            <section className="kl-meta-section">
              <div className="kl-meta-row">
                <span className="kl-meta-key">Name</span>
                <span className="kl-meta-val">{selectedSkill.displayName}</span>
              </div>
              <div className="kl-meta-row">
                <span className="kl-meta-key">Dept</span>
                <span className="kl-meta-val">{selectedSkill.department}</span>
              </div>
              <div className="kl-meta-row">
                <span className="kl-meta-key">Source</span>
                <span className="kl-meta-val">{selectedSkill.canonicalSource}</span>
              </div>
              {selectedSkill.metadata.author && (
                <div className="kl-meta-row">
                  <span className="kl-meta-key">Author</span>
                  <span className="kl-meta-val">{selectedSkill.metadata.author}</span>
                </div>
              )}
              {selectedSkill.metadata.source && (
                <div className="kl-meta-row">
                  <span className="kl-meta-key">Origin</span>
                  <span className="kl-meta-val">{selectedSkill.metadata.source}</span>
                </div>
              )}
              {selectedSkill.metadata.license && (
                <div className="kl-meta-row">
                  <span className="kl-meta-key">License</span>
                  <span className="kl-meta-val">{selectedSkill.metadata.license}</span>
                </div>
              )}
            </section>

            <section className="kl-meta-group">
              <div className="kl-meta-group-label">Tags</div>
              <div className="kl-meta-tags">
                <span className="kl-tag">{selectedSkill.department}</span>
                {selectedSkill.canonicalSource && (
                  <span className="kl-tag">{selectedSkill.canonicalSource}</span>
                )}
              </div>
            </section>

            <section className="kl-meta-group">
              <div className="kl-meta-group-label">Agents</div>
              <div className="kl-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && (
                  <span className="kl-meta-empty">Not installed in any agent</span>
                )}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => (
                  <span key={a.id} className="kl-agent-badge">
                    <span className="kl-agent-badge-emoji">{a.emoji}</span>
                    {a.label}
                  </span>
                ))}
              </div>
            </section>

            <section className="kl-meta-group">
              <div className="kl-meta-group-label">Presence</div>
              <div className="kl-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="kl-meta-source-row">
                    <span
                      className="kl-meta-source-dot"
                      style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#e8e7e4' }}
                    />
                    <span className="kl-meta-source-name">{src.label}</span>
                    <span className={`kl-meta-source-kind ${selectedSkill.presence[src.id]}`}>
                      {selectedSkill.presence[src.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="kl-meta-actions">
              <div className="kl-action-grid">
                <button className="kl-action-btn kl-action-primary" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={14} strokeWidth={1.5} />
                  <span className="kl-action-label">Deploy</span>
                </button>
                <button className="kl-action-btn" onClick={e => e.stopPropagation()}>
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="kl-action-label">Duplicate</span>
                </button>
                <button className="kl-action-btn" onClick={e => e.stopPropagation()}>
                  <ArrowRight size={14} strokeWidth={1.5} />
                  <span className="kl-action-label">Move to</span>
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
    </div>
  )
}
