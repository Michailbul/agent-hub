import { create } from 'zustand'
import type { FilterSource } from '@/types'

interface UIStore {
  filter: FilterSource
  showSaved: boolean
  toastMsg: string
  toastType: string
  toastKey: number
  setFilter: (f: FilterSource) => void
  flashSaved: () => void
  toast: (msg: string, type?: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  filter: 'all',
  showSaved: false,
  toastMsg: '',
  toastType: '',
  toastKey: 0,

  setFilter: (f) => set({ filter: f }),

  flashSaved: () => {
    set({ showSaved: true })
    setTimeout(() => set({ showSaved: false }), 2000)
  },

  toast: (msg, type = '') => {
    set(s => ({ toastMsg: msg, toastType: type, toastKey: s.toastKey + 1 }))
  },
}))
