import { useState, useMemo } from 'react'
import { useCanvasStore } from '@/store/canvas'
import { SkillPaletteRow } from './SkillPaletteRow'
import { SkillContextMenu } from './SkillContextMenu'
import { CategoryFilter } from './CategoryFilter'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { PaletteSkill } from '@/types/canvas'

export function SkillBrowser() {
  const data = useCanvasStore(s => s.data)
  const browserOpen = useCanvasStore(s => s.browserOpen)
  const toggleBrowser = useCanvasStore(s => s.toggleBrowser)
  const allTags = useCanvasStore(s => s.allTags)
  const activeTags = useCanvasStore(s => s.activeTags)
  const selectTag = useCanvasStore(s => s.selectTag)
  const addTag = useCanvasStore(s => s.addTag)
  const removeTag = useCanvasStore(s => s.removeTag)
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

  const ownCount = useMemo(() => paletteSkills.filter(s => s.isInMaster || s.sourceKind === 'workspace').length, [paletteSkills])
  const libCount = useMemo(() => paletteSkills.filter(s => !s.isInMaster && s.sourceKind !== 'workspace').length, [paletteSkills])

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
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.pillarName.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q),
      )
    }
    return result
  }, [paletteSkills, q, activeTags, sourceFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteSkill[]>()
    for (const skill of filtered) {
      const dept = skill.pillarName || 'Utility'
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
    <div className="w-[300px] shrink-0 bg-background border-l border-border flex flex-col overflow-hidden cv-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            Skill Browser
          </span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
            {paletteSkills.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleBrowser}
          className="text-muted-foreground"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Button>
      </div>

      <Separator />

      {/* Toolbar */}
      <div className="shrink-0">
        {/* Search */}
        <div className="px-3 py-2">
          <Input
            type="text"
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-7 text-xs"
          />
        </div>

        {/* Source tabs */}
        <div className="flex gap-0.5 px-2.5 pb-2">
          {[
            { key: 'all' as const, label: 'All', count: paletteSkills.length },
            { key: 'own' as const, label: 'My Skills', count: ownCount },
            { key: 'library' as const, label: 'Library', count: libCount },
          ].map(tab => (
            <Button
              key={tab.key}
              variant={sourceFilter === tab.key ? 'secondary' : 'ghost'}
              size="xs"
              className="gap-1 text-[11px]"
              onClick={() => setSourceFilter(tab.key)}
            >
              {tab.label}
              <Badge
                variant={sourceFilter === tab.key ? 'default' : 'secondary'}
                className="text-[9px] h-3.5 px-1 min-w-0"
              >
                {tab.count}
              </Badge>
            </Button>
          ))}
        </div>

        <Separator />

        <CategoryFilter
          tags={allTags}
          activeTags={activeTags}
          onSelect={selectTag}
          onAdd={addTag}
          onRemove={removeTag}
          onClear={clearTags}
        />
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {grouped.map(([dept, skills]) => {
          const isCollapsed = collapsedDepts.has(dept)
          return (
            <div key={dept}>
              <button
                className="flex items-center justify-between w-full px-3 py-2 bg-muted/50 border-b border-border cursor-pointer hover:bg-muted transition-colors text-left"
                onClick={() => toggleDept(dept)}
              >
                <span className="text-[11px] font-medium text-foreground uppercase tracking-wider">
                  {dept}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[9px] h-3.5 px-1">
                    {skills.length}
                  </Badge>
                  <svg
                    width="8" height="8" viewBox="0 0 8 8" fill="none"
                    className={`transition-transform duration-150 text-muted-foreground ${isCollapsed ? '-rotate-90' : ''}`}
                  >
                    <path d="M2 2.5L4 4.5L6 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
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
          <div className="text-xs text-muted-foreground text-center py-8">
            {search || activeTags.size > 0 ? 'No matching skills' : 'No skills found'}
          </div>
        )}
      </ScrollArea>

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
