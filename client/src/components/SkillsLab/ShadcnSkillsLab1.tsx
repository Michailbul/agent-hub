import '@/shadcn-globals.css'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useSkillsLabStore, type UnifiedSkill, type SkillSource, type LabAgent } from '@/store/skillsLab'
import { cn } from '@/lib/utils'

// shadcn/ui components
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

// Icons
import {
  Search,
  Star,
  Package,
  Bot,
  Layers,
  Filter,
  X,
  Plus,
  Upload,
  Trash2,
  ChevronDown,
  Eye,
  Code,
  Clock,
  ArrowLeft,
  TerminalSquare,
  Feather,
  AlertTriangle,
  ExternalLink,
  List,
  LayoutGrid,
  Moon,
  Sun,
  Sparkles,
  Users,
} from 'lucide-react'

/* ================================================================
   Helper: check if any filter is active
   ================================================================ */
function hasActiveFilters(store: {
  searchQuery: string
  activeSourceFilter: string | null
  activeAgentFilter: string | null
  activeFamilyFilter: string | null
  duplicateOnly: boolean
  activeDepartments: Set<string>
}): boolean {
  return !!(
    store.searchQuery ||
    store.activeSourceFilter ||
    store.activeAgentFilter ||
    store.activeFamilyFilter ||
    store.duplicateOnly ||
    store.activeDepartments.size > 0
  )
}

/* ================================================================
   Sub-components
   ================================================================ */

/** Active filter chip with remove button */
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <Badge variant="secondary" className="gap-1 pl-2 pr-1">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
      >
        <X className="size-3" />
      </button>
    </Badge>
  )
}

/** Source colored dot */
function SourceDot({ color, className }: { color: string; className?: string }) {
  return (
    <span
      className={cn('inline-block size-2.5 rounded-full shrink-0', className)}
      style={{ backgroundColor: color }}
    />
  )
}

/* ================================================================
   SIDEBAR PANEL
   ================================================================ */
function SidebarPanel() {
  const sources = useSkillsLabStore(s => s.sources)
  const agents = useSkillsLabStore(s => s.agents)
  const departments = useSkillsLabStore(s => s.departments)
  const families = useSkillsLabStore(s => s.families)
  const skills = useSkillsLabStore(s => s.skills)

  const searchQuery = useSkillsLabStore(s => s.searchQuery)
  const setSearchQuery = useSkillsLabStore(s => s.setSearchQuery)
  const activeScope = useSkillsLabStore(s => s.activeScope)
  const setActiveScope = useSkillsLabStore(s => s.setActiveScope)
  const activeSavedView = useSkillsLabStore(s => s.activeSavedView)
  const setActiveSavedView = useSkillsLabStore(s => s.setActiveSavedView)
  const activeSourceFilter = useSkillsLabStore(s => s.activeSourceFilter)
  const setActiveSourceFilter = useSkillsLabStore(s => s.setActiveSourceFilter)
  const activeAgentFilter = useSkillsLabStore(s => s.activeAgentFilter)
  const setActiveAgentFilter = useSkillsLabStore(s => s.setActiveAgentFilter)
  const activeFamilyFilter = useSkillsLabStore(s => s.activeFamilyFilter)
  const setActiveFamilyFilter = useSkillsLabStore(s => s.setActiveFamilyFilter)
  const duplicateOnly = useSkillsLabStore(s => s.duplicateOnly)
  const toggleDuplicateOnly = useSkillsLabStore(s => s.toggleDuplicateOnly)
  const activeDepartments = useSkillsLabStore(s => s.activeDepartments)
  const toggleDepartment = useSkillsLabStore(s => s.toggleDepartment)
  const clearAllFilters = useSkillsLabStore(s => s.clearAllFilters)
  const starredSkillIds = useSkillsLabStore(s => s.starredSkillIds)

  const filtersActive = hasActiveFilters({
    searchQuery, activeSourceFilter, activeAgentFilter,
    activeFamilyFilter, duplicateOnly, activeDepartments,
  })

  const starredCount = starredSkillIds.size
  const recentCount = skills.filter(s => s.addedAt).length

  return (
    <div className="flex flex-col h-full w-[280px] shrink-0 border-r bg-card">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Scope tabs */}
      <div className="px-3 pb-2">
        <Tabs value={activeScope} onValueChange={v => setActiveScope(v as 'all' | 'claude')}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">All</TabsTrigger>
            <TabsTrigger value="claude" className="flex-1 text-xs">
              <Sparkles className="size-3 mr-1" />
              Claude
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator />

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-4">
          {/* Saved views */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Views</h3>
            <div className="space-y-0.5">
              {([
                { key: 'all' as const, label: 'All Skills', icon: Package, count: skills.length },
                { key: 'starred' as const, label: 'Starred', icon: Star, count: starredCount },
                { key: 'recent' as const, label: 'Recent', icon: Clock, count: recentCount },
              ]).map(view => (
                <button
                  key={view.key}
                  onClick={() => setActiveSavedView(view.key)}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors',
                    activeSavedView === view.key
                      ? 'bg-secondary text-secondary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <view.icon className="size-4 shrink-0" />
                  <span className="flex-1 text-left truncate">{view.label}</span>
                  <Badge variant="outline" className="h-4 text-[10px] px-1.5 font-normal">
                    {view.count}
                  </Badge>
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Sources */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Sources</h3>
            <div className="space-y-0.5">
              {sources.map(source => (
                <button
                  key={source.id}
                  onClick={() => setActiveSourceFilter(source.id)}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors',
                    activeSourceFilter === source.id
                      ? 'bg-secondary text-secondary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <SourceDot color={source.color} />
                  <span className="flex-1 text-left truncate">{source.label}</span>
                  <Badge variant="outline" className="h-4 text-[10px] px-1.5 font-normal">
                    {source.skillCount}
                  </Badge>
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Agents */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Agents</h3>
            <div className="space-y-0.5">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  onClick={() => setActiveAgentFilter(agent.id)}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors',
                    activeAgentFilter === agent.id
                      ? 'bg-secondary text-secondary-foreground font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <span className="text-base leading-none shrink-0">{agent.emoji}</span>
                  <span className="flex-1 text-left truncate">{agent.label}</span>
                  <span className="text-xs text-muted-foreground">{agent.role}</span>
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Departments */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Departments</h3>
            <div className="flex flex-wrap gap-1.5">
              {departments.map(dept => (
                <Badge
                  key={dept}
                  variant={activeDepartments.has(dept) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleDepartment(dept)}
                >
                  {dept}
                </Badge>
              ))}
            </div>
          </section>

          {/* Families */}
          {families.length > 0 && (
            <>
              <Separator />
              <section>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Families</h3>
                <div className="space-y-0.5">
                  {families.map(family => (
                    <button
                      key={family.key}
                      onClick={() => setActiveFamilyFilter(family.key)}
                      className={cn(
                        'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors',
                        activeFamilyFilter === family.key
                          ? 'bg-secondary text-secondary-foreground font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Layers className="size-3.5 shrink-0" />
                      <span className="flex-1 text-left truncate">{family.label}</span>
                      <Badge variant="outline" className="h-4 text-[10px] px-1.5 font-normal">
                        {family.count}
                      </Badge>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          <Separator />

          {/* Duplicate filter toggle */}
          <section>
            <button
              onClick={toggleDuplicateOnly}
              className={cn(
                'flex items-center gap-2 w-full rounded-md px-2 py-1.5 text-sm transition-colors',
                duplicateOnly
                  ? 'bg-destructive/10 text-destructive font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <AlertTriangle className="size-4 shrink-0" />
              <span className="flex-1 text-left">Duplicates only</span>
            </button>
          </section>

          {/* Clear all filters */}
          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="w-full text-muted-foreground"
            >
              <X className="size-3.5 mr-1" />
              Clear all filters
            </Button>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

/* ================================================================
   SKILL CARD
   ================================================================ */
function SkillCard({
  skill,
  isSelected,
  isStarred,
  sources,
  agents,
  onSelect,
  onToggleStar,
}: {
  skill: UnifiedSkill
  isSelected: boolean
  isStarred: boolean
  sources: SkillSource[]
  agents: LabAgent[]
  onSelect: () => void
  onToggleStar: () => void
}) {
  const installedAgents = useMemo(
    () => agents.filter(a => skill.installedAgentIds.includes(a.id)),
    [agents, skill.installedAgentIds],
  )

  const presentSources = useMemo(
    () => sources.filter(s => skill.presence[s.id] && skill.presence[s.id] !== 'absent'),
    [sources, skill.presence],
  )

  return (
    <Card
      size="sm"
      className={cn(
        'cursor-pointer transition-all hover:ring-2 hover:ring-ring/30',
        isSelected && 'ring-2 ring-primary/50 bg-accent/50'
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{skill.displayName}</CardTitle>
            <CardDescription className="line-clamp-2 mt-0.5 text-xs">
              {skill.description || 'No description'}
            </CardDescription>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onToggleStar() }}
            className={cn(
              'shrink-0 p-1 rounded-md transition-colors',
              isStarred
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-muted-foreground/40 hover:text-muted-foreground'
            )}
          >
            <Star className={cn('size-4', isStarred && 'fill-current')} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Department */}
          <Badge variant="secondary" className="text-[10px] h-4">
            {skill.department}
          </Badge>

          {/* Source dots */}
          <div className="flex items-center gap-1">
            {presentSources.map(src => (
              <TooltipProvider key={src.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <SourceDot color={src.color} />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <span>{src.label}</span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>

          {/* Agent count */}
          {installedAgents.length > 0 && (
            <Badge variant="outline" className="text-[10px] h-4 gap-1">
              <Bot className="size-2.5" />
              {installedAgents.length}
            </Badge>
          )}

          {/* Duplicate warning */}
          {skill.isDuplicate && (
            <Badge variant="destructive" className="text-[10px] h-4 gap-1">
              <AlertTriangle className="size-2.5" />
              dup
            </Badge>
          )}

          {/* Family */}
          {skill.familyLabel && (
            <Badge variant="outline" className="text-[10px] h-4 gap-1 text-muted-foreground">
              <Layers className="size-2.5" />
              {skill.familyLabel}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ================================================================
   SKILLS LIST (center panel)
   ================================================================ */
function SkillsListPanel() {
  const getFilteredSkills = useSkillsLabStore(s => s.filtered)
  const skills = useSkillsLabStore(s => s.skills)
  const sources = useSkillsLabStore(s => s.sources)
  const agents = useSkillsLabStore(s => s.agents)
  const loading = useSkillsLabStore(s => s.loading)
  const error = useSkillsLabStore(s => s.error)

  const searchQuery = useSkillsLabStore(s => s.searchQuery)
  const setSearchQuery = useSkillsLabStore(s => s.setSearchQuery)
  const activeSourceFilter = useSkillsLabStore(s => s.activeSourceFilter)
  const setActiveSourceFilter = useSkillsLabStore(s => s.setActiveSourceFilter)
  const activeAgentFilter = useSkillsLabStore(s => s.activeAgentFilter)
  const setActiveAgentFilter = useSkillsLabStore(s => s.setActiveAgentFilter)
  const activeFamilyFilter = useSkillsLabStore(s => s.activeFamilyFilter)
  const setActiveFamilyFilter = useSkillsLabStore(s => s.setActiveFamilyFilter)
  const duplicateOnly = useSkillsLabStore(s => s.duplicateOnly)
  const toggleDuplicateOnly = useSkillsLabStore(s => s.toggleDuplicateOnly)
  const activeDepartments = useSkillsLabStore(s => s.activeDepartments)
  const toggleDepartment = useSkillsLabStore(s => s.toggleDepartment)
  const clearAllFilters = useSkillsLabStore(s => s.clearAllFilters)

  const expandedSkillId = useSkillsLabStore(s => s.expandedSkillId)
  const setExpandedSkill = useSkillsLabStore(s => s.setExpandedSkill)
  const starredSkillIds = useSkillsLabStore(s => s.starredSkillIds)
  const toggleStarSkill = useSkillsLabStore(s => s.toggleStarSkill)
  const loadSkillContent = useSkillsLabStore(s => s.loadSkillContent)

  const sortField = useSkillsLabStore(s => s.sortField)
  const setSort = useSkillsLabStore(s => s.setSort)
  const sortDir = useSkillsLabStore(s => s.sortDir)
  const families = useSkillsLabStore(s => s.families)

  const installFromZip = useSkillsLabStore(s => s.installFromZip)
  const installFromCommand = useSkillsLabStore(s => s.installFromCommand)
  const installBusy = useSkillsLabStore(s => s.installBusy)

  const filtered = useMemo(() => getFilteredSkills(), [
    getFilteredSkills, skills, searchQuery, activeSourceFilter,
    activeAgentFilter, activeFamilyFilter, duplicateOnly,
    activeDepartments, sortField, sortDir, starredSkillIds,
  ])

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [installCommand, setInstallCommand] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtersActive = hasActiveFilters({
    searchQuery, activeSourceFilter, activeAgentFilter,
    activeFamilyFilter, duplicateOnly, activeDepartments,
  })

  // Active filters for the bar
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = []
    if (searchQuery) chips.push({ key: 'search', label: `"${searchQuery}"`, onRemove: () => setSearchQuery('') })
    if (activeSourceFilter) {
      const src = sources.find(s => s.id === activeSourceFilter)
      chips.push({ key: 'source', label: `Source: ${src?.label || activeSourceFilter}`, onRemove: () => setActiveSourceFilter(activeSourceFilter) })
    }
    if (activeAgentFilter) {
      const agt = agents.find(a => a.id === activeAgentFilter)
      chips.push({ key: 'agent', label: `Agent: ${agt?.label || activeAgentFilter}`, onRemove: () => setActiveAgentFilter(activeAgentFilter) })
    }
    if (activeFamilyFilter) {
      const fam = families.find(f => f.key === activeFamilyFilter)
      chips.push({ key: 'family', label: `Family: ${fam?.label || activeFamilyFilter}`, onRemove: () => setActiveFamilyFilter(activeFamilyFilter) })
    }
    if (duplicateOnly) chips.push({ key: 'dupe', label: 'Duplicates only', onRemove: toggleDuplicateOnly })
    for (const dept of activeDepartments) {
      chips.push({ key: `dept-${dept}`, label: `Dept: ${dept}`, onRemove: () => toggleDepartment(dept) })
    }
    return chips
  }, [searchQuery, activeSourceFilter, activeAgentFilter, activeFamilyFilter, duplicateOnly, activeDepartments, sources, agents, families, setSearchQuery, setActiveSourceFilter, setActiveAgentFilter, setActiveFamilyFilter, toggleDuplicateOnly, toggleDepartment])

  const handleSelectSkill = useCallback((skill: UnifiedSkill) => {
    setExpandedSkill(skill.id)
    if (skill.previewPath) {
      loadSkillContent(skill.id, skill.previewPath)
    }
  }, [setExpandedSkill, loadSkillContent])

  const handleInstallZip = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await installFromZip(file)
    } catch {}
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [installFromZip])

  const handleInstallCommand = useCallback(async () => {
    if (!installCommand.trim()) return
    try {
      await installFromCommand(installCommand.trim())
      setInstallCommand('')
      setShowInstallDialog(false)
    } catch {}
  }, [installCommand, installFromCommand])

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card/50">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground whitespace-nowrap">
            {filtered.length} skill{filtered.length !== 1 ? 's' : ''}
          </span>
          {filtersActive && (
            <span className="text-xs text-muted-foreground">
              of {skills.length}
            </span>
          )}
        </div>

        {/* Sort */}
        <Select value={sortField} onValueChange={v => setSort(v as 'name' | 'department')}>
          <SelectTrigger size="sm" className="w-auto gap-1">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="department">Department</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setViewMode('list')}
            className="rounded-r-none"
          >
            <List className="size-3.5" />
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon-xs"
            onClick={() => setViewMode('grid')}
            className="rounded-l-none"
          >
            <LayoutGrid className="size-3.5" />
          </Button>
        </div>

        {/* Install actions */}
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="outline" size="sm">
              <Plus className="size-3.5 mr-1" />
              Install
              <ChevronDown className="size-3 ml-1" />
            </Button>
          } />
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Install Skill</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="size-4 mr-2" />
              From ZIP file
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowInstallDialog(true)}>
              <TerminalSquare className="size-4 mr-2" />
              From command
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={handleInstallZip}
        />
      </div>

      {/* Active filters bar */}
      {activeFilterChips.length > 0 && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-b bg-muted/30 flex-wrap">
          <Filter className="size-3.5 text-muted-foreground shrink-0" />
          {activeFilterChips.map(chip => (
            <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
          ))}
          <Button variant="ghost" size="xs" onClick={clearAllFilters} className="text-muted-foreground ml-1">
            Clear all
          </Button>
        </div>
      )}

      {/* Skills list */}
      <ScrollArea className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <div className="size-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              <span className="text-sm">Loading skills...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-48 text-destructive">
            <div className="flex flex-col items-center gap-2 text-center px-4">
              <AlertTriangle className="size-8" />
              <span className="text-sm font-medium">Failed to load skills</span>
              <span className="text-xs text-muted-foreground">{error}</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-center">
              <Package className="size-10 text-muted-foreground/40" />
              <span className="text-sm font-medium">No skills found</span>
              <span className="text-xs">Try adjusting your filters</span>
              {filtersActive && (
                <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-1">
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={cn(
            'p-3',
            viewMode === 'grid'
              ? 'grid grid-cols-2 gap-3'
              : 'flex flex-col gap-2'
          )}>
            {filtered.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                isSelected={expandedSkillId === skill.id}
                isStarred={starredSkillIds.has(skill.id)}
                sources={sources}
                agents={agents}
                onSelect={() => handleSelectSkill(skill)}
                onToggleStar={() => toggleStarSkill(skill.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Install from command dialog */}
      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install from command</DialogTitle>
            <DialogDescription>
              Paste an npx or install command to add a new skill.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input
              placeholder="npx @example/skill-installer ..."
              value={installCommand}
              onChange={e => setInstallCommand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInstallCommand()}
              className="font-mono text-xs"
            />
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleInstallCommand}
              disabled={!installCommand.trim() || installBusy}
            >
              {installBusy ? 'Installing...' : 'Install'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ================================================================
   DETAIL PANEL (right side)
   ================================================================ */
function DetailPanel() {
  const expandedSkillId = useSkillsLabStore(s => s.expandedSkillId)
  const setExpandedSkill = useSkillsLabStore(s => s.setExpandedSkill)
  const skills = useSkillsLabStore(s => s.skills)
  const sources = useSkillsLabStore(s => s.sources)
  const agents = useSkillsLabStore(s => s.agents)
  const skillContentCache = useSkillsLabStore(s => s.skillContentCache)
  const loadSkillContent = useSkillsLabStore(s => s.loadSkillContent)
  const assignSkill = useSkillsLabStore(s => s.assignSkill)
  const unassignSkill = useSkillsLabStore(s => s.unassignSkill)
  const deleteSkill = useSkillsLabStore(s => s.deleteSkill)
  const starredSkillIds = useSkillsLabStore(s => s.starredSkillIds)
  const toggleStarSkill = useSkillsLabStore(s => s.toggleStarSkill)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)
  const [contentTab, setContentTab] = useState<'preview' | 'variants'>('preview')

  const skill = useMemo(
    () => skills.find(s => s.id === expandedSkillId) || null,
    [skills, expandedSkillId],
  )

  const installedAgents = useMemo(
    () => (skill ? agents.filter(a => skill.installedAgentIds.includes(a.id)) : []),
    [agents, skill],
  )

  const availableAgents = useMemo(
    () => (skill ? agents.filter(a => !skill.installedAgentIds.includes(a.id)) : []),
    [agents, skill],
  )

  const presentSources = useMemo(
    () => (skill ? sources.filter(s => skill.presence[s.id] && skill.presence[s.id] !== 'absent') : []),
    [sources, skill],
  )

  const variants = useMemo(
    () => (skill ? Object.values(skill.sourceVariants) : []),
    [skill],
  )

  const contentKey = skill?.id || ''
  const content = skillContentCache[contentKey] || null

  // Load content when skill changes
  useEffect(() => {
    if (skill && !content) {
      loadSkillContent(skill.id, skill.previewPath)
    }
  }, [skill, content, loadSkillContent])

  const handleAssign = useCallback(async (agentId: string) => {
    if (!skill) return
    // Pick the first variant path
    const firstVariant = Object.values(skill.sourceVariants)[0]
    if (!firstVariant) return
    setAssignLoading(true)
    try {
      await assignSkill(agentId, firstVariant.path)
    } catch {}
    setAssignLoading(false)
  }, [skill, assignSkill])

  const handleUnassign = useCallback(async (agentId: string) => {
    if (!skill) return
    try {
      await unassignSkill(agentId, skill.id)
    } catch {}
  }, [skill, unassignSkill])

  const handleDelete = useCallback(async () => {
    if (!skill) return
    setDeleteLoading(true)
    try {
      await deleteSkill(skill.id)
      setShowDeleteConfirm(false)
      setExpandedSkill(null)
    } catch {}
    setDeleteLoading(false)
  }, [skill, deleteSkill, setExpandedSkill])

  if (!skill) return null

  const isStarred = starredSkillIds.has(skill.id)

  return (
    <div className="w-[400px] shrink-0 border-l flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setExpandedSkill(null)}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold truncate">{skill.displayName}</h2>
          <p className="text-xs text-muted-foreground truncate">{skill.department}</p>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => toggleStarSkill(skill.id)}
          className={isStarred ? 'text-yellow-500' : 'text-muted-foreground'}
        >
          <Star className={cn('size-4', isStarred && 'fill-current')} />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-4">
          {/* Description */}
          <section>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {skill.description || 'No description available.'}
            </p>
          </section>

          {/* Metadata */}
          {(skill.metadata.author || skill.metadata.source || skill.metadata.license) && (
            <section>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Metadata</h3>
              <div className="space-y-1.5">
                {skill.metadata.author && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Author:</span>
                    <span className="font-medium">{skill.metadata.author}</span>
                  </div>
                )}
                {skill.metadata.source && (
                  <div className="flex items-center gap-2 text-sm">
                    <ExternalLink className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">Source:</span>
                    <span className="font-medium truncate">{skill.metadata.source}</span>
                  </div>
                )}
                {skill.metadata.license && (
                  <div className="flex items-center gap-2 text-sm">
                    <Feather className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">License:</span>
                    <span className="font-medium">{skill.metadata.license}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          <Separator />

          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs">{skill.department}</Badge>
            {skill.isDuplicate && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="size-3" />
                Duplicate
              </Badge>
            )}
            {skill.familyLabel && (
              <Badge variant="outline" className="text-xs gap-1">
                <Layers className="size-3" />
                {skill.familyLabel}
              </Badge>
            )}
            {presentSources.map(src => (
              <Badge key={src.id} variant="outline" className="text-xs gap-1">
                <SourceDot color={src.color} className="size-2" />
                {src.label}
              </Badge>
            ))}
          </div>

          <Separator />

          {/* Installed agents */}
          <section>
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Installed on ({installedAgents.length})
            </h3>
            {installedAgents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Not installed on any agent.</p>
            ) : (
              <div className="space-y-1.5">
                {installedAgents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-2 bg-muted/50 rounded-md px-2.5 py-1.5">
                    <span className="text-sm">{agent.emoji}</span>
                    <span className="text-sm font-medium flex-1 truncate">{agent.label}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleUnassign(agent.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Assign dropdown */}
            {availableAgents.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="outline" size="sm" className="mt-2 w-full" disabled={assignLoading}>
                    <Plus className="size-3.5 mr-1" />
                    {assignLoading ? 'Assigning...' : 'Assign to agent'}
                  </Button>
                } />
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Select agent</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {availableAgents.map(agent => (
                    <DropdownMenuItem key={agent.id} onClick={() => handleAssign(agent.id)}>
                      <span className="mr-2">{agent.emoji}</span>
                      <span className="flex-1">{agent.label}</span>
                      <span className="text-xs text-muted-foreground">{agent.role}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </section>

          <Separator />

          {/* Content tabs: Preview / Variants */}
          <Tabs value={contentTab} onValueChange={v => setContentTab(v as 'preview' | 'variants')}>
            <TabsList className="w-full">
              <TabsTrigger value="preview" className="flex-1 text-xs gap-1">
                <Eye className="size-3" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="variants" className="flex-1 text-xs gap-1">
                <Code className="size-3" />
                Variants ({variants.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-3">
              {content ? (
                <div className="rounded-lg bg-muted/50 border overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/30">
                    <Code className="size-3 text-muted-foreground" />
                    <span className="text-[10px] font-mono text-muted-foreground truncate">
                      {skill.previewPath?.split('/').pop() || 'SKILL.md'}
                    </span>
                  </div>
                  <ScrollArea className="max-h-[300px]">
                    <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words text-foreground/80 leading-relaxed">
                      {content}
                    </pre>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <span className="text-xs">Loading content...</span>
                </div>
              )}
            </TabsContent>

            <TabsContent value="variants" className="mt-3">
              {variants.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No source variants.</p>
              ) : (
                <div className="space-y-2">
                  {variants.map((variant, i) => {
                    const source = sources.find(s => s.id === variant.sourceId)
                    return (
                      <Card key={`${variant.sourceId}-${i}`} size="sm" className="bg-muted/30">
                        <CardContent className="py-2">
                          <div className="flex items-center gap-2 mb-1">
                            <SourceDot color={source?.color || '#94a3b8'} />
                            <span className="text-xs font-medium">{variant.sourceLabel}</span>
                            <Badge variant="outline" className="text-[10px] h-4">{variant.kind}</Badge>
                            {variant.isSymlink && (
                              <Badge variant="outline" className="text-[10px] h-4">symlink</Badge>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground truncate">
                            {variant.path}
                          </p>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Danger zone */}
          <section>
            <h3 className="text-xs font-medium text-destructive uppercase tracking-wider mb-2">Danger Zone</h3>
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <DialogTrigger render={
                <Button variant="destructive" size="sm" className="w-full">
                  <Trash2 className="size-3.5 mr-1" />
                  Delete skill
                </Button>
              } />
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>Delete "{skill.displayName}"?</DialogTitle>
                  <DialogDescription>
                    This will remove the skill from the library and unlink it from all agents.
                    This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Cancel
                  </DialogClose>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */
export function ShadcnSkillsLab1() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('shadcn-lab-1-dark') === 'true'
  })

  const loadFromAPI = useSkillsLabStore(s => s.loadFromAPI)
  const loading = useSkillsLabStore(s => s.loading)
  const loaded = useSkillsLabStore(s => s.loaded)
  const expandedSkillId = useSkillsLabStore(s => s.expandedSkillId)

  useEffect(() => { loadFromAPI() }, [loadFromAPI])

  useEffect(() => {
    window.localStorage.setItem('shadcn-lab-1-dark', String(isDark))
  }, [isDark])

  return (
    <TooltipProvider>
      <div className={cn('shadcn-theme-1 flex flex-col h-full w-full overflow-hidden', isDark && 'dark')}>
        {/* Top header */}
        <header className="flex items-center justify-between px-4 py-2.5 border-b bg-card">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Feather className="size-5 text-primary" />
              <h1 className="text-base font-semibold text-foreground">Skills Lab</h1>
            </div>
            <Separator orientation="vertical" className="h-5" />
            <span className="text-xs text-muted-foreground">
              Manage, explore, and install agent skills
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sun className="size-3.5 text-muted-foreground" />
              <Switch
                checked={isDark}
                onCheckedChange={setIsDark}
                size="sm"
              />
              <Moon className="size-3.5 text-muted-foreground" />
            </div>
          </div>
        </header>

        {/* Main body: 3-column layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <SidebarPanel />
          <SkillsListPanel />
          {expandedSkillId && <DetailPanel />}
        </div>

        {/* Status bar */}
        <footer className="flex items-center justify-between px-4 py-1.5 border-t bg-card text-xs text-muted-foreground">
          <span>
            {loading ? 'Loading...' : loaded ? 'Ready' : 'Not loaded'}
          </span>
          <span>shadcn/ui + Tailwind</span>
        </footer>
      </div>
    </TooltipProvider>
  )
}
