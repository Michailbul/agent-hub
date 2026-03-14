import '@/shadcn-globals.css'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSkillsLabStore } from '@/store/skillsLab'
import type { UnifiedSkill, SkillSource, SortField } from '@/store/skillsLab'
import { cn } from '@/lib/utils'

// shadcn/ui components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// Icons
import {
  Search,
  Star,
  Package,
  Bot,
  Filter,
  X,
  Plus,
  Download,
  Upload,
  Trash2,
  ChevronDown,
  Clock,
  ArrowLeft,
  TerminalSquare,
  List,
  Moon,
  Sun,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  CircleDot,
} from 'lucide-react'


/* ======================================================================
   Helper: relative time
   ====================================================================== */
function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '--'
  const ms = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

/* ======================================================================
   Helper: presence dots for source columns
   ====================================================================== */
function PresenceDots({
  skill,
  sources,
}: {
  skill: UnifiedSkill
  sources: SkillSource[]
}) {
  return (
    <div className="flex items-center gap-1">
      {sources.map((src) => {
        const status = skill.presence[src.id]
        if (status === 'absent') {
          return (
            <span
              key={src.id}
              className="block h-2 w-2 rounded-full bg-muted"
              title={`${src.label}: absent`}
            />
          )
        }
        return (
          <span
            key={src.id}
            className="block h-2 w-2 rounded-full"
            style={{ backgroundColor: src.color }}
            title={`${src.label}: ${status}`}
          />
        )
      })}
    </div>
  )
}

/* ======================================================================
   Subcomponent: Active Filters Bar
   ====================================================================== */
function ActiveFiltersBar() {
  const activeSourceFilter = useSkillsLabStore((s) => s.activeSourceFilter)
  const activeAgentFilter = useSkillsLabStore((s) => s.activeAgentFilter)
  const activeFamilyFilter = useSkillsLabStore((s) => s.activeFamilyFilter)
  const duplicateOnly = useSkillsLabStore((s) => s.duplicateOnly)
  const activeDepartments = useSkillsLabStore((s) => s.activeDepartments)
  const sources = useSkillsLabStore((s) => s.sources)
  const agents = useSkillsLabStore((s) => s.agents)
  const families = useSkillsLabStore((s) => s.families)
  const setActiveSourceFilter = useSkillsLabStore((s) => s.setActiveSourceFilter)
  const setActiveAgentFilter = useSkillsLabStore((s) => s.setActiveAgentFilter)
  const setActiveFamilyFilter = useSkillsLabStore((s) => s.setActiveFamilyFilter)
  const toggleDuplicateOnly = useSkillsLabStore((s) => s.toggleDuplicateOnly)
  const toggleDepartment = useSkillsLabStore((s) => s.toggleDepartment)
  const clearAllFilters = useSkillsLabStore((s) => s.clearAllFilters)

  const chips: { label: string; onClear: () => void }[] = []

  if (activeSourceFilter) {
    const src = sources.find((s) => s.id === activeSourceFilter)
    chips.push({
      label: `Source: ${src?.label || activeSourceFilter}`,
      onClear: () => setActiveSourceFilter(activeSourceFilter),
    })
  }
  if (activeAgentFilter) {
    const ag = agents.find((a) => a.id === activeAgentFilter)
    chips.push({
      label: `Agent: ${ag?.label || activeAgentFilter}`,
      onClear: () => setActiveAgentFilter(activeAgentFilter),
    })
  }
  if (activeFamilyFilter) {
    const fam = families.find((f) => f.key === activeFamilyFilter)
    chips.push({
      label: `Family: ${fam?.label || activeFamilyFilter}`,
      onClear: () => setActiveFamilyFilter(activeFamilyFilter),
    })
  }
  if (duplicateOnly) {
    chips.push({
      label: 'Duplicates only',
      onClear: toggleDuplicateOnly,
    })
  }
  for (const dept of activeDepartments) {
    chips.push({
      label: `Dept: ${dept}`,
      onClear: () => toggleDepartment(dept),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((chip) => (
        <Badge
          key={chip.label}
          variant="secondary"
          className="cursor-pointer gap-1 pr-1"
        >
          {chip.label}
          <button
            onClick={(e) => {
              e.stopPropagation()
              chip.onClear()
            }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
          >
            <X className="size-2.5" />
          </button>
        </Badge>
      ))}
      <button
        onClick={clearAllFilters}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Clear all
      </button>
    </div>
  )
}

/* ======================================================================
   Subcomponent: Sort Header Cell
   ====================================================================== */
function SortableHeader({
  label,
  field,
  currentField,
  currentDir,
  onSort,
  className,
}: {
  label: string
  field: SortField
  currentField: SortField
  currentDir: 'asc' | 'desc'
  onSort: (field: SortField) => void
  className?: string
}) {
  const isActive = currentField === field
  return (
    <TableHead className={cn('cursor-pointer select-none', className)}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        {label}
        {isActive ? (
          currentDir === 'asc' ? (
            <ArrowUp className="size-3" />
          ) : (
            <ArrowDown className="size-3" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-30" />
        )}
      </button>
    </TableHead>
  )
}

/* ======================================================================
   Subcomponent: Detail Sidebar
   ====================================================================== */
function DetailSidebar({
  skill,
  onClose,
}: {
  skill: UnifiedSkill
  onClose: () => void
}) {
  const agents = useSkillsLabStore((s) => s.agents)
  const skillContentCache = useSkillsLabStore((s) => s.skillContentCache)
  const loadSkillContent = useSkillsLabStore((s) => s.loadSkillContent)
  const assignSkill = useSkillsLabStore((s) => s.assignSkill)
  const unassignSkill = useSkillsLabStore((s) => s.unassignSkill)
  const deleteSkill = useSkillsLabStore((s) => s.deleteSkill)
  const starredSkillIds = useSkillsLabStore((s) => s.starredSkillIds)
  const toggleStarSkill = useSkillsLabStore((s) => s.toggleStarSkill)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [assigningAgent, setAssigningAgent] = useState<string | null>(null)
  const [contentLoading, setContentLoading] = useState(false)

  const isStarred = starredSkillIds.has(skill.id)
  const content = skillContentCache[skill.id]

  // Load skill content on mount
  useEffect(() => {
    if (!content && skill.previewPath) {
      setContentLoading(true)
      loadSkillContent(skill.id, skill.previewPath).finally(() =>
        setContentLoading(false)
      )
    }
  }, [skill.id, skill.previewPath, content, loadSkillContent])

  const installedAgents = useMemo(
    () =>
      agents.filter((a) => skill.installedAgentIds.includes(a.id)),
    [agents, skill.installedAgentIds]
  )

  const uninstalledAgents = useMemo(
    () =>
      agents.filter((a) => !skill.installedAgentIds.includes(a.id)),
    [agents, skill.installedAgentIds]
  )

  const variants = useMemo(
    () => Object.values(skill.sourceVariants),
    [skill.sourceVariants]
  )

  const handleAssign = async (agentId: string) => {
    const preferred = variants[0]
    if (!preferred) return
    setAssigningAgent(agentId)
    try {
      await assignSkill(agentId, preferred.path)
    } catch {
      // silently fail
    } finally {
      setAssigningAgent(null)
    }
  }

  const handleUnassign = async (agentId: string) => {
    try {
      await unassignSkill(agentId, skill.id)
    } catch {
      // silently fail
    }
  }

  const handleDelete = async () => {
    try {
      await deleteSkill(skill.id)
      onClose()
    } catch {
      // silently fail
    }
    setShowDeleteConfirm(false)
  }

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-4" />
            </button>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Detail
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight truncate">
            {skill.displayName}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleStarSkill(skill.id)}
          className={cn(isStarred && 'text-foreground')}
        >
          <Star
            className={cn('size-4', isStarred && 'fill-current')}
          />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-6 pb-6 space-y-6">
          {/* Description */}
          {skill.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {skill.description}
            </p>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Department
              </span>
              <p className="mt-0.5 font-medium">{skill.department || '--'}</p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Family
              </span>
              <p className="mt-0.5 font-medium">
                {skill.familyLabel || '--'}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Author
              </span>
              <p className="mt-0.5 font-medium">
                {skill.metadata.author || '--'}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                License
              </span>
              <p className="mt-0.5 font-medium">
                {skill.metadata.license || '--'}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Source
              </span>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground break-all">
                {skill.metadata.source || skill.canonicalSource || '--'}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Added
              </span>
              <p className="mt-0.5 font-medium">
                {skill.addedAt
                  ? new Date(skill.addedAt).toLocaleDateString()
                  : '--'}
              </p>
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Variants
              </span>
              <p className="mt-0.5 font-medium">
                {skill.sourceVariantCount}
                {skill.isDuplicate && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    Duplicate
                  </Badge>
                )}
              </p>
            </div>
          </div>

          <Separator />

          {/* Installed Agents */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Installed on
            </h3>
            {installedAgents.length > 0 ? (
              <div className="space-y-2">
                {installedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{agent.emoji}</span>
                      <div>
                        <p className="text-sm font-medium">{agent.label}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {agent.role}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => handleUnassign(agent.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Not installed on any agents
              </p>
            )}

            {/* Assign to agent */}
            {uninstalledAgents.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      <Plus className="size-3 mr-1.5" />
                      Assign to agent
                      <ChevronDown className="size-3 ml-auto" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Available agents</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {uninstalledAgents.map((agent) => (
                    <DropdownMenuItem
                      key={agent.id}
                      disabled={assigningAgent === agent.id}
                      onSelect={() => handleAssign(agent.id)}
                    >
                      <span className="text-base mr-1">{agent.emoji}</span>
                      <span>{agent.label}</span>
                      {assigningAgent === agent.id && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          ...
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <Separator />

          {/* Source Variants */}
          {variants.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                Source variants
              </h3>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Source</TableHead>
                      <TableHead className="text-xs">Kind</TableHead>
                      <TableHead className="text-xs">Ecosystem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {variants.map((v) => (
                      <TableRow key={v.sourceId}>
                        <TableCell className="font-medium text-xs">
                          {v.sourceLabel}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {v.kind}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {v.ecosystem}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {variants[0] && (
                <p className="mt-2 text-[11px] font-mono text-muted-foreground break-all">
                  {variants[0].path}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Content Preview */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Content preview
            </h3>
            {contentLoading ? (
              <div className="rounded-lg border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                Loading content...
              </div>
            ) : content ? (
              <div className="rounded-lg border bg-muted/30 overflow-hidden">
                <pre className="p-4 text-xs font-mono leading-relaxed overflow-x-auto max-h-80 whitespace-pre-wrap text-muted-foreground">
                  {content.slice(0, 2000)}
                  {content.length > 2000 && '\n\n... (truncated)'}
                </pre>
              </div>
            ) : (
              <div className="rounded-lg border bg-muted/30 p-4 text-center text-xs text-muted-foreground italic">
                No content available
              </div>
            )}
          </div>

          <Separator />

          {/* Danger Zone */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-destructive/80 mb-3">
              Danger zone
            </h3>
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
              <DialogTrigger
                render={
                  <Button variant="destructive" size="sm" className="w-full">
                    <Trash2 className="size-3 mr-1.5" />
                    Delete skill
                  </Button>
                }
              />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete {skill.displayName}?</DialogTitle>
                  <DialogDescription>
                    This will remove the skill from the library. It will also be
                    uninstalled from all agents that have it. This action cannot
                    be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    Delete permanently
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

/* ======================================================================
   Subcomponent: Command Palette
   ====================================================================== */
function SkillCommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const skills = useSkillsLabStore((s) => s.skills)
  const sources = useSkillsLabStore((s) => s.sources)
  const agents = useSkillsLabStore((s) => s.agents)
  const departments = useSkillsLabStore((s) => s.departments)
  const starredSkillIds = useSkillsLabStore((s) => s.starredSkillIds)
  const setActiveSourceFilter = useSkillsLabStore((s) => s.setActiveSourceFilter)
  const setActiveAgentFilter = useSkillsLabStore((s) => s.setActiveAgentFilter)
  const toggleDepartment = useSkillsLabStore((s) => s.toggleDepartment)
  const setExpandedSkill = useSkillsLabStore((s) => s.setExpandedSkill)

  const recentSkills = useMemo(
    () =>
      [...skills]
        .filter((s) => s.addedAt)
        .sort(
          (a, b) =>
            new Date(b.addedAt!).getTime() - new Date(a.addedAt!).getTime()
        )
        .slice(0, 5),
    [skills]
  )

  const starredSkills = useMemo(
    () => skills.filter((s) => starredSkillIds.has(s.id)).slice(0, 5),
    [skills, starredSkillIds]
  )

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-lg">
      <Command className="rounded-xl">
        <CommandInput placeholder="Search skills, agents, departments..." />
        <CommandList className="max-h-96">
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Starred */}
          {starredSkills.length > 0 && (
            <CommandGroup heading="Starred">
              {starredSkills.map((skill) => (
                <CommandItem
                  key={`star-${skill.id}`}
                  onSelect={() => {
                    setExpandedSkill(skill.id)
                    onOpenChange(false)
                  }}
                >
                  <Star className="size-3.5 fill-current text-foreground/60" />
                  <span>{skill.displayName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {skill.department}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Recent */}
          {recentSkills.length > 0 && (
            <CommandGroup heading="Recent">
              {recentSkills.map((skill) => (
                <CommandItem
                  key={`recent-${skill.id}`}
                  onSelect={() => {
                    setExpandedSkill(skill.id)
                    onOpenChange(false)
                  }}
                >
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span>{skill.displayName}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {relativeTime(skill.addedAt)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* All skills */}
          <CommandGroup heading="Skills">
            {skills.map((skill) => (
              <CommandItem
                key={skill.id}
                value={`${skill.name} ${skill.displayName} ${skill.description} ${skill.department}`}
                onSelect={() => {
                  setExpandedSkill(skill.id)
                  onOpenChange(false)
                }}
              >
                <Package className="size-3.5 text-muted-foreground" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="truncate">{skill.displayName}</span>
                  {skill.description && (
                    <span className="text-xs text-muted-foreground truncate">
                      {skill.description}
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-[10px] ml-2 shrink-0">
                  {skill.department}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* Filter by source */}
          <CommandGroup heading="Filter by source">
            {sources.map((src) => (
              <CommandItem
                key={`src-${src.id}`}
                onSelect={() => {
                  setActiveSourceFilter(src.id)
                  onOpenChange(false)
                }}
              >
                <CircleDot
                  className="size-3.5"
                  style={{ color: src.color }}
                />
                <span>{src.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {src.skillCount} skills
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Filter by agent */}
          <CommandGroup heading="Filter by agent">
            {agents.map((agent) => (
              <CommandItem
                key={`agent-${agent.id}`}
                onSelect={() => {
                  setActiveAgentFilter(agent.id)
                  onOpenChange(false)
                }}
              >
                <span className="text-sm mr-0.5">{agent.emoji}</span>
                <span>{agent.label}</span>
                <span className="ml-auto text-xs font-mono text-muted-foreground">
                  {agent.role}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* Filter by department */}
          <CommandGroup heading="Filter by department">
            {departments.map((dept) => (
              <CommandItem
                key={`dept-${dept}`}
                onSelect={() => {
                  toggleDepartment(dept)
                  onOpenChange(false)
                }}
              >
                <FolderOpen className="size-3.5 text-muted-foreground" />
                <span>{dept}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  )
}

/* ======================================================================
   Subcomponent: Install Dialog
   ====================================================================== */
function InstallDialog() {
  const installFromZip = useSkillsLabStore((s) => s.installFromZip)
  const installFromCommand = useSkillsLabStore((s) => s.installFromCommand)
  const installBusy = useSkillsLabStore((s) => s.installBusy)
  const installError = useSkillsLabStore((s) => s.installError)
  const [open, setOpen] = useState(false)
  const [command, setCommand] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await installFromZip(file)
      setOpen(false)
    } catch {}
  }

  const handleCommandInstall = async () => {
    if (!command.trim()) return
    try {
      await installFromCommand(command.trim())
      setCommand('')
      setOpen(false)
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Download className="size-3.5 mr-1.5" />
            Install
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install Skill</DialogTitle>
          <DialogDescription>
            Install a new skill from a ZIP file or an npx command.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ZIP upload */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              From ZIP file
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              onChange={handleZipUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileRef.current?.click()}
              disabled={installBusy}
            >
              <Upload className="size-3.5 mr-1.5" />
              {installBusy ? 'Installing...' : 'Choose ZIP file'}
            </Button>
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              or
            </span>
          </div>

          {/* Command install */}
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              From command
            </Label>
            <div className="flex gap-2">
              <Input
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="npx @anthropic/install-skill ..."
                className="flex-1 font-mono text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCommandInstall()
                }}
              />
              <Button
                size="sm"
                onClick={handleCommandInstall}
                disabled={installBusy || !command.trim()}
              >
                <TerminalSquare className="size-3.5 mr-1" />
                Run
              </Button>
            </div>
          </div>

          {installError && (
            <p className="text-xs text-destructive">{installError}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ======================================================================
   Main component
   ====================================================================== */
export function ShadcnSkillsLab2() {
  const [isDark, setIsDark] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  // Store selectors
  const skills = useSkillsLabStore((s) => s.skills)
  const sources = useSkillsLabStore((s) => s.sources)
  const agents = useSkillsLabStore((s) => s.agents)
  const departments = useSkillsLabStore((s) => s.departments)
  const loading = useSkillsLabStore((s) => s.loading)
  const loaded = useSkillsLabStore((s) => s.loaded)
  const error = useSkillsLabStore((s) => s.error)
  const searchQuery = useSkillsLabStore((s) => s.searchQuery)
  const setSearchQuery = useSkillsLabStore((s) => s.setSearchQuery)
  const activeScope = useSkillsLabStore((s) => s.activeScope)
  const setActiveScope = useSkillsLabStore((s) => s.setActiveScope)
  const activeSavedView = useSkillsLabStore((s) => s.activeSavedView)
  const setActiveSavedView = useSkillsLabStore((s) => s.setActiveSavedView)
  const sortField = useSkillsLabStore((s) => s.sortField)
  const sortDir = useSkillsLabStore((s) => s.sortDir)
  const setSort = useSkillsLabStore((s) => s.setSort)
  const expandedSkillId = useSkillsLabStore((s) => s.expandedSkillId)
  const setExpandedSkill = useSkillsLabStore((s) => s.setExpandedSkill)
  const starredSkillIds = useSkillsLabStore((s) => s.starredSkillIds)
  const toggleStarSkill = useSkillsLabStore((s) => s.toggleStarSkill)
  const loadFromAPI = useSkillsLabStore((s) => s.loadFromAPI)
  const loadSkillContent = useSkillsLabStore((s) => s.loadSkillContent)
  const filtered = useSkillsLabStore((s) => s.filtered)
  const setActiveSourceFilter = useSkillsLabStore((s) => s.setActiveSourceFilter)
  const activeSourceFilter = useSkillsLabStore((s) => s.activeSourceFilter)
  const activeAgentFilter = useSkillsLabStore((s) => s.activeAgentFilter)
  const activeFamilyFilter = useSkillsLabStore((s) => s.activeFamilyFilter)
  const duplicateOnly = useSkillsLabStore((s) => s.duplicateOnly)
  const activeDepartments = useSkillsLabStore((s) => s.activeDepartments)

  // Load data
  useEffect(() => {
    loadFromAPI()
  }, [loadFromAPI])

  // Keyboard shortcut: Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const filteredSkills = filtered()
  const expandedSkill = expandedSkillId
    ? skills.find((s) => s.id === expandedSkillId) ?? null
    : null

  // Auto-load content when skill is expanded
  useEffect(() => {
    if (expandedSkill?.previewPath) {
      loadSkillContent(expandedSkill.id, expandedSkill.previewPath)
    }
  }, [expandedSkill?.id, expandedSkill?.previewPath, loadSkillContent])

  const hasActiveFilters =
    !!activeSourceFilter ||
    !!activeAgentFilter ||
    !!activeFamilyFilter ||
    duplicateOnly ||
    activeDepartments.size > 0

  const handleRowClick = useCallback(
    (skill: UnifiedSkill) => {
      setExpandedSkill(skill.id)
    },
    [setExpandedSkill]
  )

  return (
    <div
      className={cn(
        'shadcn-theme-2 flex flex-col h-full w-full overflow-hidden font-sans',
        isDark && 'dark'
      )}
    >
      <TooltipProvider>
        <div className="flex flex-1 flex-col overflow-hidden bg-background text-foreground">
          {/* ======== Top Bar ======== */}
          <header className="flex items-center justify-between border-b px-6 py-3">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold tracking-tight">
                Skills Lab
              </h1>
              <Badge variant="secondary" className="font-mono text-[11px]">
                {skills.length}
              </Badge>
            </div>

            {/* Center: Command palette trigger */}
            <button
              onClick={() => setCmdOpen(true)}
              className="hidden md:flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="size-3.5" />
              <span>Search skills...</span>
              <kbd className="ml-4 inline-flex h-5 items-center rounded border bg-background px-1.5 text-[10px] font-mono text-muted-foreground">
                {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl+'}K
              </kbd>
            </button>

            <div className="flex items-center gap-3">
              <InstallDialog />

              <Separator orientation="vertical" className="h-5" />

              {/* Dark mode toggle */}
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

          {/* ======== Loading / Error states ======== */}
          {loading && !loaded && (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center space-y-2">
                <div className="h-5 w-5 mx-auto border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Loading skills index...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="xs"
                className="mt-2"
                onClick={() => loadFromAPI(true)}
              >
                Retry
              </Button>
            </div>
          )}

          {/* ======== Main Content ======== */}
          {loaded && (
            <div className="flex flex-1 overflow-hidden">
              {/* Left: Table area */}
              <div className="flex flex-1 flex-col overflow-hidden">
                {/* Filter Bar */}
                <div className="border-b px-6 py-3 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Scope tabs */}
                    <Tabs
                      value={activeScope}
                      onValueChange={(v) =>
                        setActiveScope(v as 'all' | 'claude')
                      }
                    >
                      <TabsList variant="line" className="h-7">
                        <TabsTrigger value="all" className="text-xs px-2">
                          All
                        </TabsTrigger>
                        <TabsTrigger value="claude" className="text-xs px-2">
                          Claude
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <Separator orientation="vertical" className="h-5" />

                    {/* Saved view tabs */}
                    <Tabs
                      value={activeSavedView}
                      onValueChange={(v) =>
                        setActiveSavedView(
                          v as 'all' | 'starred' | 'recent'
                        )
                      }
                    >
                      <TabsList variant="line" className="h-7">
                        <TabsTrigger value="all" className="text-xs px-2">
                          <List className="size-3 mr-1" />
                          All
                        </TabsTrigger>
                        <TabsTrigger value="starred" className="text-xs px-2">
                          <Star className="size-3 mr-1" />
                          Starred
                        </TabsTrigger>
                        <TabsTrigger value="recent" className="text-xs px-2">
                          <Clock className="size-3 mr-1" />
                          Recent
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    <div className="flex-1" />

                    {/* Quick search (inline) */}
                    <div className="relative w-52 md:hidden">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter..."
                        className="pl-8 h-7 text-xs"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>

                    {/* Source filter dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="xs" className="gap-1">
                            <Filter className="size-3" />
                            Filters
                            {hasActiveFilters && (
                              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                                {[
                                  activeSourceFilter,
                                  activeAgentFilter,
                                  activeFamilyFilter,
                                  duplicateOnly,
                                  ...activeDepartments,
                                ].filter(Boolean).length}
                              </span>
                            )}
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Sources</DropdownMenuLabel>
                        {sources.map((src) => (
                          <DropdownMenuItem
                            key={src.id}
                            onSelect={() => setActiveSourceFilter(src.id)}
                          >
                            <span
                              className="block h-2.5 w-2.5 rounded-full mr-1"
                              style={{ backgroundColor: src.color }}
                            />
                            {src.label}
                            <span className="ml-auto text-xs text-muted-foreground">
                              {src.skillCount}
                            </span>
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Agents</DropdownMenuLabel>
                        {agents.map((agent) => (
                          <DropdownMenuItem
                            key={agent.id}
                            onSelect={() =>
                              useSkillsLabStore
                                .getState()
                                .setActiveAgentFilter(agent.id)
                            }
                          >
                            <span className="mr-1">{agent.emoji}</span>
                            {agent.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Departments</DropdownMenuLabel>
                        {departments.map((dept) => (
                          <DropdownMenuItem
                            key={dept}
                            onSelect={() =>
                              useSkillsLabStore
                                .getState()
                                .toggleDepartment(dept)
                            }
                          >
                            {activeDepartments.has(dept) && (
                              <span className="text-foreground mr-1">
                                &#10003;
                              </span>
                            )}
                            {dept}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() =>
                            useSkillsLabStore
                              .getState()
                              .toggleDuplicateOnly()
                          }
                        >
                          {duplicateOnly && (
                            <span className="text-foreground mr-1">
                              &#10003;
                            </span>
                          )}
                          Duplicates only
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="xs" className="gap-1">
                            <ArrowUpDown className="size-3" />
                            Sort
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setSort('name')}>
                          {sortField === 'name' && (
                            <span className="mr-1">
                              {sortDir === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                          Name
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setSort('department')}
                        >
                          {sortField === 'department' && (
                            <span className="mr-1">
                              {sortDir === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                          Department
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Active filter chips */}
                  <ActiveFiltersBar />
                </div>

                {/* Table */}
                <ScrollArea className="flex-1">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10" />
                        <SortableHeader
                          label="Name"
                          field="name"
                          currentField={sortField}
                          currentDir={sortDir}
                          onSort={setSort}
                        />
                        <SortableHeader
                          label="Department"
                          field="department"
                          currentField={sortField}
                          currentDir={sortDir}
                          onSort={setSort}
                        />
                        <TableHead>
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Sources
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Agents
                          </span>
                        </TableHead>
                        <TableHead>
                          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Added
                          </span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSkills.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="h-40 text-center"
                          >
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Package className="size-8 opacity-30" />
                              <p className="text-sm">No skills found</p>
                              <p className="text-xs">
                                Try adjusting your filters or search query
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSkills.map((skill) => {
                          const isSelected =
                            expandedSkillId === skill.id
                          const isStarred = starredSkillIds.has(skill.id)

                          return (
                            <TableRow
                              key={skill.id}
                              data-state={
                                isSelected ? 'selected' : undefined
                              }
                              className={cn(
                                'cursor-pointer transition-colors',
                                isSelected &&
                                  'bg-muted/60 border-l-2 border-l-foreground'
                              )}
                              onClick={() => handleRowClick(skill)}
                            >
                              {/* Star */}
                              <TableCell className="w-10 pr-0">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleStarSkill(skill.id)
                                  }}
                                  className={cn(
                                    'rounded-sm p-1 transition-colors',
                                    isStarred
                                      ? 'text-foreground'
                                      : 'text-muted-foreground/40 hover:text-muted-foreground'
                                  )}
                                >
                                  <Star
                                    className={cn(
                                      'size-3.5',
                                      isStarred && 'fill-current'
                                    )}
                                  />
                                </button>
                              </TableCell>

                              {/* Name */}
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">
                                    {skill.displayName}
                                  </span>
                                  {skill.description && (
                                    <span className="text-xs text-muted-foreground truncate max-w-xs">
                                      {skill.description}
                                    </span>
                                  )}
                                </div>
                              </TableCell>

                              {/* Department */}
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono"
                                >
                                  {skill.department}
                                </Badge>
                              </TableCell>

                              {/* Sources */}
                              <TableCell>
                                <PresenceDots
                                  skill={skill}
                                  sources={sources}
                                />
                              </TableCell>

                              {/* Agents count */}
                              <TableCell>
                                {skill.installedAgentIds.length > 0 ? (
                                  <div className="flex items-center gap-1">
                                    <Bot className="size-3 text-muted-foreground" />
                                    <span className="text-xs font-mono">
                                      {skill.installedAgentIds.length}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground/40">
                                    --
                                  </span>
                                )}
                              </TableCell>

                              {/* Added */}
                              <TableCell>
                                <span className="text-xs text-muted-foreground">
                                  {relativeTime(skill.addedAt)}
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>

                  {/* Bottom summary */}
                  {filteredSkills.length > 0 && (
                    <div className="border-t px-6 py-3 text-xs text-muted-foreground">
                      Showing {filteredSkills.length} of {skills.length} skills
                      {searchQuery && (
                        <span>
                          {' '}
                          matching &ldquo;
                          <span className="font-medium text-foreground">
                            {searchQuery}
                          </span>
                          &rdquo;
                        </span>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Right: Detail sidebar */}
              {expandedSkill && (
                <div className="w-[380px] shrink-0 overflow-hidden">
                  <DetailSidebar
                    skill={expandedSkill}
                    onClose={() => setExpandedSkill(null)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Command Palette */}
          <SkillCommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
        </div>
      </TooltipProvider>
    </div>
  )
}
