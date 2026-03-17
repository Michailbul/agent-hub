import { create } from 'zustand'

type Theme = 'light' | 'dark'

interface ThemeStore {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'

  // Migrate from old SkillsLab-scoped key
  const oldKey = 'skills-lab-v2-theme'
  const newKey = 'app-theme'
  const oldVal = localStorage.getItem(oldKey)
  if (oldVal && !localStorage.getItem(newKey)) {
    localStorage.setItem(newKey, oldVal)
    localStorage.removeItem(oldKey)
  }

  const stored = localStorage.getItem(newKey)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t)
  localStorage.setItem('app-theme', t)
}

const initial = getInitialTheme()
applyTheme(initial)

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initial,
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return { theme: next }
    }),
  setTheme: (t) => {
    applyTheme(t)
    set({ theme: t })
  },
}))
