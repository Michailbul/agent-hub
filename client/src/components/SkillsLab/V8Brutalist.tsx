import { useEffect, useState } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { v8Theme } from '@/lib/cmThemeV8'
import {
  Layers,
  Search,
  ArrowLeft,
  Hammer,
  ExternalLink,
  Copy,
  ArrowRight,
  Trash2,
  ChevronRight,
  SquareSlash,
} from 'lucide-react'
import './v8-brutalist.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V8Brutalist() {
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
    let c = `bt-panel ${base}`
    if (panelsReady) c += ' bt-visible'
    if (focusedPanel === panel) c += ' bt-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' bt-dimmed'
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

  if (loading && !loaded) return <div className="bt-canvas"><div className="bt-loading-state"><div className="bt-loading-spinner" /><span>Loading skills...</span></div></div>
  if (error && !loaded) return <div className="bt-canvas"><div className="bt-loading-state bt-error"><span>Failed to load: {error}</span></div></div>

  return (
    <div className="bt-canvas">
      <div className="bt-panels">
        <aside className={pc('bt-nav', 'nav')} onClick={() => setFocusedPanel('nav')}>
          <header className="bt-panel-header">
            <div className="bt-panel-title-row">
              <Layers size={14} strokeWidth={2} className="bt-panel-icon" />
              <h3 className="bt-panel-title">Navigator</h3>
            </div>
            <span className="bt-panel-badge">{skills.length}</span>
          </header>
          <div className="bt-nav-controls">
            <div className="bt-nav-tabs">
              <button className={`bt-nav-tab${navTab === 'agents' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setNavTab('agents') }}>Agents</button>
              <button className={`bt-nav-tab${navTab === 'sources' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setNavTab('sources') }}>Sources</button>
            </div>
            <div className="bt-search-bar">
              <Search size={13} strokeWidth={2} className="bt-search-icon" />
              <input className="bt-search-input" placeholder="Filter skills..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onClick={e => e.stopPropagation()} />
              {searchQuery && <button className="bt-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>}
            </div>
          </div>
          <div className="bt-nav-tree">
            {navTab === 'agents' && agents.map((agent) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="bt-agent-group">
                  <button className={`bt-agent-row${isExpanded ? ' expanded' : ''}`} onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}>
                    <ChevronRight size={14} strokeWidth={2} className={`bt-chevron-icon${isExpanded ? ' open' : ''}`} />
                    <span className="bt-agent-emoji">{agent.emoji}</span>
                    <div className="bt-agent-info"><span className="bt-agent-name">{agent.label}</span><span className="bt-agent-path">{agent.skillsRoot}</span></div>
                    <span className="bt-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && <div className="bt-skill-list">
                    {visible.length === 0 && <div className="bt-no-results">No skills match</div>}
                    {visible.map(sk => (
                      <button key={sk.id} className={`bt-skill-row${expandedSkillId === sk.id ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}>
                        <span className="bt-skill-indicator" /><span className="bt-skill-name">{sk.displayName}</span><span className="bt-skill-dept-label">{sk.department}</span>
                      </button>
                    ))}
                  </div>}
                </div>
              )
            })}
            {navTab === 'sources' && <>
              <button className={`bt-source-row${!activeSourceFilter ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}>
                <span className="bt-source-dot" style={{ background: '#d97757' }} /><span className="bt-source-name">All Skills</span><span className="bt-source-count">{skills.length}</span>
              </button>
              {sources.map(src => {
                const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                const isOpen = !collapsedSources.has(src.id)
                const isTreeExpanded = expandedTreeSources.has(src.id)
                const LIMIT = 10
                const showToggle = srcSkills.length > LIMIT
                const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                return (
                  <div key={src.id} className="bt-source-group">
                    <button className={`bt-source-row${activeSourceFilter === src.id ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}>
                      <span className="bt-source-dot" style={{ background: src.color }} /><span className="bt-source-name">{src.label}</span><span className="bt-source-count">{srcSkills.length}</span>
                      <ChevronRight size={14} strokeWidth={2} className={`bt-chevron-icon${isOpen ? ' open' : ''}`} onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }} />
                    </button>
                    {isOpen && <div className="bt-skill-list">
                      {visibleSkills.map(sk => <button key={sk.id} className={`bt-skill-row${expandedSkillId === sk.id ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}><span className="bt-skill-indicator" /><span className="bt-skill-name">{sk.displayName}</span></button>)}
                      {showToggle && !isTreeExpanded && <button className="bt-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>Show all {srcSkills.length}</button>}
                      {showToggle && isTreeExpanded && <button className="bt-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>Collapse</button>}
                    </div>}
                  </div>
                )
              })}
            </>}
          </div>
          <footer className="bt-nav-depts">
            <div className="bt-dept-label">Departments</div>
            <div className="bt-dept-pills">
              {departments.map(dept => { const count = skills.filter(s => s.department === dept).length; return <button key={dept} className={`bt-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`} onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}>{dept} <span className="bt-dept-count">{count}</span></button> })}
            </div>
          </footer>
        </aside>

        {selectedSkill ? (
          <main className={pc('bt-editor-panel', 'editor')} onClick={() => setFocusedPanel('editor')}>
            <header className="bt-panel-header bt-editor-header">
              <button className="bt-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}><ArrowLeft size={16} strokeWidth={2} /></button>
              <div className="bt-filename-area"><span className="bt-filename">SKILL.md</span><span className="bt-file-meta">{selectedSkill.displayName}</span></div>
            </header>
            <div className="bt-editor-body">
              {skillContent !== null ? <SkillCMEditor key={selectedSkill.id} content={skillContent} filePath={selectedSkill.previewPath} theme={v8Theme} prefix="bt" /> : <div className="bt-editor-loading"><div className="bt-loading-spinner" /></div>}
            </div>
          </main>
        ) : (
          <div className={`bt-welcome${panelsReady ? ' bt-visible' : ''}`}>
            <div className="bt-welcome-inner">
              <SquareSlash size={32} strokeWidth={2} className="bt-welcome-icon" />
              <h2 className="bt-welcome-title">Skills Lab</h2>
              <p className="bt-welcome-sub">Select a skill from the navigator to begin editing</p>
              <div className="bt-welcome-stats"><span className="bt-stat">{skills.length} skills</span><span className="bt-stat-sep">/</span><span className="bt-stat">{agents.length} agents</span><span className="bt-stat-sep">/</span><span className="bt-stat">{sources.length} sources</span></div>
            </div>
          </div>
        )}

        {selectedSkill && (
          <aside className={pc('bt-meta-panel', 'meta')} onClick={() => setFocusedPanel('meta')}>
            <header className="bt-panel-header">
              <div className="bt-panel-title-row"><Hammer size={14} strokeWidth={2} className="bt-panel-icon" /><h3 className="bt-panel-title">Inspector</h3></div>
            </header>
            <section className="bt-meta-section">
              <div className="bt-meta-row"><span className="bt-meta-key">Name</span><span className="bt-meta-val">{selectedSkill.displayName}</span></div>
              <div className="bt-meta-row"><span className="bt-meta-key">Dept</span><span className="bt-meta-val">{selectedSkill.department}</span></div>
              <div className="bt-meta-row"><span className="bt-meta-key">Source</span><span className="bt-meta-val">{selectedSkill.canonicalSource}</span></div>
              {selectedSkill.metadata.author && <div className="bt-meta-row"><span className="bt-meta-key">Author</span><span className="bt-meta-val">{selectedSkill.metadata.author}</span></div>}
              {selectedSkill.metadata.source && <div className="bt-meta-row"><span className="bt-meta-key">Origin</span><span className="bt-meta-val">{selectedSkill.metadata.source}</span></div>}
              {selectedSkill.metadata.license && <div className="bt-meta-row"><span className="bt-meta-key">License</span><span className="bt-meta-val">{selectedSkill.metadata.license}</span></div>}
            </section>
            <section className="bt-meta-group">
              <div className="bt-meta-group-label">Tags</div>
              <div className="bt-meta-tags"><span className="bt-tag">{selectedSkill.department}</span>{selectedSkill.canonicalSource && <span className="bt-tag">{selectedSkill.canonicalSource}</span>}</div>
            </section>
            <section className="bt-meta-group">
              <div className="bt-meta-group-label">Agents</div>
              <div className="bt-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && <span className="bt-meta-empty">Not installed in any agent</span>}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => <span key={a.id} className="bt-agent-badge"><span className="bt-agent-badge-emoji">{a.emoji}</span>{a.label}</span>)}
              </div>
            </section>
            <section className="bt-meta-group">
              <div className="bt-meta-group-label">Presence</div>
              <div className="bt-meta-sources">
                {sources.map(src => <div key={src.id} className="bt-meta-source-row"><span className="bt-meta-source-dot" style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#3e3e38' }} /><span className="bt-meta-source-name">{src.label}</span><span className={`bt-meta-source-kind ${selectedSkill.presence[src.id]}`}>{selectedSkill.presence[src.id]}</span></div>)}
              </div>
            </section>
            <section className="bt-meta-actions">
              <div className="bt-action-grid">
                <button className="bt-action-btn bt-action-primary" onClick={e => e.stopPropagation()}><ExternalLink size={14} strokeWidth={2} /><span className="bt-action-label">Deploy</span></button>
                <button className="bt-action-btn" onClick={e => e.stopPropagation()}><Copy size={14} strokeWidth={2} /><span className="bt-action-label">Duplicate</span></button>
                <button className="bt-action-btn" onClick={e => e.stopPropagation()}><ArrowRight size={14} strokeWidth={2} /><span className="bt-action-label">Move</span></button>
                <button className="bt-action-btn bt-action-danger" onClick={e => e.stopPropagation()}><Trash2 size={14} strokeWidth={2} /><span className="bt-action-label">Delete</span></button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
