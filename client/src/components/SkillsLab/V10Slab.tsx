import { useEffect, useState } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import { SkillCMEditor } from './SkillCMEditor'
import { v10Theme } from '@/lib/cmThemeV10'
import {
  Layers,
  Search,
  ArrowLeft,
  Wrench,
  ExternalLink,
  Copy,
  ArrowRight,
  Trash2,
  ChevronRight,
  Bolt,
} from 'lucide-react'
import './v10-slab.css'

type NavTab = 'agents' | 'sources'
type FocusedPanel = 'nav' | 'editor' | 'meta' | null

export function V10Slab() {
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
    let c = `sb-panel ${base}`
    if (panelsReady) c += ' sb-visible'
    if (focusedPanel === panel) c += ' sb-focused'
    else if (focusedPanel && focusedPanel !== panel) c += ' sb-dimmed'
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

  if (loading && !loaded) return <div className="sb-canvas"><div className="sb-loading-state"><div className="sb-loading-spinner" /><span>Loading skills...</span></div></div>
  if (error && !loaded) return <div className="sb-canvas"><div className="sb-loading-state sb-error"><span>Failed to load: {error}</span></div></div>

  return (
    <div className="sb-canvas">
      <div className="sb-panels">
        <aside className={pc('sb-nav', 'nav')} onClick={() => setFocusedPanel('nav')}>
          <header className="sb-panel-header">
            <div className="sb-panel-title-row">
              <Layers size={14} strokeWidth={2.5} className="sb-panel-icon" />
              <h3 className="sb-panel-title">Navigator</h3>
            </div>
            <span className="sb-panel-badge">{skills.length}</span>
          </header>
          <div className="sb-nav-controls">
            <div className="sb-nav-tabs">
              <button className={`sb-nav-tab${navTab === 'agents' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setNavTab('agents') }}>Agents</button>
              <button className={`sb-nav-tab${navTab === 'sources' ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setNavTab('sources') }}>Sources</button>
            </div>
            <div className="sb-search-bar">
              <Search size={13} strokeWidth={2} className="sb-search-icon" />
              <input className="sb-search-input" placeholder="Filter skills..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onClick={e => e.stopPropagation()} />
              {searchQuery && <button className="sb-search-clear" onClick={e => { e.stopPropagation(); setSearchQuery('') }}>&times;</button>}
            </div>
          </div>
          <div className="sb-nav-tree">
            {navTab === 'agents' && agents.map((agent) => {
              const all = skills.filter(s => s.installedAgentIds.includes(agent.id))
              const visible = filterSkills(all)
              const isExpanded = expandedAgentId === agent.id
              return (
                <div key={agent.id} className="sb-agent-group">
                  <button className={`sb-agent-row${isExpanded ? ' expanded' : ''}`} onClick={e => { e.stopPropagation(); setExpandedAgentId(agent.id) }}>
                    <ChevronRight size={14} strokeWidth={2.5} className={`sb-chevron-icon${isExpanded ? ' open' : ''}`} />
                    <span className="sb-agent-emoji">{agent.emoji}</span>
                    <div className="sb-agent-info"><span className="sb-agent-name">{agent.label}</span><span className="sb-agent-path">{agent.skillsRoot}</span></div>
                    <span className="sb-agent-count">{all.length}</span>
                  </button>
                  {isExpanded && <div className="sb-skill-list">
                    {visible.length === 0 && <div className="sb-no-results">No skills match</div>}
                    {visible.map(sk => (
                      <button key={sk.id} className={`sb-skill-row${expandedSkillId === sk.id ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}>
                        <span className="sb-skill-indicator" /><span className="sb-skill-name">{sk.displayName}</span><span className="sb-skill-dept-label">{sk.department}</span>
                      </button>
                    ))}
                  </div>}
                </div>
              )
            })}
            {navTab === 'sources' && <>
              <button className={`sb-source-row${!activeSourceFilter ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setActiveSourceFilter(null) }}>
                <span className="sb-source-dot" style={{ background: '#d97757' }} /><span className="sb-source-name">All Skills</span><span className="sb-source-count">{skills.length}</span>
              </button>
              {sources.map(src => {
                const srcSkills = skills.filter(s => s.presence[src.id] !== 'absent')
                const isOpen = !collapsedSources.has(src.id)
                const isTreeExpanded = expandedTreeSources.has(src.id)
                const LIMIT = 10
                const showToggle = srcSkills.length > LIMIT
                const visibleSkills = isTreeExpanded ? srcSkills : srcSkills.slice(0, LIMIT)
                return (
                  <div key={src.id} className="sb-source-group">
                    <button className={`sb-source-row${activeSourceFilter === src.id ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setActiveSourceFilter(src.id) }}>
                      <span className="sb-source-dot" style={{ background: src.color }} /><span className="sb-source-name">{src.label}</span><span className="sb-source-count">{srcSkills.length}</span>
                      <ChevronRight size={14} strokeWidth={2.5} className={`sb-chevron-icon${isOpen ? ' open' : ''}`} onClick={e => { e.stopPropagation(); toggleSourceCollapse(src.id) }} />
                    </button>
                    {isOpen && <div className="sb-skill-list">
                      {visibleSkills.map(sk => <button key={sk.id} className={`sb-skill-row${expandedSkillId === sk.id ? ' active' : ''}`} onClick={e => { e.stopPropagation(); setExpandedSkill(sk.id) }}><span className="sb-skill-indicator" /><span className="sb-skill-name">{sk.displayName}</span></button>)}
                      {showToggle && !isTreeExpanded && <button className="sb-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>Show all {srcSkills.length}</button>}
                      {showToggle && isTreeExpanded && <button className="sb-show-more" onClick={e => { e.stopPropagation(); toggleExpandTreeSource(src.id) }}>Collapse</button>}
                    </div>}
                  </div>
                )
              })}
            </>}
          </div>
          <footer className="sb-nav-depts">
            <div className="sb-dept-label">Departments</div>
            <div className="sb-dept-pills">
              {departments.map(dept => { const count = skills.filter(s => s.department === dept).length; return <button key={dept} className={`sb-dept-pill${activeDepartments.has(dept) ? ' active' : ''}`} onClick={e => { e.stopPropagation(); toggleDepartment(dept) }}>{dept} <span className="sb-dept-count">{count}</span></button> })}
            </div>
          </footer>
        </aside>

        {selectedSkill ? (
          <main className={pc('sb-editor-panel', 'editor')} onClick={() => setFocusedPanel('editor')}>
            <header className="sb-panel-header sb-editor-header">
              <button className="sb-back-btn" onClick={e => { e.stopPropagation(); setExpandedSkill(null) }}><ArrowLeft size={16} strokeWidth={2.5} /></button>
              <div className="sb-filename-area"><span className="sb-filename">SKILL.md</span><span className="sb-file-meta">{selectedSkill.displayName}</span></div>
            </header>
            <div className="sb-editor-body">
              {skillContent !== null ? <SkillCMEditor key={selectedSkill.id} content={skillContent} filePath={selectedSkill.previewPath} theme={v10Theme} prefix="sb" /> : <div className="sb-editor-loading"><div className="sb-loading-spinner" /></div>}
            </div>
          </main>
        ) : (
          <div className={`sb-welcome${panelsReady ? ' sb-visible' : ''}`}>
            <div className="sb-welcome-inner">
              <Bolt size={36} strokeWidth={2.5} className="sb-welcome-icon" />
              <h2 className="sb-welcome-title">Skills Lab</h2>
              <p className="sb-welcome-sub">Select a skill from the navigator</p>
              <div className="sb-welcome-stats"><span className="sb-stat">{skills.length} skills</span><span className="sb-stat-sep" /><span className="sb-stat">{agents.length} agents</span><span className="sb-stat-sep" /><span className="sb-stat">{sources.length} sources</span></div>
            </div>
          </div>
        )}

        {selectedSkill && (
          <aside className={pc('sb-meta-panel', 'meta')} onClick={() => setFocusedPanel('meta')}>
            <header className="sb-panel-header">
              <div className="sb-panel-title-row"><Wrench size={14} strokeWidth={2.5} className="sb-panel-icon" /><h3 className="sb-panel-title">Inspector</h3></div>
            </header>
            <section className="sb-meta-section">
              <div className="sb-meta-row"><span className="sb-meta-key">Name</span><span className="sb-meta-val">{selectedSkill.displayName}</span></div>
              <div className="sb-meta-row"><span className="sb-meta-key">Dept</span><span className="sb-meta-val">{selectedSkill.department}</span></div>
              <div className="sb-meta-row"><span className="sb-meta-key">Source</span><span className="sb-meta-val">{selectedSkill.canonicalSource}</span></div>
              {selectedSkill.metadata.author && <div className="sb-meta-row"><span className="sb-meta-key">Author</span><span className="sb-meta-val">{selectedSkill.metadata.author}</span></div>}
              {selectedSkill.metadata.source && <div className="sb-meta-row"><span className="sb-meta-key">Origin</span><span className="sb-meta-val">{selectedSkill.metadata.source}</span></div>}
              {selectedSkill.metadata.license && <div className="sb-meta-row"><span className="sb-meta-key">License</span><span className="sb-meta-val">{selectedSkill.metadata.license}</span></div>}
            </section>
            <section className="sb-meta-group">
              <div className="sb-meta-group-label">Tags</div>
              <div className="sb-meta-tags"><span className="sb-tag">{selectedSkill.department}</span>{selectedSkill.canonicalSource && <span className="sb-tag">{selectedSkill.canonicalSource}</span>}</div>
            </section>
            <section className="sb-meta-group">
              <div className="sb-meta-group-label">Agents</div>
              <div className="sb-meta-agents">
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).length === 0 && <span className="sb-meta-empty">Not installed</span>}
                {agents.filter(a => selectedSkill.installedAgentIds.includes(a.id)).map(a => <span key={a.id} className="sb-agent-badge"><span className="sb-agent-badge-emoji">{a.emoji}</span>{a.label}</span>)}
              </div>
            </section>
            <section className="sb-meta-group">
              <div className="sb-meta-group-label">Presence</div>
              <div className="sb-meta-sources">
                {sources.map(src => <div key={src.id} className="sb-meta-source-row"><span className="sb-meta-source-dot" style={{ background: selectedSkill.presence[src.id] !== 'absent' ? src.color : '#3e3e38' }} /><span className="sb-meta-source-name">{src.label}</span><span className={`sb-meta-source-kind ${selectedSkill.presence[src.id]}`}>{selectedSkill.presence[src.id]}</span></div>)}
              </div>
            </section>
            <section className="sb-meta-actions">
              <div className="sb-action-grid">
                <button className="sb-action-btn sb-action-primary" onClick={e => e.stopPropagation()}><ExternalLink size={14} strokeWidth={2.5} /><span className="sb-action-label">Deploy</span></button>
                <button className="sb-action-btn" onClick={e => e.stopPropagation()}><Copy size={14} strokeWidth={2.5} /><span className="sb-action-label">Duplicate</span></button>
                <button className="sb-action-btn" onClick={e => e.stopPropagation()}><ArrowRight size={14} strokeWidth={2.5} /><span className="sb-action-label">Move</span></button>
                <button className="sb-action-btn sb-action-danger" onClick={e => e.stopPropagation()}><Trash2 size={14} strokeWidth={2.5} /><span className="sb-action-label">Delete</span></button>
              </div>
            </section>
          </aside>
        )}
      </div>
    </div>
  )
}
