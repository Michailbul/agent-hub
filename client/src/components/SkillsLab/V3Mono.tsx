import { useEffect, useState } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { v3Theme } from '@/lib/cmThemeV3'
import {
  FileText,
  Search,
  ArrowLeft,
  Info,
  ExternalLink,
  Copy,
  ArrowRight,
  Trash2,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import './v3-mono.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V3Mono() {
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
    let c = `oai-panel ${base}`
    if (panelsReady) c += ' oai-visible'
    if (focusedPanel === panel) c += ' oai-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' oai-dimmed'
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
      <div className="oai-canvas">
        <div className="oai-loading-state">
          <div className="oai-loading-spinner" />
          <span>Loading skills...</span>
        </div>
      </div>
    )
  }

  if (error && !loaded) {
    return (
      <div className="oai-canvas">
        <div className="oai-loading-state oai-error">
          <span>Failed to load: {error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="oai-canvas">
      <div className="oai-panels">

        {/* ═══ Navigator Panel (Left, 300px) ═══ */}
        <aside
          className={pc('oai-nav', 'nav')}
          onClick={() => setFocusedPanel('nav')}
          style={{ animationDelay: '0ms' }}
        >
          <header className="oai-panel-header">
            <div className="oai-panel-title-row">
              <FileText size={14} strokeWidth={1.5} className="oai-panel-icon" />
              <h3 className="oai-panel-title">Navigator</h3>
            </div>
            <span className="oai-panel-badge">{skills.length}</span>
          </header>

          <div className="oai-nav-controls">
            <div className="oai-nav-tabs">
              <button
                className={`oai-nav-tab${navTab === 'agents' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('agents') }}
              >Agents</button>
              <button
                className={`oai-nav-tab${navTab === 'sources' ? ' active' : ''}`}
                onClick={e => { e.stopPropagation(); setNavTab('sources') }}
              >Sources</button>
            </div>
            <div className="oai-search-bar">
              <Search size={13} strokeWidth={1.5} className="oai-search-icon" />
              <input
                className="oai-search-input"
                placeholder="Filter skills..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
              {searchQuery && (
                <button className="oai-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>
              )}
            </div>
          </div>

          <div className="oai-nav-tree">
            {navTab === 'agents' && agents.map((agent, i) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="oai-agent-group" style={{ animationDelay: `${i * 40}ms` }}>
                  <button
                    className={`oai-agent-row${isExpanded ? ' expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}
                  >
                    <ChevronRight
                      size={14}
                      strokeWidth={1.5}
                      className={`oai-chevron-icon${isExpanded ? ' open' : ''}`}
                    />
                    <span className="oai-agent-emoji">{agent.emoji}</span>
                    <div className="oai-agent-info">
                      <span className="oai-agent-name">{agent.label}</span>
                      <span className="oai-agent-path">{agent.skillsRoot}</span>
                    </div>
                    <span className="oai-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && (
                    <div className="oai-skill-list">
                      {visible.length === 0 && <div className="oai-no-results">No skills match</div>}
                      {visible.map(sk => (
                        <button
                          key={sk.id}
                          className={`oai-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                          onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                        >
                          <span className="oai-skill-indicator" />
                          <span className="oai-skill-name">{sk.displayName}</span>
                          <span className="oai-skill-dept-label">{sk.department}</span>
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
                  className={`oai-source-row${!activeSourceFilter ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}
                >
                  <span className="oai-source-dot" style={{ background: '#FFFFFF' }} />
                  <span className="oai-source-name">All Skills</span>
                  <span className="oai-source-count">{skills.length}</span>
                </button>
                {sources.map(src => {
                  const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                  const isOpen = !collapsedSources.has(src.id)
                  const isTreeExpanded = expandedTreeSources.has(src.id)
                  const LIMIT = 10
                  const showToggle = srcSkills.length > LIMIT
                  const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                  return (
                    <div key={src.id} className="oai-source-group">
                      <button
                        className={`oai-source-row${activeSourceFilter === src.id ? ' active' : ''}`}
                        onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}
                      >
                        <span className="oai-source-dot" style={{ background: src.color }} />
                        <span className="oai-source-name">{src.label}</span>
                        <span className="oai-source-count">{srcSkills.length}</span>
                        <ChevronRight
                          size={14}
                          strokeWidth={1.5}
                          className={`oai-chevron-icon${isOpen ? ' open' : ''}`}
                          onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }}
                        />
                      </button>
                      {isOpen && (
                        <div className="oai-skill-list">
                          {visibleSkills.map(sk => (
                            <button
                              key={sk.id}
                              className={`oai-skill-row${expandedSkillId === sk.id ? ' active' : ''}`}
                              onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}
                            >
                              <span className="oai-skill-indicator" />
                              <span className="oai-skill-name">{sk.displayName}</span>
                            </button>
                          ))}
                          {showToggle && !isTreeExpanded && (
                            <button className="oai-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
                              Show all {srcSkills.length}
                            </button>
                          )}
                          {showToggle && isTreeExpanded && (
                            <button className="oai-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>
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

          <footer className="oai-nav-depts">
            <div className="oai-dept-label">Departments</div>
            <div className="oai-dept-pills">
              {departments.map(dept => {
                const count = skills.filter(s => s.department === dept).length
                return (
                  <button
                    key={dept}
                    className={`oai-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}
                  >
                    {dept} <span className="oai-dept-count">{count}</span>
                  </button>
                )
              })}
            </div>
          </footer>
        </aside>

        {/* ═══ Editor Panel (Center, flex:1) ═══ */}
        {selectedSkill ? (
          <main
            className={pc('oai-editor-panel', 'editor')}
            onClick={() => setFocusedPanel('editor')}
            style={{ animationDelay: '80ms' }}
          >
            <header className="oai-panel-header oai-editor-header">
              <button className="oai-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}>
                <ArrowLeft size={16} strokeWidth={1.5} />
              </button>
              <div className="oai-filename-area">
                <span className="oai-filename">SKILL.md</span>
                <span className="oai-file-meta">{selectedSkill.displayName}</span>
              </div>
            </header>
            <div className="oai-editor-body">
              {skillContent !== null ? (
                <SkillCMEditor
                  key={selectedSkill.id}
                  content={skillContent}
                  filePath={selectedSkill.previewPath}
                  theme={v3Theme}
                  prefix="oai"
                />
              ) : (
                <div className="oai-editor-loading">
                  <div className="oai-loading-spinner" />
                </div>
              )}
            </div>
          </main>
        ) : (
          <div className={`oai-welcome${panelsReady ? ' oai-visible' : ''}`} style={{ animationDelay: '80ms' }}>
            <div className="oai-welcome-inner">
              <Sparkles size={28} strokeWidth={1} className="oai-welcome-icon" />
              <h2 className="oai-welcome-title">Skills Lab</h2>
              <p className="oai-welcome-sub">Select a skill from the navigator to begin editing</p>
              <div className="oai-welcome-stats">
                <span className="oai-stat">{skills.length} skills</span>
                <span className="oai-stat-sep">&middot;</span>
                <span className="oai-stat">{agents.length} agents</span>
                <span className="oai-stat-sep">&middot;</span>
                <span className="oai-stat">{sources.length} sources</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Inspector Panel (Right, 320px) ═══ */}
        {selectedSkill && (
          <aside
            className={pc('oai-meta-panel', 'meta')}
            onClick={() => setFocusedPanel('meta')}
            style={{ animationDelay: '160ms' }}
          >
            <header className="oai-panel-header">
              <div className="oai-panel-title-row">
                <Info size={14} strokeWidth={1.5} className="oai-panel-icon" />
                <h3 className="oai-panel-title">Inspector</h3>
              </div>
            </header>

            {/* Metadata key-value pairs */}
            <section className="oai-meta-section">
              <div className="oai-meta-row">
                <span className="oai-meta-key">Name</span>
                <span className="oai-meta-val">{selectedSkill.displayName}</span>
              </div>
              <div className="oai-meta-row">
                <span className="oai-meta-key">Dept</span>
                <span className="oai-meta-val">{selectedSkill.department}</span>
              </div>
              <div className="oai-meta-row">
                <span className="oai-meta-key">Source</span>
                <span className="oai-meta-val">{selectedSkill.canonicalSource}</span>
              </div>
              {selectedSkill.metadata.author && (
                <div className="oai-meta-row">
                  <span className="oai-meta-key">Author</span>
                  <span className="oai-meta-val">{selectedSkill.metadata.author}</span>
                </div>
              )}
              {selectedSkill.metadata.source && (
                <div className="oai-meta-row">
                  <span className="oai-meta-key">Origin</span>
                  <span className="oai-meta-val">{selectedSkill.metadata.source}</span>
                </div>
              )}
              {selectedSkill.metadata.license && (
                <div className="oai-meta-row">
                  <span className="oai-meta-key">License</span>
                  <span className="oai-meta-val">{selectedSkill.metadata.license}</span>
                </div>
              )}
            </section>

            {/* Tags */}
            <section className="oai-meta-group">
              <div className="oai-meta-group-label">Tags</div>
              <div className="oai-meta-tags">
                <span className="oai-tag">{selectedSkill.department}</span>
                {selectedSkill.canonicalSource && (
                  <span className="oai-tag">{selectedSkill.canonicalSource}</span>
                )}
              </div>
            </section>

            {/* Installed agents */}
            <section className="oai-meta-group">
              <div className="oai-meta-group-label">Agents</div>
              <div className="oai-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && (
                  <span className="oai-meta-empty">Not installed in any agent</span>
                )}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => (
                  <span key={a.id} className="oai-agent-badge">
                    <span className="oai-agent-badge-emoji">{a.emoji}</span>
                    {a.label}
                  </span>
                ))}
              </div>
            </section>

            {/* Source presence */}
            <section className="oai-meta-group">
              <div className="oai-meta-group-label">Presence</div>
              <div className="oai-meta-sources">
                {sources.map(src => (
                  <div key={src.id} className="oai-meta-source-row">
                    <span
                      className="oai-meta-source-dot"
                      style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : 'rgba(255,255,255,0.1)' }}
                    />
                    <span className="oai-meta-source-name">{src.label}</span>
                    <span className={`oai-meta-source-kind ${selectedSkill.presence[src.id]}`}>
                      {selectedSkill.presence[src.id]}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Actions */}
            <section className="oai-meta-actions">
              <div className="oai-action-grid">
                <button className="oai-action-btn oai-action-primary" onClick={e => e.stopPropagation()}>
                  <ExternalLink size={14} strokeWidth={1.5} />
                  <span className="oai-action-label">Deploy</span>
                </button>
                <button className="oai-action-btn" onClick={e => e.stopPropagation()}>
                  <Copy size={14} strokeWidth={1.5} />
                  <span className="oai-action-label">Duplicate</span>
                </button>
                <button className="oai-action-btn" onClick={e => e.stopPropagation()}>
                  <ArrowRight size={14} strokeWidth={1.5} />
                  <span className="oai-action-label">Move to</span>
                </button>
                <button className="oai-action-btn oai-action-danger" onClick={e => e.stopPropagation()}>
                  <Trash2 size={14} strokeWidth={1.5} />
                  <span className="oai-action-label">Delete</span>
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
