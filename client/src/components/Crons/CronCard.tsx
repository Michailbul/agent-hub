import type { CronJob } from '@/types/cron'

interface Props {
  job: CronJob
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}

function formatSchedule(job: CronJob): string {
  const s = job.schedule
  if (s.kind === 'cron') return s.expr || ''
  if (s.kind === 'every') {
    const ms = s.everyMs || 0
    const mins = ms / 60000
    if (mins < 60)  return `every ${mins}m`
    if (mins < 1440) return `every ${Math.round(mins / 60)}h`
    return `every ${Math.round(mins / 1440)}d`
  }
  return ''
}

function formatLastRun(job: CronJob): string {
  const ts = job.state?.lastRunAtMs
  if (!ts) return 'Never'
  const diff = Date.now() - ts
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return 'Recently'
}

function formatNextRun(job: CronJob): string {
  const ts = job.state?.nextRunAtMs
  if (!ts) return '—'
  const diff = ts - Date.now()
  if (diff < 0) return 'Soon'
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  const m = Math.floor(diff / 60000)
  if (d > 0) return `in ${d}d`
  if (h > 0) return `in ${h}h`
  return `in ${m}m`
}

export function CronCard({ job, onEdit, onToggle, onDelete }: Props) {
  const hasError = (job.state?.consecutiveErrors || 0) > 0
  const status   = job.state?.lastRunStatus

  return (
    <div className={`cron-card${!job.enabled ? ' cron-disabled' : ''}${hasError ? ' cron-error' : ''}`}>
      <div className="cron-card-top">
        <div className="cron-info">
          <div className="cron-name">
            {job.name}
            {job.agentId && <span className="cron-agent-badge">{job.agentId}</span>}
          </div>
          {job.description && <div className="cron-desc">{job.description}</div>}
        </div>
        <div className="cron-actions">
          <div
            className={`toggle-switch${job.enabled ? ' on' : ''}`}
            onClick={onToggle}
            title={job.enabled ? 'Disable' : 'Enable'}
          />
          <button className="cron-btn" onClick={onEdit} title="Edit">✎</button>
          <button className="cron-btn cron-btn-del" onClick={onDelete} title="Delete">✕</button>
        </div>
      </div>

      <div className="cron-meta">
        <span className="cron-sched">🕐 {formatSchedule(job)}</span>
        {job.schedule.tz && <span className="cron-tz">{job.schedule.tz}</span>}
        <span className="cron-stat">Last: {formatLastRun(job)}</span>
        <span className="cron-stat">Next: {formatNextRun(job)}</span>
        {status === 'error' && <span className="cron-err-badge">⚠ {job.state?.consecutiveErrors} errors</span>}
        {status === 'ok' && <span className="cron-ok-badge">✓ ok</span>}
      </div>
    </div>
  )
}
