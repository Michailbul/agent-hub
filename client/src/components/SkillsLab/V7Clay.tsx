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
import './v7-clay.css'
import './v7-glass-light.css'
import './v7-glass-dark.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

interface V7ClayProps {
  variant?: string
}

export function V7Clay({ variant }: V7ClayProps) {
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
    let c = `cl-panel ${base}`
    if (panelsReady) c += ' cl-visible'
    if (focusedPanel === panel) c += ' cl-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' cl-dimmed'
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
      <div className="cl-canvas">
        <div className="cl-loading-state">
          <div className="cl-loading-spinner" />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  if (error && !loaded) {
    return (
      <div className="cl-canvas">
        <div className="cl-loading-state cl-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`cl-canvas${variant ? ` ${variant}` : ''}`}>
      <div className="cl-panels">

        {/* Navigator Panel */}
        <aside
          className={pc('cl-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms' }}
        >
          <header className="cl-panel-header">
            <div className="cl-panel-title-row">
              <Layers size={14} strokeWidth={1.5} className="cl-panel-icon" />
              <h3 className="cl-panel-title">Navigator</h3>
            </div>
            <span className="cl-panel-badge">{skills.length}</span>
          </header>

          <div className="cl-nav-controls">
            <div className="cl-nav-tabs">
              <button
                className={`cl-nav-tab${navTab === 'agents' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('agents') }}
              >Agents</button>
              <button
                className={`cl-nav-tab${navTab === 'sources' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('sources') }}
              >Sources</button>
            </div>
            <div className="cl-search-bar">
              <Search size={13} strokeWidth={1.5} className="cl-search-icon" />
              <input
                className="cl-search-input"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="cl-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>
              )}
            </div>
          </div>

          <div className="cl-nav-tree">
            {navTab === 'agents' && agents.map((agent, i) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="cl-agent-group" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    className={`cl-agent-row${isExpanded ? ' expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className={`cl-chevron-icon${isExpanded ? ' open' : ''}`}
                    />
                    <span className="cl-agent-emoji">{agent.emoji}</span>
                    <div className="cl-agent-info">
                      <span className="cl-agent-name">{agent.label}</span>
                      <span className="cl-agent-path">{agent.skillsRoot}</span>
                    </div>
                    <span className="cl-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="cl-skill-list">
                      {visible.length === 0 && <div className="cl-no-results">No skills match</div>}
                      {visible.map(sk => (
                        <button
                          key={sk.id}
                          className={`cl-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                        >
                          <span className="cl-skill-indicator" />
                          <span className="cl-skill-name">{sk.displayName}</span>
                          <span className="cl-skill-dept-label">{sk.department}</span>
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
                  className={`cl-source-row${!activeSourceFilter ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}
                >
                  <span className="cl-source-dot" style={{ background: '#d97757' }} />
                  <span className="cl-source-name">All Skills</span>
                  <span className="cl-source-count">{skills.length}</span>
                </button>
                {sources.map(src => {
                  const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                  const isOpen = !collapsedSources.has(src.id)
                  const isTreeExpanded = expandedTreeSources.has(src.id)
                  const LIMIT = 10
                  const showToggle = srcSkills.length > LIMIT
                  const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                  return (
                    <div key={src.id} className="cl-source-group">
                      <button
                        className={`cl-source-row${activeSourceFilter === src.id ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}
                      >
                        <span className="cl-source-dot" style={{ background: src.color }} />
                        <span className="cl-source-name">{src.label}</span>
                        <span className="cl-source-count">{srcSkills.length}</span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={`cl-chevron-icon${isOpen ? ' open' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }}
                        />
                      </button>
                      {isOpen && (
                        <div className="cl-skill-list">
                          {visibleSkills.map(sk => (
                            <button
                              key={sk.id}
                              className={`cl-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                            >
                              <span className="cl-skill-indicator" />
                              <span className="cl-skill-name">{sk.displayName}</span>
                            </button>
                          ))}
                          {showToggle && !isTreeExpanded && (
                            <button className="cl-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
                              Show all {srcSkills.length}
                            </button>
                          )}
                          {showToggle && isTreeExpanded && (
                            <button className="cl-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
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

          <footer className="cl-nav-depts">
            <div className="cl-dept-label">Departments</div>
            <div className="cl-dept-pills">
              {departments.map(dept => {
                const count = skills.filter(s => s.department === dept).length
                return (
                  <button
                    key={dept}
                    className={`cl-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                  >
                    {dept} <span className="cl-dept-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </footer>
        </aside>

        {/* Editor Panel */}
        {selectedSkill ? (
          <main
            className={pc('cl-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
            style={{ animationDelay: '80ms' }}
          >
            <header className="cl-panel-header cl-editor-header">
              <button className="cl-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="cl-filename-area">
                <span className="cl-filename">SKILL.md</span>
                <span className="cl-file-meta">{selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="cl-editor-body">
              {skillContent !== null ? (
                <SkillCMEditor
                  key={selectedSkill.id}
                  content={skillContent}
                  filePath={selectedSkill.previewPath}
                  theme={v7Theme}
                  prefix="cl"
                />
              ) : (
                <div className="cl-editor-loading">
                  <div className="cl-loading-spinner" />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className={`cl-welcome${panelsReady ? ' cl-visible' : ''}`} style={{ animationDelay: '80ms' }}>
            <div className="cl-welcome-inner">
              <Feather size={28} strokeWidth={1} className="cl-welcome-icon" />
              <h2 className="cl-welcome-title">Skills Lab</h2>
              <p className="cl-welcome-sub">Select a skill from the navigator to begin editing</p>
              <div className="cl-welcome-stats">
                <span className="cl-stat">{skills.length} skills</span>
                <span className="cl-stat-sep">&middot;</span>
                <span className="cl-stat">{agents.length} agents</span>
                <span className="cl-stat-sep">&middot;</span>
                <span className="cl-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* Inspector Panel */}
        {selectedSkill && (
          <aside
            className={pc('cl-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
            style={{ animationDelay: '160ms' }}
          >
            <header className="cl-panel-header">
              <div className="cl-panel-title-row">
                <Settings2 size={14} strokeWidth={1.5} className="cl-panel-icon" />
                <h3 className="cl-panel-title">Inspector</h3>
              </div>
            </header>

            <section className="cl-meta-section">
              <div className="cl-meta-row">
                <span className="cl-meta-key">Name</span>
                <span className="cl-meta-val">{selectedSkill.displayName}</span>
              </div>
              <div className="cl-meta-row">
                <span className="cl-meta-key">Dept</span>
                <span className="cl-meta-val">{selectedSkill.department}</span>
              </div>
              <div className="cl-meta-row">
                <span className="cl-meta-key">Source</span>
                <span className="cl-meta-val">{selectedSkill.canonicalSource}</span>
              </div>
              {selectedSkill.metadata.author && (
                <div className="cl-meta-row">
                  <span className="cl-meta-key">Author</span>
                  <span className="cl-meta-val">{selectedSkill.metadata.author}</span>
                </div>
              )}
              {selectedSkill.metadata.source && (
                <div className="cl-meta-row">
                  <span className="cl-meta-key">Origin</span>
                  <span className="cl-meta-val">{selectedSkill.metadata.source}</span>
                </div>
              )}
              {selectedSkill.metadata.license && (
                <div className="cl-meta-row">
                  <span className="cl-meta-key">License</span>
                  <span className="cl-meta-val">{selectedSkill.metadata.license}</span>
                </div>
              )}
            </section>

            <section className="cl-meta-group">
              <div className="cl-meta-group-label">Tags</div>
              <div className="cl-meta-tags">
                <span className="cl-tag">{selectedSkill.department}</span>
                {selectedSkill.canonicalSource && (
                  <span className="cl-tag">{selectedSkill.canonicalSource}</span>
                )}
              </div>
            </section>

            <section className="cl-meta-group">
              <div className="cl-meta-group-label">Agents</div>
              <div className="cl-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && (
                  <span className="cl-meta-empty">Not installed in any agent</span>
                )}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => (
                  <span key={a.id} className="cl-agent-badge">
                    <span className="cl-agent-badge-emoji">{a.emoji}</span>
                    {a.label}
                  </span>
                ))}
              </div>
            </section>

            <section className="cl-meta-group">
              <div className="cl-meta-group-label">Presence</div>
              <div className="cl-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="cl-meta-source-row">
                    <span
                      className="cl-meta-source-dot"
                      style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#3e3e38' }}
                    />
                    <span className="cl-meta-source-name">{src.label}</span>
                    <span className={`cl-meta-source-kind ${selectedSkill.presence[src.id]}`}>
                      {selectedSkill.presence[src.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="cl-meta-actions">
              <div className="cl-action-grid">
                <button className="cl-action-btn cl-action-primary" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={14} strokeWidth={1.5} />
                  <span className="cl-action-label">Deploy</span>
                </button>
                <button className="cl-action-btn" onClick={e => e.stopPropagation()}>
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="cl-action-label">Duplicate</span>
                </button>
                <button className="cl-action-btn" onClick={e => e.stopPropagation()}>
                  <ArrowRight size={14} strokeWidth={1.5} />
                  <span className="cl-action-label">Move to</span>
                </button>
                <button className="cl-action-btn cl-action-danger" onClick={e => e.stopPropagation()}>
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="cl-action-label">Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
