import { create } from 'zustand'
import type { HQSource, HQFileNode } from '@/types/hq'
import {
  browseHQDirectories,
  fetchHQConfig,
  fetchHQTree,
  linkHQFolder,
  unlinkHQFolder,
  fetchFile,
  saveFile,
} from '@/lib/api'

interface HQBrowseEntry {
  name: string
  path: string
  isDir: boolean
}

interface HQStore {
  /* data */
  sources: HQSource[]
  activeSourceId: string | null
  fileTree: HQFileNode[]
  activeFilePath: string | null
  fileContent: string
  isDirty: boolean
  loading: boolean
  treeLoading: boolean
  drawerOpen: boolean
  expandedFolders: Set<string>

  /* link folder dialog */
  linkDialogOpen: boolean
  linkForm: { name: string; path: string; description: string }
  pickingFolder: boolean
  browsePathOpen: boolean
  browseCurrentPath: string | null
  browseParentPath: string | null
  browseEntries: HQBrowseEntry[]
  browseError: string | null

  /* actions */
  loadConfig: () => Promise<void>
  setActiveSource: (id: string) => Promise<void>
  setActiveFile: (path: string | null) => void
  loadFile: (path: string) => Promise<void>
  setFileContent: (content: string) => void
  save: () => Promise<void>
  toggleDrawer: () => void
  toggleFolder: (path: string) => void

  /* link/unlink */
  openLinkDialog: () => void
  closeLinkDialog: () => void
  setLinkForm: (partial: Partial<HQStore['linkForm']>) => void
  pickFolder: () => Promise<void>
  pickNativeFolder: () => Promise<void>
  browseToPath: (path?: string | null) => Promise<void>
  chooseBrowsedPath: (path: string) => void
  closePathBrowser: () => void
  submitLink: () => Promise<void>
  unlinkSource: (id: string) => Promise<void>
}

export const useHQStore = create<HQStore>((set, get) => ({
  sources: [],
  activeSourceId: null,
  fileTree: [],
  activeFilePath: null,
  fileContent: '',
  isDirty: false,
  loading: false,
  treeLoading: false,
  drawerOpen: true,
  expandedFolders: new Set<string>(),

  linkDialogOpen: false,
  linkForm: { name: '', path: '', description: '' },
  pickingFolder: false,
  browsePathOpen: false,
  browseCurrentPath: null,
  browseParentPath: null,
  browseEntries: [],
  browseError: null,

  loadConfig: async () => {
    set({ loading: true })
    try {
      const { sources } = await fetchHQConfig()
      set({ sources, loading: false })
      // Auto-select first source if none active
      const { activeSourceId } = get()
      if (!activeSourceId && sources.length > 0) {
        await get().setActiveSource(sources[0].id)
      }
    } catch {
      set({ loading: false })
    }
  },

  setActiveSource: async (id) => {
    const source = get().sources.find(s => s.id === id)
    if (!source) return
    set({
      activeSourceId: id,
      fileTree: [],
      activeFilePath: null,
      fileContent: '',
      isDirty: false,
      expandedFolders: new Set<string>(),
      treeLoading: true,
    })
    try {
      const { files } = await fetchHQTree(source.path)
      set({ fileTree: files, treeLoading: false })
    } catch {
      set({ treeLoading: false })
    }
  },

  setActiveFile: (path) => {
    if (!path) {
      set({ activeFilePath: null, fileContent: '', isDirty: false })
      return
    }
    get().loadFile(path)
  },

  loadFile: async (filePath) => {
    set({ activeFilePath: filePath, fileContent: '', isDirty: false })
    try {
      const content = await fetchFile(filePath)
      set({ fileContent: content })
    } catch {
      set({ fileContent: '# Error\n\nCould not load file.' })
    }
  },

  setFileContent: (content) => set({ fileContent: content, isDirty: true }),

  save: async () => {
    const { activeFilePath, fileContent } = get()
    if (!activeFilePath) return
    try {
      await saveFile(activeFilePath, fileContent)
      set({ isDirty: false })
    } catch {
      // toast would go here
    }
  },

  toggleDrawer: () => set(s => ({ drawerOpen: !s.drawerOpen })),

  toggleFolder: (path) => set(s => {
    const next = new Set(s.expandedFolders)
    next.has(path) ? next.delete(path) : next.add(path)
    return { expandedFolders: next }
  }),

  /* Link dialog */
  openLinkDialog: () => set({
    linkDialogOpen: true,
    linkForm: { name: '', path: '', description: '' },
    pickingFolder: false,
    browsePathOpen: false,
    browseCurrentPath: null,
    browseParentPath: null,
    browseEntries: [],
    browseError: null,
  }),
  closeLinkDialog: () => set({
    linkDialogOpen: false,
    browsePathOpen: false,
    browseCurrentPath: null,
    browseParentPath: null,
    browseEntries: [],
    browseError: null,
  }),
  setLinkForm: (partial) => set(s => ({ linkForm: { ...s.linkForm, ...partial } })),

  pickFolder: async () => {
    const initialPath = get().linkForm.path.trim() || null
    await get().browseToPath(initialPath)
  },

  pickNativeFolder: async () => {
    set({ pickingFolder: true })
    try {
      const r = await fetch('/api/hq/pick-folder')
      if (!r.ok) {
        set({ pickingFolder: false })
        return
      }
      const data = await r.json()
      if (data.path) {
        const name = data.path.split('/').pop() || ''
        set(s => ({
          pickingFolder: false,
          browsePathOpen: false,
          linkForm: { ...s.linkForm, path: data.path, name: s.linkForm.name || name },
        }))
      } else {
        set({ pickingFolder: false })
      }
    } catch {
      set({ pickingFolder: false })
    }
  },

  browseToPath: async (folderPath = null) => {
    set({ pickingFolder: true, browsePathOpen: true, browseError: null })
    try {
      const { currentPath, parentPath, entries } = await browseHQDirectories(folderPath)
      set({
        pickingFolder: false,
        browsePathOpen: true,
        browseCurrentPath: currentPath,
        browseParentPath: parentPath,
        browseEntries: Array.isArray(entries) ? entries.filter(entry => entry.isDir) : [],
        browseError: null,
      })
    } catch (error) {
      if (folderPath) {
        await get().browseToPath(null)
        return
      }
      set({
        pickingFolder: false,
        browsePathOpen: true,
        browseCurrentPath: null,
        browseParentPath: null,
        browseEntries: [],
        browseError: error instanceof Error ? error.message : 'Could not browse folders',
      })
    }
  },

  chooseBrowsedPath: (folderPath) => {
    const name = folderPath.split('/').filter(Boolean).pop() || 'HQ'
    set(s => ({
      browsePathOpen: false,
      browseCurrentPath: null,
      browseParentPath: null,
      browseEntries: [],
      browseError: null,
      linkForm: {
        ...s.linkForm,
        path: folderPath,
        name: s.linkForm.name || name,
      },
    }))
  },

  closePathBrowser: () => set({
    browsePathOpen: false,
    browseCurrentPath: null,
    browseParentPath: null,
    browseEntries: [],
    browseError: null,
  }),

  submitLink: async () => {
    const { linkForm } = get()
    if (!linkForm.name || !linkForm.path) return
    const id = linkForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    try {
      await linkHQFolder({
        id,
        name: linkForm.name,
        path: linkForm.path,
        description: linkForm.description,
        icon: '📁',
        color: '#7a5c2e',
      })
      set({ linkDialogOpen: false })
      await get().loadConfig()
    } catch {
      // error handling
    }
  },

  unlinkSource: async (id) => {
    try {
      await unlinkHQFolder(id)
      const { activeSourceId } = get()
      if (activeSourceId === id) {
        set({ activeSourceId: null, fileTree: [], activeFilePath: null, fileContent: '' })
      }
      await get().loadConfig()
    } catch {
      // error handling
    }
  },
}))
