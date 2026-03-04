import { create } from 'zustand'
import type { PaneState } from '@/types'

let paneCounter = 0

interface PanesStore {
  panes: PaneState[]
  activePaneId: string | null
  addPane: (path?: string | null, label?: string | null, content?: string, isLocal?: boolean) => string
  closePane: (id: string) => void
  setActivePane: (id: string) => void
  updateContent: (id: string, content: string) => void
  setDirty: (id: string, dirty: boolean) => void
  setLoading: (id: string, loading: boolean) => void
  openFileInPane: (paneId: string, path: string, label: string, content: string) => void
  insertPaneAfter: (afterId: string, path?: string | null, label?: string | null, content?: string) => string | null
  insertPaneAt: (index: number, path?: string | null, label?: string | null, content?: string) => string | null
  reorderPane: (fromId: string, toId: string) => void
  setMdMode: (id: string, mode: 'rich' | 'markdown') => void
}

function shouldUseRichMode(path: string | null, label: string | null): boolean {
  const candidate = (path || label || '').toLowerCase().trim()
  return candidate.endsWith('.md') || candidate.endsWith('.markdown')
}

export const usePanesStore = create<PanesStore>((set, get) => ({
  panes: [],
  activePaneId: null,

  addPane: (path = null, label = null, content = '', isLocal = false) => {
    const { panes } = get()
    if (panes.length >= 4) return ''
    const id = 'pane-' + (++paneCounter)
    const pane: PaneState = {
      id,
      path,
      label,
      content,
      isDirty: false,
      isLocal,
      isLoading: false,
      mdMode: shouldUseRichMode(path, label) ? 'rich' : 'markdown',
    }
    set({ panes: [...panes, pane], activePaneId: id })
    return id
  },

  closePane: (id: string) => {
    const { panes, activePaneId } = get()
    const next = panes.filter(p => p.id !== id)
    if (next.length === 0) {
      const newId = 'pane-' + (++paneCounter)
      set({
        panes: [{
          id: newId,
          path: null,
          label: null,
          content: '',
          isDirty: false,
          isLocal: false,
          isLoading: false,
          mdMode: 'markdown',
        }],
        activePaneId: newId,
      })
      return
    }
    set({
      panes: next,
      activePaneId: activePaneId === id ? next[0].id : activePaneId,
    })
  },

  setActivePane: (id: string) => set({ activePaneId: id }),

  updateContent: (id: string, content: string) =>
    set(s => ({
      panes: s.panes.map(p => (p.id === id ? { ...p, content, isDirty: true } : p)),
    })),

  setDirty: (id: string, dirty: boolean) =>
    set(s => ({
      panes: s.panes.map(p => (p.id === id ? { ...p, isDirty: dirty } : p)),
    })),

  setLoading: (id: string, loading: boolean) =>
    set(s => ({
      panes: s.panes.map(p => (p.id === id ? { ...p, isLoading: loading } : p)),
    })),

  openFileInPane: (paneId: string, path: string, label: string, content: string) =>
    set(s => ({
      panes: s.panes.map(p =>
        p.id === paneId
          ? {
              ...p,
              path,
              label,
              content,
              isDirty: false,
              isLocal: false,
              isLoading: false,
              mdMode: shouldUseRichMode(path, label) ? 'rich' : 'markdown',
            }
          : p,
      ),
      activePaneId: paneId,
    })),

  insertPaneAfter: (afterId: string, path = null, label = null, content = '') => {
    const { panes } = get()
    if (panes.length >= 4) return null
    const idx = panes.findIndex(p => p.id === afterId)
    if (idx === -1) return null
    const id = 'pane-' + (++paneCounter)
    const pane: PaneState = {
      id,
      path,
      label,
      content,
      isDirty: false,
      isLocal: false,
      isLoading: false,
      mdMode: shouldUseRichMode(path, label) ? 'rich' : 'markdown',
    }
    const next = [...panes]
    next.splice(idx + 1, 0, pane)
    set({ panes: next, activePaneId: id })
    return id
  },

  insertPaneAt: (index: number, path = null, label = null, content = '') => {
    const { panes } = get()
    if (panes.length >= 4) return null
    const normalizedIndex = Math.max(0, Math.min(index, panes.length))
    const id = 'pane-' + (++paneCounter)
    const pane: PaneState = {
      id,
      path,
      label,
      content,
      isDirty: false,
      isLocal: false,
      isLoading: false,
      mdMode: shouldUseRichMode(path, label) ? 'rich' : 'markdown',
    }
    const next = [...panes]
    next.splice(normalizedIndex, 0, pane)
    set({ panes: next, activePaneId: id })
    return id
  },

  reorderPane: (fromId: string, toId: string) =>
    set(s => {
      const panes = [...s.panes]
      const fromIdx = panes.findIndex(p => p.id === fromId)
      const toIdx = panes.findIndex(p => p.id === toId)
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return s
      const [moved] = panes.splice(fromIdx, 1)
      panes.splice(toIdx, 0, moved)
      return { panes }
    }),

  setMdMode: (id: string, mode: 'rich' | 'markdown') =>
    set(s => ({
      panes: s.panes.map(p => (p.id === id ? { ...p, mdMode: mode } : p)),
    })),
}))
