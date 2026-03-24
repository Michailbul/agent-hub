import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { SkillPaletteRow } from './SkillPaletteRow'
import { SkillContextMenu } from './SkillContextMenu'
import { CategoryFilter } from './CategoryFilter'
import type { PaletteSkill } from '@/types/canvas'
import { ChevronRight, File, FileCode, FileText, Zap, Search } from 'lucide-react'

function fileIcon(name: string) {
  if (name.endsWith('.md')) return <FileText size={12} strokeWidth={1.4} />
  if (name.endsWith('.ts') || name.endsWith('.js') || name.endsWith('.py') || name.endsWith('.rb') || name.endsWith('.sh'))
    return <FileCode size={12} strokeWidth={1.4} />
  return <File size={12} strokeWidth={1.4} />
}

function BrowserSkillFiles({ skillId, variantPath }: { skillId: string; variantPath: string }) {
  const skillDirFiles = useCanvasStore(s => s.skillDirFiles)
  const setInspectorItem = useCanvasStore(s => s.setInspectorItem)
  const inspectorActiveItem = useCanvasStore(s => s.inspectorActiveItem)
  const dirFiles = skillDirFiles[skillId] || []
  const innerRef = useRef<HTMLDivElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)

  // Animate height on mount: measure inner, tween outer from 0
  useEffect(() => {
    const outer = outerRef.current
    const inner = innerRef.current
    if (!outer || !inner) return
    const h = inner.offsetHeight
    outer.style.height = '0px'
    // Force reflow so browser registers 0 before transitioning
    void outer.offsetHeight
    outer.style.height = `${h}px`
    const onEnd = () => { outer.style.height = 'auto' }
    outer.addEventListener('transitionend', onEnd, { once: true })
    return () => outer.removeEventListener('transitionend', onEnd)
  }, [])

  const handleClickSkillMd = () => {
    setInspectorItem({ kind: 'skill', skillId, skillPath: variantPath })
  }

  const handleClickFile = (filePath: string) => {
    setInspectorItem({ kind: 'skill-file', skillId, path: filePath })
  }

  const isSkillMdActive = inspectorActiveItem?.kind === 'skill' && inspectorActiveItem.skillId === skillId
  const activeFilePath = inspectorActiveItem?.kind === 'skill-file' ? inspectorActiveItem.path : null
  const allFiles = [
    { key: '__skill_md', name: 'SKILL.md', isSkillMd: true, path: variantPath },
    ...dirFiles.map(f => ({ key: f.path, name: f.name, isSkillMd: false, path: f.path })),
  ]

  return (
    <div ref={outerRef} className="cv-bsf-outer">
      <div ref={innerRef} className="cv-bsf">
        {allFiles.map((f, i) => {
          const isActive = f.isSkillMd ? isSkillMdActive : activeFilePath === f.path
          return (
            <button
              key={f.key}
              className={`cv-bsf-row${isActive ? ' cv-bsf-row--active' : ''}`}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => f.isSkillMd ? handleClickSkillMd() : handleClickFile(f.path)}
            >
              <span className="cv-bsf-indicator" />
              {f.isSkillMd ? <Zap size={12} strokeWidth={1.4} /> : fileIcon(f.name)}
              <span className="cv-bsf-name">{f.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SkillBrowser() {
  const data = useCanvasStore(s => s.data)
  const browserOpen = useCanvasStore(s => s.browserOpen)
  const toggleBrowser = useCanvasStore(s => s.toggleBrowser)
  const allTags = useCanvasStore(s => s.allTags)
  const activeTags = useCanvasStore(s => s.activeTags)
  const toggleTag = useCanvasStore(s => s.toggleTag)
  const clearTags = useCanvasStore(s => s.clearTags)
  const selectedAgentId = useCanvasStore(s => s.selectedAgentId)
  const assignSkill = useCanvasStore(s => s.assignSkill)
  const sourceFilter = useCanvasStore(s => s.sourceFilter)
  const setSourceFilter = useCanvasStore(s => s.setSourceFilter)
  const browserExpandedSkillId = useCanvasStore(s => s.browserExpandedSkillId)
  const expandBrowserSkill = useCanvasStore(s => s.expandBrowserSkill)
  const hasEmbeddings = useCanvasStore(s => s.hasEmbeddings)
  const semanticResults = useCanvasStore(s => s.semanticResults)
  const semanticLoading = useCanvasStore(s => s.semanticLoading)
  const semanticSearch = useCanvasStore(s => s.semanticSearch)
  const clearSemanticResults = useCanvasStore(s => s.clearSemanticResults)
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [ctxMenu, setCtxMenu] = useState<{ skillId: string; variantPath: string; x: number; y: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const paletteSkills = data?.paletteSkills || []
  const q = search.trim().toLowerCase()

  // Debounced semantic search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (!trimmed) {
      clearSemanticResults()
      return
    }
    if (hasEmbeddings && trimmed.length >= 2) {
      debounceRef.current = setTimeout(() => {
        void semanticSearch(trimmed)
      }, 300)
    }
  }, [hasEmbeddings, semanticSearch, clearSemanticResults])

  // Cleanup debounce on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  // Source counts
  const ownCount = useMemo(() => paletteSkills.filter(s => s.isInMaster || s.sourceKind === 'workspace').length, [paletteSkills])
  const libCount = useMemo(() => paletteSkills.filter(s => !s.isInMaster && s.sourceKind !== 'workspace').length, [paletteSkills])

  // Build semantic score map for ranking
  const semanticScoreMap = useMemo(() => {
    if (!semanticResults) return null
    const map = new Map<string, number>()
    for (const r of semanticResults) map.set(r.skillId, r.combined)
    return map
  }, [semanticResults])

  // Filter + rank
  const filtered = useMemo(() => {
    let result = paletteSkills
    if (sourceFilter === 'own') {
      result = result.filter(s => s.isInMaster || s.sourceKind === 'workspace')
    } else if (sourceFilter === 'library') {
      result = result.filter(s => !s.isInMaster && s.sourceKind !== 'workspace')
    }
    if (activeTags.size > 0) {
      result = result.filter(s => activeTags.has(s.pillarName))
    }
    if (q) {
      if (semanticScoreMap) {
        // Semantic mode: include keyword matches + semantic matches, rank by score
        const keywordMatches = new Set(
          result
            .filter(s => s.name.toLowerCase().includes(q) || s.pillarName.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q))
            .map(s => s.id),
        )
        result = result.filter(s => keywordMatches.has(s.id) || semanticScoreMap.has(s.id))
        result.sort((a, b) => (semanticScoreMap.get(b.id) || 0) - (semanticScoreMap.get(a.id) || 0))
      } else {
        result = result.filter(s =>
          s.name.toLowerCase().includes(q) ||
          s.pillarName.toLowerCase().includes(q) ||
          s.summary.toLowerCase().includes(q),
        )
      }
    }
    return result
  }, [paletteSkills, q, activeTags, sourceFilter, semanticScoreMap])

  // When searching: flat list. When browsing: group by purpose.
  const isSearchMode = !!q
  const grouped = useMemo(() => {
    if (isSearchMode) return null // flat list when searching
    const map = new Map<string, PaletteSkill[]>()
    for (const skill of filtered) {
      const group = skill.pillarName || 'Utility'
      if (!map.has(group)) map.set(group, [])
      map.get(group)!.push(skill)
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 'Utility') return 1
      if (b === 'Utility') return -1
      return a.localeCompare(b)
    })
  }, [filtered, isSearchMode])

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const handleAssign = async (skill: PaletteSkill) => {
    if (!selectedAgentId) return
    try {
      await assignSkill(selectedAgentId, skill.variantPath)
    } catch (err) {
      console.error('Assign failed:', err)
    }
  }

  const renderSkillRow = (skill: PaletteSkill, showScore?: boolean) => {
    const isExpanded = browserExpandedSkillId === skill.id
    const score = showScore && semanticScoreMap ? semanticScoreMap.get(skill.id) : undefined
    return (
      <div key={skill.id} className={`cv-browser-skill-wrap${isExpanded ? ' expanded' : ''}`}>
        <SkillPaletteRow
          skill={skill}
          onAssign={selectedAgentId ? () => handleAssign(skill) : undefined}
          onPreview={() => expandBrowserSkill(skill.id)}
          expandIcon={
            <ChevronRight
              size={10}
              strokeWidth={1.5}
              className={`cv-browser-expand-chevron${isExpanded ? ' open' : ''}`}
            />
          }
          onContextMenu={(e) => {
            e.preventDefault()
            setCtxMenu({ skillId: skill.id, variantPath: skill.variantPath, x: e.clientX, y: e.clientY })
          }}
        />
        {isExpanded && (
          <BrowserSkillFiles skillId={skill.id} variantPath={skill.variantPath} />
        )}
      </div>
    )
  }

  if (!data || !browserOpen) return null

  return (
    <div className="cv-browser">
      <div className="cv-browser-header">
        <div className="cv-browser-header-left">
          <span className="cv-browser-title">Skill Browser</span>
          <span className="cv-browser-total">{paletteSkills.length}</span>
        </div>
        <button className="cv-browser-close" onClick={toggleBrowser}>
          ✕
        </button>
      </div>

      <div className="cv-browser-toolbar">
        <div className="cv-palette-search">
          <Search size={13} strokeWidth={1.5} className="cv-palette-search-icon" />
          <input
            className="cv-palette-search-input"
            type="text"
            placeholder={hasEmbeddings ? 'Semantic search skills...' : 'Search skills...'}
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
          />
          {semanticLoading && <span className="cv-palette-search-spinner" />}
        </div>
        <div className="cv-source-tabs">
          <button
            className={`cv-source-tab${sourceFilter === 'all' ? ' active' : ''}`}
            onClick={() => setSourceFilter('all')}
          >
            All <span className="cv-source-tab-count">{paletteSkills.length}</span>
          </button>
          <button
            className={`cv-source-tab${sourceFilter === 'own' ? ' active' : ''}`}
            onClick={() => setSourceFilter('own')}
          >
            My Skills <span className="cv-source-tab-count">{ownCount}</span>
          </button>
          <button
            className={`cv-source-tab${sourceFilter === 'library' ? ' active' : ''}`}
            onClick={() => setSourceFilter('library')}
          >
            Library <span className="cv-source-tab-count">{libCount}</span>
          </button>
        </div>
        <CategoryFilter
          tags={allTags}
          activeTags={activeTags}
          onToggle={toggleTag}
          onClear={clearTags}
        />
      </div>

      <div className="cv-browser-list">
        {isSearchMode ? (
          // Flat ranked results when searching
          <>
            {semanticScoreMap && (
              <div className="cv-browser-search-meta">
                <span>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                {hasEmbeddings && <span className="cv-browser-search-badge">Semantic</span>}
              </div>
            )}
            {filtered.map(skill => renderSkillRow(skill, true))}
          </>
        ) : grouped ? (
          // Grouped by purpose when browsing
          grouped.map(([group, skills]) => {
            const isCollapsed = collapsedGroups.has(group)
            return (
              <div key={group}>
                <div className="cv-palette-dept-header" onClick={() => toggleGroup(group)}>
                  <span className="cv-palette-dept-name">{group}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="cv-palette-dept-count">{skills.length}</span>
                    <span className={`cv-palette-dept-chevron${isCollapsed ? ' collapsed' : ''}`}>
                      ▾
                    </span>
                  </div>
                </div>
                {!isCollapsed && skills.map(skill => renderSkillRow(skill))}
              </div>
            )
          })
        ) : null}
        {filtered.length === 0 && (
          <div className="cv-skills-empty">
            {search || activeTags.size > 0 ? 'No matching skills' : 'No skills found'}
          </div>
        )}
      </div>
      {ctxMenu && (
        <SkillContextMenu
          skillId={ctxMenu.skillId}
          variantPath={ctxMenu.variantPath}
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  )
}
