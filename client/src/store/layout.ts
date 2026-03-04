import { create } from 'zustand'

const LIST_WIDTH_KEY = 'agentHub.crons.listWidth'
const SKILLS_WIDTH_KEY = 'agentHub.crons.skillsWidth'

function readWidth(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback
  const raw = window.localStorage.getItem(key)
  const parsed = raw ? Number(raw) : Number.NaN
  return Number.isFinite(parsed) ? parsed : fallback
}

interface LayoutStore {
  cronsListWidth: number
  cronsSkillsWidth: number
  setCronsListWidth: (px: number) => void
  setCronsSkillsWidth: (px: number) => void
  hydrateFromStorage: () => void
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  cronsListWidth: readWidth(LIST_WIDTH_KEY, 220),
  cronsSkillsWidth: readWidth(SKILLS_WIDTH_KEY, 360),

  setCronsListWidth: (px) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LIST_WIDTH_KEY, String(px))
    }
    set({ cronsListWidth: px })
  },

  setCronsSkillsWidth: (px) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SKILLS_WIDTH_KEY, String(px))
    }
    set({ cronsSkillsWidth: px })
  },

  hydrateFromStorage: () => {
    set({
      cronsListWidth: readWidth(LIST_WIDTH_KEY, 220),
      cronsSkillsWidth: readWidth(SKILLS_WIDTH_KEY, 360),
    })
  },
}))
