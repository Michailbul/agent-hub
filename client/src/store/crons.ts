import { create } from 'zustand'
import { useUIStore } from '@/store/ui'
import type { CronJob } from '@/types/cron'

function defaultNewJob(): Partial<CronJob> {
  return {
    name: 'new-cron-job',
    enabled: true,
    schedule: { kind: 'cron', expr: '0 9 * * *', tz: 'UTC' },
    sessionTarget: 'isolated',
    wakeMode: 'now',
    payload: {
      kind: 'agentTurn',
      message: 'Describe what this cron should do.',
      timeoutSeconds: 300,
    },
    delivery: { mode: 'announce' },
  }
}

function notify(msg: string, type: 'success' | 'error' = 'error') {
  useUIStore.getState().toast(msg, type)
}

interface CronsStore {
  jobs: CronJob[]
  loading: boolean
  openJobIds: string[]
  activeJobId: string | null
  loadJobs: () => Promise<void>
  createJob: () => Promise<void>
  saveJob: (updated: CronJob) => Promise<void>
  deleteJob: (id: string) => Promise<void>
  toggleJobEnabled: (job: CronJob) => Promise<void>
  openJob: (id: string) => void
  closeJob: (id: string) => void
  setActiveJobId: (id: string | null) => void
}

export const useCronsStore = create<CronsStore>((set) => ({
  jobs: [],
  loading: true,
  openJobIds: [],
  activeJobId: null,

  loadJobs: async () => {
    set({ loading: true })
    try {
      const response = await fetch('/api/crons')
      if (!response.ok) throw new Error('failed')
      const data = await response.json()
      const nextJobs = (data.jobs || []) as CronJob[]

      set(state => {
        const validOpen = state.openJobIds.filter(id => nextJobs.some(job => job.id === id))
        const openJobIds = validOpen.length > 0 ? validOpen : (nextJobs[0]?.id ? [nextJobs[0].id] : [])

        let activeJobId: string | null = null
        if (state.activeJobId && nextJobs.some(job => job.id === state.activeJobId)) {
          activeJobId = state.activeJobId
        } else if (openJobIds.length > 0) {
          activeJobId = openJobIds[openJobIds.length - 1]
        }

        return { jobs: nextJobs, openJobIds, activeJobId }
      })
    } catch {
      notify('Failed to load cron jobs', 'error')
    } finally {
      set({ loading: false })
    }
  },

  createJob: async () => {
    try {
      const response = await fetch('/api/crons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultNewJob()),
      })
      if (!response.ok) throw new Error('failed')

      const data = await response.json()
      const created = data.job as CronJob

      set(state => ({
        jobs: [...state.jobs, created],
        openJobIds: state.openJobIds.includes(created.id) ? state.openJobIds : [...state.openJobIds, created.id],
        activeJobId: created.id,
      }))

      notify('Cron job created', 'success')
    } catch {
      notify('Failed to create cron job', 'error')
    }
  },

  saveJob: async (updated) => {
    try {
      const response = await fetch(`/api/crons/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!response.ok) throw new Error('failed')

      const data = await response.json()
      const next = data.job as CronJob

      set(state => ({
        jobs: state.jobs.map(job => (job.id === next.id ? next : job)),
      }))

      notify('Saved', 'success')
    } catch {
      notify('Failed to save job', 'error')
    }
  },

  deleteJob: async (id) => {
    try {
      const response = await fetch(`/api/crons/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('failed')

      set(state => {
        const jobs = state.jobs.filter(job => job.id !== id)
        const openJobIds = state.openJobIds.filter(jobId => jobId !== id)
        const activeJobId = state.activeJobId === id ? (openJobIds[openJobIds.length - 1] ?? null) : state.activeJobId
        return { jobs, openJobIds, activeJobId }
      })

      notify('Deleted', 'success')
    } catch {
      notify('Failed to delete job', 'error')
    }
  },

  toggleJobEnabled: async (job) => {
    try {
      const response = await fetch(`/api/crons/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !job.enabled }),
      })
      if (!response.ok) throw new Error('failed')

      const data = await response.json()
      const next = data.job as CronJob

      set(state => ({
        jobs: state.jobs.map(item => (item.id === next.id ? next : item)),
      }))
    } catch {
      notify('Failed to update job', 'error')
    }
  },

  openJob: (id) => {
    set(state => ({
      openJobIds: state.openJobIds.includes(id) ? state.openJobIds : [...state.openJobIds, id],
      activeJobId: id,
    }))
  },

  closeJob: (id) => {
    set(state => {
      const openJobIds = state.openJobIds.filter(jobId => jobId !== id)
      const activeJobId = state.activeJobId === id ? (openJobIds[openJobIds.length - 1] ?? null) : state.activeJobId
      return { openJobIds, activeJobId }
    })
  },

  setActiveJobId: (id) => set({ activeJobId: id }),
}))

export function getActiveCronJob(): CronJob | null {
  const { jobs, activeJobId } = useCronsStore.getState()
  return jobs.find(job => job.id === activeJobId) ?? null
}

export function getOpenCronJobs(): CronJob[] {
  const { jobs, openJobIds } = useCronsStore.getState()
  return openJobIds
    .map(id => jobs.find(job => job.id === id) ?? null)
    .filter((job): job is CronJob => Boolean(job))
}
