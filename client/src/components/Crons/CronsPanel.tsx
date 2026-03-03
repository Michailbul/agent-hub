import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CronJob } from '@/types/cron'
import { useUIStore } from '@/store/ui'
import { CronDetail, type CronDetailHandle } from './CronDetail'
import { CronListItem } from './CronListItem'
import { SkillsBrowser } from './SkillsBrowser'

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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const insertSkillRef = useRef<CronDetailHandle | null>(null)
  const { toast } = useUIStore()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/crons')
      if (!response.ok) throw new Error('failed')
      const data = await response.json()
      const nextJobs = (data.jobs || []) as CronJob[]
      setJobs(nextJobs)
      setSelectedJobId(prev => {
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
      setJobs(prev => {
        const next = prev.filter(job => job.id !== id)
        setSelectedJobId(current => {
          if (!current || current !== id) return current
          return next[0]?.id || null
        })
        return next
      })
      toast('Deleted', 'success')
    } catch {
      toast('Failed to delete job', 'error')
    }
  }, [toast])

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
      setSelectedJobId(data.job.id)
      toast('Cron job created', 'success')
    } catch {
      toast('Failed to create cron job', 'error')
    }
  }, [toast])

  const selectedJob = useMemo(
    () => jobs.find(job => job.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  )

  return (
    <div className="crons-layout">
      <div className="crons-list-col">
        <div className="crons-list-header">
          <span className="crons-list-label">Cron Jobs</span>
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
              selected={job.id === selectedJobId}
              onSelect={() => setSelectedJobId(job.id)}
              onToggle={handleToggle}
            />
          ))}
        </div>
      </div>

      <div className="crons-detail-col">
        {selectedJob ? (
          <CronDetail
            ref={insertSkillRef}
            job={selectedJob}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ) : (
          <div className="crons-empty">
            <span>← Select a cron job to edit</span>
          </div>
        )}
      </div>

      <div className="crons-skills-col">
        <SkillsBrowser onInsertSkill={name => insertSkillRef.current?.insertSkill(name)} />
      </div>
    </div>
  )
}
