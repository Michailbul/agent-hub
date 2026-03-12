import { useEffect, useState } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { v9Theme } from '@/lib/cmThemeV9'
import {
  Layers,
  Search,
  ArrowLeft,
  CircleDot,
  ExternalLink,
  Copy,
  ArrowRight,
  Trash2,
  ChevronRight,
  Minus,
} from 'lucide-react'
import './v9-oxide.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V9Oxide() {
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
  useEffect(() => { if (selectedSkill) loadSkillContent(selectedSkill.id) }, [selectedSkill?.id, loadSkillContent])
  useEffect(() => { const t = setTimeout(() => setPanelsReady(true), 50); return () => clearTimeout(t) }, [])

  const pc = (base: string, panel: FocusedPanel) => {
    let c = `ox-panel ${base}`
    if (panelsReady) c += ' ox-visible'
    if (focusedPanel === panel) c += ' ox-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' ox-dimmed'
    return c
  }

  const filterSkills = (agentSkills: typeof skills) => {
    let result = agentSkills
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(s => s.displayName.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    if (activeDepartments.size > 0) result = result.filter(s => activeDepartments.has(s.department))
    return result
  }

  if (loading && !loaded) return <div className="ox-canvas"><div className="ox-loading-state"><div className="ox-loading-spinner" /><span>Loading skills...</span></div></div>
  if (error && !loaded) return <div className="ox-canvas"><div className="ox-loading-state ox-error"><span>Failed to load: {error}</span></div></div>

  return (
    <div className="ox-canvas">
      <div className="ox-panels">
        <aside className={pc('ox-nav', 'nav')} onClick={() => setFocusedPanel('nav')}>
          <header className="ox-panel-header">
            <div className="ox-panel-title-row">
              <Layers size={14} strokeWidth={1.5} className="ox-panel-icon" />
              <h3 className="ox-panel-title">Navigator</h3>
            </div>
            <span className="ox-panel-badge">{skills.length}</span>
          </header>
          <div className="ox-nav-controls">
            <div className="ox-nav-tabs">
              <button className={`ox-nav-tab${navTab === 'agents' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setNavTab('agents') }}>Agents</button>
              <button className={`ox-nav-tab${navTab === 'sources' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setNavTab('sources') }}>Sources</button>
            </div>
            <div className="ox-search-bar">
              <Search size={13} strokeWidth={1.5} className="ox-search-icon" />
              <input className="ox-search-input" placeholder="Filter skills..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onClick={e => e.stopPropagation()} />
              {searchQuery && <button className="ox-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>}
            </div>
          </div>
          <div className="ox-nav-tree">
            {navTab === 'agents' && agents.map((agent) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="ox-agent-group">
                  <button className={`ox-agent-row${isExpanded ? ' expanded' : ''}`} onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}>
                    <ChevronRight size={14} strokeWidth={1.5} className={`ox-chevron-icon${isExpanded ? ' open' : ''}`} />
                    <span className="ox-agent-emoji">{agent.emoji}</span>
                    <div className="ox-agent-info"><span className="ox-agent-name">{agent.label}</span><span className="ox-agent-path">{agent.skillsRoot}</span></div>
                    <span className="ox-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && <div className="ox-skill-list">
                    {visible.length === 0 && <div className="ox-no-results">No skills match</div>}
                    {visible.map(sk => (
                      <button key={sk.id} className={`ox-skill-row${expandedSkillId === sk.id ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}>
                        <span className="ox-skill-indicator" /><span className="ox-skill-name">{sk.displayName}</span><span className="ox-skill-dept-label">{sk.department}</span>
                      </button>
                    ))}
                  </div>}
                </div>
              )
            })}
            {navTab === 'sources' && <>
              <button className={`ox-source-row${!activeSourceFilter ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}>
                <span className="ox-source-dot" style={{ background: '#d97757' }} /><span className="ox-source-name">All Skills</span><span className="ox-source-count">{skills.length}</span>
              </button>
              {sources.map(src => {
                const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                const isOpen = !collapsedSources.has(src.id)
                const isTreeExpanded = expandedTreeSources.has(src.id)
                const LIMIT = 10
                const showToggle = srcSkills.length > LIMIT
                const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                return (
                  <div key={src.id} className="ox-source-group">
                    <button className={`ox-source-row${activeSourceFilter === src.id ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}>
                      <span className="ox-source-dot" style={{ background: src.color }} /><span className="ox-source-name">{src.label}</span><span className="ox-source-count">{srcSkills.length}</span>
                      <ChevronRight size={14} strokeWidth={1.5} className={`ox-chevron-icon${isOpen ? ' open' : ''}`} onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }} />
                    </button>
                    {isOpen && <div className="ox-skill-list">
                      {visibleSkills.map(sk => <button key={sk.id} className={`ox-skill-row${expandedSkillId === sk.id ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}><span className="ox-skill-indicator" /><span className="ox-skill-name">{sk.displayName}</span></button>)}
                      {showToggle && !isTreeExpanded && <button className="ox-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>Show all {srcSkills.length}</button>}
                      {showToggle && isTreeExpanded && <button className="ox-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>Collapse</button>}
                    </div>}
                  </div>
                )
              })}
            </>}
          </div>
          <footer className="ox-nav-depts">
            <div className="ox-dept-label">Departments</div>
            <div className="ox-dept-pills">
              {departments.map(dept => { const count = skills.filter(s => s.department === dept).length; return <button key={dept} className={`ox-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`} onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}>{dept} <span className="ox-dept-count">{count}</span></button> })}
            </div>
          </footer>
        </aside>

        {selectedSkill ? (
          <main className={pc('ox-editor-panel', 'editor')} onClick={() => setFocusedPanel('editor')}>
            <header className="ox-panel-header ox-editor-header">
              <button className="ox-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}><ArrowLeft size={16} strokeWidth={1.5} /></button>
              <div className="ox-filename-area"><span className="ox-filename">SKILL.md</span><span className="ox-file-meta">{selectedSkill.displayName}</span></div>
            </header>
            <div className="ox-editor-body">
              {skillContent !== null ? <SkillCMEditor key={selectedSkill.id} content={skillContent} filePath={selectedSkill.previewPath} theme={v9Theme} prefix="ox" /> : <div className="ox-editor-loading"><div className="ox-loading-spinner" /></div>}
            </div>
          </main>
        ) : (
          <div className={`ox-welcome${panelsReady ? ' ox-visible' : ''}`}>
            <div className="ox-welcome-inner">
              <Minus size={28} strokeWidth={1} className="ox-welcome-icon" />
              <h2 className="ox-welcome-title">Skills Lab</h2>
              <p className="ox-welcome-sub">Select a skill from the navigator to begin editing</p>
              <div className="ox-welcome-stats"><span className="ox-stat">{skills.length} skills</span><span className="ox-stat-sep">&middot;</span><span className="ox-stat">{agents.length} agents</span><span className="ox-stat-sep">&middot;</span><span className="ox-stat">{sources.length} sources</span></div>
            </div>
          </div>
        )}

        {selectedSkill && (
          <aside className={pc('ox-meta-panel', 'meta')} onClick={() => setFocusedPanel('meta')}>
            <header className="ox-panel-header">
              <div className="ox-panel-title-row"><CircleDot size={14} strokeWidth={1.5} className="ox-panel-icon" /><h3 className="ox-panel-title">Inspector</h3></div>
            </header>
            <section className="ox-meta-section">
              <div className="ox-meta-row"><span className="ox-meta-key">Name</span><span className="ox-meta-val">{selectedSkill.displayName}</span></div>
              <div className="ox-meta-row"><span className="ox-meta-key">Dept</span><span className="ox-meta-val">{selectedSkill.department}</span></div>
              <div className="ox-meta-row"><span className="ox-meta-key">Source</span><span className="ox-meta-val">{selectedSkill.canonicalSource}</span></div>
              {selectedSkill.metadata.author && <div className="ox-meta-row"><span className="ox-meta-key">Author</span><span className="ox-meta-val">{selectedSkill.metadata.author}</span></div>}
              {selectedSkill.metadata.source && <div className="ox-meta-row"><span className="ox-meta-key">Origin</span><span className="ox-meta-val">{selectedSkill.metadata.source}</span></div>}
              {selectedSkill.metadata.license && <div className="ox-meta-row"><span className="ox-meta-key">License</span><span className="ox-meta-val">{selectedSkill.metadata.license}</span></div>}
            </section>
            <section className="ox-meta-group">
              <div className="ox-meta-group-label">Tags</div>
              <div className="ox-meta-tags"><span className="ox-tag">{selectedSkill.department}</span>{selectedSkill.canonicalSource && <span className="ox-tag">{selectedSkill.canonicalSource}</span>}</div>
            </section>
            <section className="ox-meta-group">
              <div className="ox-meta-group-label">Agents</div>
              <div className="ox-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && <span className="ox-meta-empty">Not installed in any agent</span>}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => <span key={a.id} className="ox-agent-badge"><span className="ox-agent-badge-emoji">{a.emoji}</span>{a.label}</span>)}
              </div>
            </section>
            <section className="ox-meta-group">
              <div className="ox-meta-group-label">Presence</div>
              <div className="ox-meta-sources">
                {sources.map(src => <div key={src.id} className="ox-meta-source-row"><span className="ox-meta-source-dot" style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#222222' }} /><span className="ox-meta-source-name">{src.label}</span><span className={`ox-meta-source-kind ${selectedSkill.presence[src.id]}`}>{selectedSkill.presence[src.id]}</span></div>)}
              </div>
            </section>
            <section className="ox-meta-actions">
              <div className="ox-action-grid">
                <button className="ox-action-btn ox-action-primary" onClick={e => e.stopPropagation()}><ExternalLink size={14} strokeWidth={1.5} /><span className="ox-action-label">Deploy</span></button>
                <button className="ox-action-btn" onClick={e => e.stopPropagation()}><Copy size={14} strokeWidth={1.5} /><span className="ox-action-label">Duplicate</span></button>
                <button className="ox-action-btn" onClick={e => e.stopPropagation()}><ArrowRight size={14} strokeWidth={1.5} /><span className="ox-action-label">Move to</span></button>
                <button className="ox-action-btn ox-action-danger" onClick={e => e.stopPropagation()}><Trash2 size={14} strokeWidth={1.5} /><span className="ox-action-label">Delete</span></button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
