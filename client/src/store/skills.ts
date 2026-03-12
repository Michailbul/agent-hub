import { create } from 'zustand'

export interface IndexVariant {
  sourceId: string
  sourceLabel: string
  ecosystem: string
  kind: string
  path: string
  previewPath: string
  label: string
  directoryName: string
  frontmatter: Record<string, string>
  summary: string
  sourceRank: number
  folder: string | null
  isSymlink: boolean
}

export interface IndexSkill {
  id: string
  name: string
  summary: string
  variants: IndexVariant[]
  installedAgentIds: string[]
  missingAgentIds: string[]
  isInMaster: boolean
  grouping: { department: string; purpose: string; confidence: number }
}

export interface SkillsRepoEntry {
  id: string
  name: string
  path: string
  skillsRoot: string
  description: string
  isGitRepo: boolean
  linkedAt: string
  skillCount?: number
  exists?: boolean
  gitBranch?: string | null
  gitDirty?: boolean
}

export interface IndexSource {
  id: string
  label: string
  ecosystem: string
  root: string
  kind: string
}

export interface IndexAgent {
  id: string
  label: string
  emoji: string
  role: string
  skillsRoot: string
}

export interface IndexFolder {
  name: string
  root: string
  sourceId: string
}

interface SkillsStore {
  skills: IndexSkill[]
  sources: IndexSource[]
  agents: IndexAgent[]
  folders: IndexFolder[]
  repos: SkillsRepoEntry[]
  syncFilter: 'all' | 'unsynced'
  loading: boolean
  error: string | null

  selectedSkillId: string | null
  activeSourceId: string | null
  searchQuery: string
  expandedFolders: Set<string>

  editingContent: string | null
  editingPath: string | null
  editingDirty: boolean
  renamingSkillId: string | null

  draggedSkill: { id: string; variantPath: string } | null
  dropTargetAgentId: string | null
  dropTargetFolder: string | null

  loadSkills: () => Promise<void>
  loadRepos: () => Promise<void>
  linkRepo: (name: string, repoPath: string, description?: string) => Promise<void>
  unlinkRepo: (id: string) => Promise<void>
  pullRepo: (id: string) => Promise<string>
  promoteSkill: (variantPath: string) => Promise<void>
  setSyncFilter: (filter: 'all' | 'unsynced') => void

  selectSkill: (id: string | null) => void
  setActiveSource: (sourceId: string | null) => void
  setSearchQuery: (q: string) => void
  toggleFolder: (folderName: string) => void

  loadSkillContent: (path: string) => Promise<void>
  setEditingContent: (content: string) => void
  saveSkillContent: () => Promise<void>

  assignSkill: (agentId: string, variantPath: string) => Promise<void>
  unassignSkill: (agentId: string, skillId: string) => Promise<void>
  deleteSkill: (src: string) => Promise<void>
  renameSkill: (src: string, newName: string) => Promise<void>
  moveSkillToFolder: (skillPath: string, destDir: string) => Promise<void>
  createFolder: (root: string, name: string) => Promise<void>

  setDraggedSkill: (skill: { id: string; variantPath: string } | null) => void
  setDropTargetAgent: (agentId: string | null) => void
  setDropTargetFolder: (folder: string | null) => void
  setRenamingSkill: (skillId: string | null) => void
}

export const useSkillsStore = create<SkillsStore>((set, get) => ({
  skills: [],
  sources: [],
  agents: [],
  folders: [],
  repos: [],
  syncFilter: 'all',
  loading: false,
  error: null,

  selectedSkillId: null,
  activeSourceId: null,
  searchQuery: '',
  expandedFolders: new Set<string>(),

  editingContent: null,
  editingPath: null,
  editingDirty: false,
  renamingSkillId: null,

  draggedSkill: null,
  dropTargetAgentId: null,
  dropTargetFolder: null,

  loadSkills: async () => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/skills/index')
      if (!res.ok) throw new Error('Failed to load skills')
      const data = await res.json()
      const skills: IndexSkill[] = data.skills || []
      const folders: IndexFolder[] = data.folders || []
      // Auto-expand all folders on first load
      const { expandedFolders: prev } = get()
      const expanded = prev.size > 0 ? prev : new Set(folders.map(f => f.name))
      set({
        skills,
        sources: data.sources || [],
        agents: data.agents || [],
        folders,
        expandedFolders: expanded,
        loading: false,
      })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Unknown error', loading: false })
    }
  },

  loadRepos: async () => {
    try {
      const res = await fetch('/api/skills-repos/config')
      if (!res.ok) return
      const data = await res.json()
      set({ repos: data.repos || [] })
    } catch { /* ignore */ }
  },

  linkRepo: async (name, repoPath, description) => {
    const res = await fetch('/api/skills-repos/link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, path: repoPath, description }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Link failed')
    }
    await get().loadRepos()
    await get().loadSkills()
  },

  unlinkRepo: async (id) => {
    const res = await fetch(`/api/skills-repos/unlink/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Unlink failed')
    await get().loadRepos()
    await get().loadSkills()
  },

  pullRepo: async (id) => {
    const res = await fetch(`/api/skills-repos/pull/${id}`, { method: 'POST' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Pull failed')
    }
    const data = await res.json()
    await get().loadRepos()
    await get().loadSkills()
    return data.output || 'Done'
  },

  promoteSkill: async (variantPath) => {
    const res = await fetch('/api/skills/promote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantPath }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Promote failed')
    }
    await get().loadSkills()
  },

  setSyncFilter: (filter) => set({ syncFilter: filter }),

  selectSkill: (id) => {
    const { skills } = get()
    set({ selectedSkillId: id, editingContent: null, editingPath: null, editingDirty: false })
    if (id) {
      const skill = skills.find(s => s.id === id)
      if (skill?.variants[0]?.path) {
        get().loadSkillContent(skill.variants[0].path)
      }
    }
  },

  setActiveSource: (sourceId) => set({ activeSourceId: sourceId }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  toggleFolder: (folderName) => set(s => {
    const next = new Set(s.expandedFolders)
    if (next.has(folderName)) next.delete(folderName)
    else next.add(folderName)
    return { expandedFolders: next }
  }),

  loadSkillContent: async (skillPath) => {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(skillPath)}`)
      if (!res.ok) throw new Error('Failed to load skill content')
      const data = await res.json()
      set({ editingContent: data.content || '', editingPath: skillPath, editingDirty: false })
    } catch {
      set({ editingContent: null, editingPath: null })
    }
  },

  setEditingContent: (content) => set({ editingContent: content, editingDirty: true }),

  saveSkillContent: async () => {
    const { editingPath, editingContent } = get()
    if (!editingPath || editingContent === null) return
    const res = await fetch('/api/file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: editingPath, content: editingContent }),
    })
    if (!res.ok) throw new Error('Save failed')
    set({ editingDirty: false })
    await get().loadSkills()
  },

  assignSkill: async (agentId, variantPath) => {
    const res = await fetch('/api/skills/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, variantPath }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Assign failed')
    }
    await get().loadSkills()
  },

  unassignSkill: async (agentId, skillId) => {
    const res = await fetch('/api/skills/unassign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, skillId }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Unassign failed')
    }
    await get().loadSkills()
  },

  deleteSkill: async (src) => {
    const res = await fetch('/api/skill/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src }),
    })
    if (!res.ok) throw new Error('Delete failed')
    const { selectedSkillId, skills } = get()
    const deleted = skills.find(s => s.variants.some(v => v.path === src))
    if (deleted && selectedSkillId === deleted.id) {
      set({ selectedSkillId: null, editingContent: null, editingPath: null })
    }
    await get().loadSkills()
  },

  renameSkill: async (src, newName) => {
    const res = await fetch('/api/skill/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src, newName }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Rename failed')
    }
    await get().loadSkills()
  },

  moveSkillToFolder: async (skillPath, destDir) => {
    const res = await fetch('/api/skill/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ src: skillPath, destDir }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Move failed')
    }
    await get().loadSkills()
  },

  createFolder: async (root, name) => {
    const res = await fetch('/api/skills/folder/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ root, name }),
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Create folder failed')
    }
    // Auto-expand the new folder
    const slugName = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    set(s => ({ expandedFolders: new Set([...s.expandedFolders, slugName]) }))
    await get().loadSkills()
  },

  setDraggedSkill: (skill) => set({ draggedSkill: skill }),
  setDropTargetAgent: (agentId) => set({ dropTargetAgentId: agentId }),
  setDropTargetFolder: (folder) => set({ dropTargetFolder: folder }),
  setRenamingSkill: (skillId) => set({ renamingSkillId: skillId }),
}))
