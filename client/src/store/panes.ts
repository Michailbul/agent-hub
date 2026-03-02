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
  openFileInPane: (paneId: string, path: string, label: string, content: string) => void
  insertPaneAfter: (afterId: string, path?: string | null, label?: string | null, content?: string) => string | null
}

export const usePanesStore = create<PanesStore>((set, get) => ({
  panes: [],
  activePaneId: null,

  addPane: (path = null, label = null, content = '', isLocal = false) => {
    const { panes } = get()
    if (panes.length >= 4) return ''
    const id = 'pane-' + (++paneCounter)
    const pane: PaneState = { id, path, label, content, isDirty: false, isLocal }
    set({ panes: [...panes, pane], activePaneId: id })
    return id
  },

  closePane: (id: string) => {
    const { panes, activePaneId } = get()
    const next = panes.filter(p => p.id !== id)
    if (next.length === 0) {
      const newId = 'pane-' + (++paneCounter)
      set({
        panes: [{ id: newId, path: null, label: null, content: '', isDirty: false, isLocal: false }],
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

  openFileInPane: (paneId: string, path: string, label: string, content: string) =>
    set(s => ({
      panes: s.panes.map(p =>
        p.id === paneId ? { ...p, path, label, content, isDirty: false, isLocal: false } : p,
      ),
      activePaneId: paneId,
    })),

  insertPaneAfter: (afterId: string, path = null, label = null, content = '') => {
    const { panes } = get()
    if (panes.length >= 4) return null
    const idx = panes.findIndex(p => p.id === afterId)
    if (idx === -1) return null
    const id = 'pane-' + (++paneCounter)
    const pane: PaneState = { id, path, label, content, isDirty: false, isLocal: false }
    const next = [...panes]
    next.splice(idx + 1, 0, pane)
    set({ panes: next, activePaneId: id })
    return id
  },
}))
