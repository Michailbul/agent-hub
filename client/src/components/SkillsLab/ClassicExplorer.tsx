import { useEffect, useState } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { brandTheme } from '@/lib/cmBrandTheme'
import {
  Layers,
  Search,
  ArrowLeft,
  SlidersHorizontal,
  ExternalLink,
  Copy,
  ArrowRight,
  Trash2,
  ChevronRight,
  Compass,
} from 'lucide-react'
import './default-brand.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function ClassicExplorer() {
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
    let c = `sc-panel ${base}`
    if (panelsReady) c += ' sc-visible'
    if (focusedPanel === panel) c += ' sc-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' sc-dimmed'
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
      <div className="sc-canvas">
        <div className="sc-loading-state">
          <div className="sc-loading-spinner" />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  if (error && !loaded) {
    return (
      <div className="sc-canvas">
        <div className="sc-loading-state sc-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="sc-canvas">
      <div className="sc-panels">

        {/* Navigator Panel */}
        <aside
          className={pc('sc-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms' }}
        >
          <header className="sc-panel-header">
            <div className="sc-panel-title-row">
              <Layers size={14} strokeWidth={1.5} className="sc-panel-icon" />
              <h3 className="sc-panel-title">Navigator</h3>
            </div>
            <span className="sc-panel-badge">{skills.length}</span>
          </header>

          <div className="sc-nav-controls">
            <div className="sc-nav-tabs">
              <button
                className={`sc-nav-tab${navTab === 'agents' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('agents') }}
              >Agents</button>
              <button
                className={`sc-nav-tab${navTab === 'sources' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('sources') }}
              >Sources</button>
            </div>
            <div className="sc-search-bar">
              <Search size={13} strokeWidth={1.5} className="sc-search-icon" />
              <input
                className="sc-search-input"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="sc-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>
              )}
            </div>
          </div>

          <div className="sc-nav-tree">
            {navTab === 'agents' && agents.map((agent, i) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="sc-agent-group" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    className={`sc-agent-row${isExpanded ? ' expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className={`sc-chevron-icon${isExpanded ? ' open' : ''}`}
                    />
                    <span className="sc-agent-emoji">{agent.emoji}</span>
                    <div className="sc-agent-info">
                      <span className="sc-agent-name">{agent.label}</span>
                      <span className="sc-agent-path">{agent.skillsRoot}</span>
                    </div>
                    <span className="sc-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="sc-skill-list">
                      {visible.length === 0 && <div className="sc-no-results">No skills match</div>}
                      {visible.map(sk => (
                        <button
                          key={sk.id}
                          className={`sc-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                        >
                          <span className="sc-skill-indicator" />
                          <span className="sc-skill-name">{sk.displayName}</span>
                          <span className="sc-skill-dept-label">{sk.department}</span>
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
                  className={`sc-source-row${!activeSourceFilter ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}
                >
                  <span className="sc-source-dot" style={{ background: '#ff7a64' }} />
                  <span className="sc-source-name">All Skills</span>
                  <span className="sc-source-count">{skills.length}</span>
                </button>
                {sources.map(src => {
                  const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                  const isOpen = !collapsedSources.has(src.id)
                  const isTreeExpanded = expandedTreeSources.has(src.id)
                  const LIMIT = 10
                  const showToggle = srcSkills.length > LIMIT
                  const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                  return (
                    <div key={src.id} className="sc-source-group">
                      <button
                        className={`sc-source-row${activeSourceFilter === src.id ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}
                      >
                        <span className="sc-source-dot" style={{ background: src.color }} />
                        <span className="sc-source-name">{src.label}</span>
                        <span className="sc-source-count">{srcSkills.length}</span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={`sc-chevron-icon${isOpen ? ' open' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }}
                        />
                      </button>
                      {isOpen && (
                        <div className="sc-skill-list">
                          {visibleSkills.map(sk => (
                            <button
                              key={sk.id}
                              className={`sc-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                            >
                              <span className="sc-skill-indicator" />
                              <span className="sc-skill-name">{sk.displayName}</span>
                            </button>
                          ))}
                          {showToggle && !isTreeExpanded && (
                            <button className="sc-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
                              Show all {srcSkills.length}
                            </button>
                          )}
                          {showToggle && isTreeExpanded && (
                            <button className="sc-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
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

          <footer className="sc-nav-depts">
            <div className="sc-dept-label">Departments</div>
            <div className="sc-dept-pills">
              {departments.map(dept => {
                const count = skills.filter(s => s.department === dept).length
                return (
                  <button
                    key={dept}
                    className={`sc-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                  >
                    {dept} <span className="sc-dept-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </footer>
        </aside>

        {/* Editor Panel */}
        {selectedSkill ? (
          <main
            className={pc('sc-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
            style={{ animationDelay: '80ms' }}
          >
            <header className="sc-panel-header sc-editor-header">
              <button className="sc-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="sc-filename-area">
                <span className="sc-filename">SKILL.md</span>
                <span className="sc-file-meta">{selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="sc-editor-body">
              {skillContent !== null ? (
                <SkillCMEditor
                  key={selectedSkill.id}
                  content={skillContent}
                  filePath={selectedSkill.previewPath}
                  theme={brandTheme}
                  prefix="sc"
                />
              ) : (
                <div className="sc-editor-loading">
                  <div className="sc-loading-spinner" />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className={`sc-welcome${panelsReady ? ' sc-visible' : ''}`} style={{ animationDelay: '80ms' }}>
            <div className="sc-welcome-inner">
              <Compass size={36} strokeWidth={1} className="sc-welcome-icon" />
              <h2 className="sc-welcome-title">Skills Lab</h2>
              <p className="sc-welcome-sub">Select a skill from the navigator to begin editing</p>
              <div className="sc-welcome-stats">
                <span className="sc-stat">{skills.length} skills</span>
                <span className="sc-stat-sep">&middot;</span>
                <span className="sc-stat">{agents.length} agents</span>
                <span className="sc-stat-sep">&middot;</span>
                <span className="sc-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* Inspector Panel */}
        {selectedSkill && (
          <aside
            className={pc('sc-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
            style={{ animationDelay: '160ms' }}
          >
            <header className="sc-panel-header">
              <div className="sc-panel-title-row">
                <SlidersHorizontal size={14} strokeWidth={1.5} className="sc-panel-icon" />
                <h3 className="sc-panel-title">Inspector</h3>
              </div>
            </header>

            <section className="sc-meta-section">
              <div className="sc-meta-row">
                <span className="sc-meta-key">Name</span>
                <span className="sc-meta-val">{selectedSkill.displayName}</span>
              </div>
              <div className="sc-meta-row">
                <span className="sc-meta-key">Dept</span>
                <span className="sc-meta-val">{selectedSkill.department}</span>
              </div>
              <div className="sc-meta-row">
                <span className="sc-meta-key">Source</span>
                <span className="sc-meta-val">{selectedSkill.canonicalSource}</span>
              </div>
              {selectedSkill.metadata.author && (
                <div className="sc-meta-row">
                  <span className="sc-meta-key">Author</span>
                  <span className="sc-meta-val">{selectedSkill.metadata.author}</span>
                </div>
              )}
              {selectedSkill.metadata.source && (
                <div className="sc-meta-row">
                  <span className="sc-meta-key">Origin</span>
                  <span className="sc-meta-val">{selectedSkill.metadata.source}</span>
                </div>
              )}
              {selectedSkill.metadata.license && (
                <div className="sc-meta-row">
                  <span className="sc-meta-key">License</span>
                  <span className="sc-meta-val">{selectedSkill.metadata.license}</span>
                </div>
              )}
            </section>

            <section className="sc-meta-group">
              <div className="sc-meta-group-label">Tags</div>
              <div className="sc-meta-tags">
                <span className="sc-tag">{selectedSkill.department}</span>
                {selectedSkill.canonicalSource && (
                  <span className="sc-tag">{selectedSkill.canonicalSource}</span>
                )}
              </div>
            </section>

            <section className="sc-meta-group">
              <div className="sc-meta-group-label">Agents</div>
              <div className="sc-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && (
                  <span className="sc-meta-empty">Not installed in any agent</span>
                )}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => (
                  <span key={a.id} className="sc-agent-badge">
                    <span className="sc-agent-badge-emoji">{a.emoji}</span>
                    {a.label}
                  </span>
                ))}
              </div>
            </section>

            <section className="sc-meta-group">
              <div className="sc-meta-group-label">Presence</div>
              <div className="sc-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="sc-meta-source-row">
                    <span
                      className="sc-meta-source-dot"
                      style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#e4d4c4' }}
                    />
                    <span className="sc-meta-source-name">{src.label}</span>
                    <span className={`sc-meta-source-kind ${selectedSkill.presence[src.id]}`}>
                      {selectedSkill.presence[src.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="sc-meta-actions">
              <div className="sc-action-grid">
                <button className="sc-action-btn sc-action-primary" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={14} strokeWidth={1.5} />
                  <span className="sc-action-label">Deploy</span>
                </button>
                <button className="sc-action-btn" onClick={e => e.stopPropagation()}>
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="sc-action-label">Duplicate</span>
                </button>
                <button className="sc-action-btn" onClick={e => e.stopPropagation()}>
                  <ArrowRight size={14} strokeWidth={1.5} />
                  <span className="sc-action-label">Move to</span>
                </button>
                <button className="sc-action-btn sc-action-danger" onClick={e => e.stopPropagation()}>
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="sc-action-label">Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
