import { useState, useMemo } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { SkillPaletteRow } from './SkillPaletteRow'
import { SkillContextMenu } from './SkillContextMenu'
import { CategoryFilter } from './CategoryFilter'
import type { PaletteSkill } from '@/types/canvas'

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
  const previewSkill = useCanvasStore(s => s.previewSkill)
  const sourceFilter = useCanvasStore(s => s.sourceFilter)
  const setSourceFilter = useCanvasStore(s => s.setSourceFilter)
  const [search, setSearch] = useState('')
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set())
  const [ctxMenu, setCtxMenu] = useState<{ skillId: string; variantPath: string; x: number; y: number } | null>(null)

  const paletteSkills = data?.paletteSkills || []
  const q = search.trim().toLowerCase()

  // Source counts for tabs
  const ownCount = useMemo(() => paletteSkills.filter(s => s.isInMaster || s.sourceKind === 'workspace').length, [paletteSkills])
  const libCount = useMemo(() => paletteSkills.filter(s => !s.isInMaster && s.sourceKind !== 'workspace').length, [paletteSkills])

  const filtered = useMemo(() => {
    let result = paletteSkills
    // Source filter
    if (sourceFilter === 'own') {
      result = result.filter(s => s.isInMaster || s.sourceKind === 'workspace')
    } else if (sourceFilter === 'library') {
      result = result.filter(s => !s.isInMaster && s.sourceKind !== 'workspace')
    }
    if (activeTags.size > 0) {
      result = result.filter(s => activeTags.has(s.department))
    }
    if (q) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q),
      )
    }
    return result
  }, [paletteSkills, q, activeTags, sourceFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteSkill[]>()
    for (const skill of filtered) {
      const dept = skill.department || 'Utility'
      if (!map.has(dept)) map.set(dept, [])
      map.get(dept)!.push(skill)
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === 'Utility') return 1
      if (b === 'Utility') return -1
      return a.localeCompare(b)
    })
  }, [filtered])

  const toggleDept = (dept: string) => {
    setCollapsedDepts(prev => {
      const next = new Set(prev)
      if (next.has(dept)) next.delete(dept)
      else next.add(dept)
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
          <input
            className="cv-palette-search-input"
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
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
        {grouped.map(([dept, skills]) => {
          const isCollapsed = collapsedDepts.has(dept)
          return (
            <div key={dept}>
              <div className="cv-palette-dept-header" onClick={() => toggleDept(dept)}>
                <span className="cv-palette-dept-name">{dept}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="cv-palette-dept-count">{skills.length}</span>
                  <span className={`cv-palette-dept-chevron${isCollapsed ? ' collapsed' : ''}`}>
                    ▾
                  </span>
                </div>
              </div>
              {!isCollapsed && skills.map(skill => (
                <SkillPaletteRow
                  key={skill.id}
                  skill={skill}
                  onAssign={selectedAgentId ? () => handleAssign(skill) : undefined}
                  onPreview={() => previewSkill(skill.id)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setCtxMenu({ skillId: skill.id, variantPath: skill.variantPath, x: e.clientX, y: e.clientY })
                  }}
                />
              ))}
            </div>
          )
        })}
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
