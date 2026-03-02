import { create } from 'zustand'
import * as api from '@/lib/api'

interface AuthStore {
  isAuthenticated: boolean
  isChecking: boolean
  check: () => Promise<void>
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isChecking: true,

  check: async () => {
    try {
      const r = await fetch('/api/tree')
      set({ isAuthenticated: r.ok, isChecking: false })
    } catch {
      set({ isAuthenticated: false, isChecking: false })
    }
  },

  login: async (password: string) => {
    const ok = await api.login(password)
    if (ok) set({ isAuthenticated: true })
    return ok
  },

  logout: async () => {
    await api.logout()
    set({ isAuthenticated: false })
  },
}))
