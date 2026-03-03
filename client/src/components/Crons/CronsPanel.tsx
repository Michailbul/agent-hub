import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CronJob } from '@/types/cron'
import { useUIStore } from '@/store/ui'
import { CronDetail } from './CronDetail'
import { CronListItem } from './CronListItem'

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

export function CronsPanel() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [openJobIds, setOpenJobIds] = useState<string[]>([])
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const { toast } = useUIStore()

  const openJob = useCallback((id: string) => {
    setOpenJobIds(prev => (prev.includes(id) ? prev : [...prev, id]))
    setActiveJobId(id)
  }, [])

  const closeJob = useCallback((id: string) => {
    setOpenJobIds(prev => {
      const next = prev.filter(jobId => jobId !== id)
      setActiveJobId(current => (current === id ? (next[next.length - 1] ?? null) : current))
      return next
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/crons')
      if (!response.ok) throw new Error('failed')
      const data = await response.json()
      const nextJobs = (data.jobs || []) as CronJob[]
      setJobs(nextJobs)
      setOpenJobIds(prev => {
        const valid = prev.filter(id => nextJobs.some(job => job.id === id))
        if (valid.length > 0) return valid
        return nextJobs[0]?.id ? [nextJobs[0].id] : []
      })
      setActiveJobId(prev => {
        if (!nextJobs.length) return null
        if (prev && nextJobs.some(job => job.id === prev)) return prev
        return nextJobs[0].id
      })
    } catch {
      toast('Failed to load cron jobs', 'error')
    }
    setLoading(false)
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const handleToggle = useCallback(async (job: CronJob) => {
    try {
      const response = await fetch(`/api/crons/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !job.enabled }),
      })
      if (!response.ok) throw new Error('failed')
      const data = await response.json()
      setJobs(prev => prev.map(item => (item.id === data.job.id ? data.job : item)))
    } catch {
      toast('Failed to update job', 'error')
    }
  }, [toast])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/crons/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('failed')
      setJobs(prev => prev.filter(job => job.id !== id))
      closeJob(id)
      toast('Deleted', 'success')
    } catch {
      toast('Failed to delete job', 'error')
    }
  }, [closeJob, toast])

  const handleSave = useCallback(async (updated: CronJob) => {
    try {
      const response = await fetch(`/api/crons/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (!response.ok) throw new Error('failed')
      const data = await response.json()
      setJobs(prev => prev.map(job => (job.id === data.job.id ? data.job : job)))
      toast('Saved', 'success')
    } catch {
      toast('Failed to save job', 'error')
    }
  }, [toast])

  const handleNew = useCallback(async () => {
    try {
      const response = await fetch('/api/crons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(defaultNewJob()),
      })
      if (!response.ok) throw new Error('failed')
      const data = await response.json()
      setJobs(prev => [...prev, data.job])
      openJob(data.job.id)
      toast('Cron job created', 'success')
    } catch {
      toast('Failed to create cron job', 'error')
    }
  }, [openJob, toast])

  const activeJob = useMemo(
    () => jobs.find(job => job.id === activeJobId) ?? null,
    [activeJobId, jobs],
  )

  return (
    <div className="crons-layout">
      <div className="crons-list-col">
        <div className="crons-list-header">
          <span className="crons-list-label">CRON JOBS</span>
          <button className="crons-new-btn" onClick={handleNew}>+ New</button>
        </div>
        <div className="cron-list-scroll">
          {loading ? (
            <div className="crons-loading">Loading...</div>
          ) : jobs.length === 0 ? (
            <div className="crons-loading">No cron jobs</div>
          ) : jobs.map(job => (
            <CronListItem
              key={job.id}
              job={job}
              selected={openJobIds.includes(job.id) && job.id === activeJobId}
              onSelect={() => openJob(job.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      <div className="crons-main-col">
        <div className="cron-tabs">
          {openJobIds.map(id => {
            const job = jobs.find(entry => entry.id === id)
            if (!job) return null
            return (
              <div
                key={id}
                className={`cron-tab${id === activeJobId ? ' active' : ''}`}
                onClick={() => setActiveJobId(id)}
              >
                <span className="cron-tab-name">{job.name}</span>
                <button
                  className="cron-tab-close"
                  onClick={event => {
                    event.stopPropagation()
                    closeJob(id)
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        {activeJob ? (
          <CronDetail job={activeJob} onSave={handleSave} onDelete={handleDelete} />
        ) : (
          <div className="crons-empty">← Select a cron job</div>
        )}
      </div>
    </div>
  )
}
