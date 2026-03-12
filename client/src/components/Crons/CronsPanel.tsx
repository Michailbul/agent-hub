import { useEffect, useMemo, useRef, useState } from 'react'
import { useCronsStore } from '@/store/crons'
import { CronDetail, type CronDetailHandle } from './CronDetail'

export function CronsPanel() {
  const detailRef = useRef<CronDetailHandle | null>(null)

  const jobs = useCronsStore(state => state.jobs)
  const loading = useCronsStore(state => state.loading)
  const activeJobId = useCronsStore(state => state.activeJobId)
  const loadJobs = useCronsStore(state => state.loadJobs)
  const createJob = useCronsStore(state => state.createJob)
  const saveJob = useCronsStore(state => state.saveJob)
  const deleteJob = useCronsStore(state => state.deleteJob)
  const setActiveJobId = useCronsStore(state => state.setActiveJobId)

  const [skills, setSkills] = useState<string[]>([])

  useEffect(() => {
    void loadJobs()
  }, [loadJobs])

  // Lightweight skill names fetch for PromptComposer autocomplete
  useEffect(() => {
    fetch('/api/skills-index')
      .then(r => r.json())
      .then(data => setSkills((data.skills || []).map((s: { name: string }) => s.name).sort()))
      .catch(() => {})
  }, [])

  const activeJob = useMemo(
    () => jobs.find(job => job.id === activeJobId) ?? null,
    [activeJobId, jobs],
  )

  // Auto-select first job if none active
  useEffect(() => {
    if (!activeJobId && jobs.length > 0) {
      setActiveJobId(jobs[0].id)
    }
  }, [activeJobId, jobs, setActiveJobId])

  return (
    <div className="crons-layout">
      {/* ── Vertical sidebar ── */}
      <div className="crons-sidebar">
        <div className="crons-sidebar-header">
          <span className="crons-sidebar-title">Cron Jobs</span>
          <span className="crons-sidebar-count">{jobs.length}</span>
        </div>
        <div className="crons-sidebar-items">
          {loading ? (
            <span className="crons-sidebar-loading">Loading...</span>
          ) : jobs.length === 0 ? (
            <span className="crons-sidebar-empty">No cron jobs yet</span>
          ) : jobs.map(job => (
            <button
              key={job.id}
              className={`crons-sidebar-item${job.id === activeJobId ? ' active' : ''}`}
              onClick={() => setActiveJobId(job.id)}
            >
              <span className={`crons-sidebar-dot${job.enabled ? ' on' : ''}`} />
              <div className="crons-sidebar-item-info">
                <span className="crons-sidebar-item-name">{job.name}</span>
                <span className="crons-sidebar-item-schedule">
                  {job.schedule.kind === 'cron' ? job.schedule.expr : `every ${formatInterval(job.schedule.everyMs)}`}
                </span>
              </div>
            </button>
          ))}
        </div>
        <button className="crons-sidebar-new" onClick={() => void createJob()}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          New Job
        </button>
      </div>

      {/* ── Detail area ── */}
      <div className="crons-body">
        {activeJob ? (
          <CronDetail
            ref={detailRef}
            job={activeJob}
            skills={skills}
            onSave={updated => void saveJob(updated)}
            onDelete={id => void deleteJob(id)}
          />
        ) : (
          <div className="crons-empty">
            <span className="crons-empty-icon">⏱</span>
            <span className="crons-empty-text">
              {jobs.length === 0 ? 'Create your first cron job' : 'Select a cron job to edit'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function formatInterval(ms?: number): string {
  if (!ms) return '1m'
  if (ms % 86400000 === 0) return `${ms / 86400000}d`
  if (ms % 3600000 === 0) return `${ms / 3600000}h`
  return `${Math.round(ms / 60000)}m`
}
