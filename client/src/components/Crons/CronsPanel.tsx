import { useEffect, useState, useCallback } from 'react'
import type { CronJob } from '@/types/cron'
import { CronCard } from './CronCard'
import { CronEditor } from './CronEditor'
import { useUIStore } from '@/store/ui'

export function CronsPanel() {
  const [jobs, setJobs]         = useState<CronJob[]>([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState<CronJob | null | 'new'>(null)
  const { toast }               = useUIStore()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/crons')
      const d = await r.json()
      setJobs(d.jobs || [])
    } catch { toast('Failed to load cron jobs', 'error') }
    setLoading(false)
  }, [toast])

  useEffect(() => { void load() }, [load])

  const handleToggle = useCallback(async (job: CronJob) => {
    try {
      await fetch(`/api/crons/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !job.enabled }),
      })
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, enabled: !j.enabled } : j))
    } catch { toast('Failed to update job', 'error') }
  }, [toast])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this cron job?')) return
    try {
      await fetch(`/api/crons/${id}`, { method: 'DELETE' })
      setJobs(prev => prev.filter(j => j.id !== id))
      toast('Deleted', 'success')
    } catch { toast('Failed to delete job', 'error') }
  }, [toast])

  const handleSave = useCallback(async (job: Partial<CronJob>) => {
    try {
      if (editing === 'new') {
        const r = await fetch('/api/crons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job),
        })
        const d = await r.json()
        setJobs(prev => [...prev, d.job])
        toast('Cron job created', 'success')
      } else if (editing) {
        const r = await fetch(`/api/crons/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(job),
        })
        const d = await r.json()
        setJobs(prev => prev.map(j => j.id === d.job.id ? d.job : j))
        toast('Saved', 'success')
      }
      setEditing(null)
    } catch { toast('Failed to save job', 'error') }
  }, [editing, toast])

  const enabled  = jobs.filter(j => j.enabled)
  const disabled = jobs.filter(j => !j.enabled)

  return (
    <div className="crons-panel">
      <div className="crons-header">
        <div>
          <div className="crons-title">⏰ Cron Jobs</div>
          <div className="crons-sub">{jobs.length} jobs · {enabled.length} active</div>
        </div>
        <button className="crons-new-btn" onClick={() => setEditing('new')}>+ New Job</button>
      </div>

      {loading ? (
        <div className="crons-loading">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="crons-empty">
          <div className="crons-empty-icon">⏰</div>
          <div>No cron jobs yet</div>
          <button className="crons-new-btn mt-8" onClick={() => setEditing('new')}>Create first job</button>
        </div>
      ) : (
        <div className="crons-list">
          {enabled.length > 0 && (
            <div className="crons-group">
              <div className="crons-group-label">Active ({enabled.length})</div>
              {enabled.map(job => (
                <CronCard key={job.id} job={job}
                  onEdit={() => setEditing(job)}
                  onToggle={() => handleToggle(job)}
                  onDelete={() => handleDelete(job.id)} />
              ))}
            </div>
          )}
          {disabled.length > 0 && (
            <div className="crons-group">
              <div className="crons-group-label">Disabled ({disabled.length})</div>
              {disabled.map(job => (
                <CronCard key={job.id} job={job}
                  onEdit={() => setEditing(job)}
                  onToggle={() => handleToggle(job)}
                  onDelete={() => handleDelete(job.id)} />
              ))}
            </div>
          )}
        </div>
      )}

      {editing !== null && (
        <CronEditor
          job={editing === 'new' ? null : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
