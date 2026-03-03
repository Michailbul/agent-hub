import type { CronJob } from '@/types/cron'

interface Props {
  job: CronJob
  onEdit?: () => void
  onToggle?: () => void
  onDelete?: () => void
}

function formatSchedule(job: CronJob): string {
  if (job.schedule.kind === 'cron') return job.schedule.expr || ''
  const mins = Math.round((job.schedule.everyMs || 0) / 60000)
  if (mins < 60) return `every ${mins}m`
  if (mins < 1440) return `every ${Math.round(mins / 60)}h`
  return `every ${Math.round(mins / 1440)}d`
}

function statusClass(job: CronJob): string {
  if (!job.enabled) return 'dis'
  if ((job.state?.consecutiveErrors || 0) > 0 || job.state?.lastRunStatus === 'error') return 'err'
  if (job.state?.lastRunStatus === 'ok') return 'ok'
  return 'dis'
}

export function CronCard({ job, onToggle }: Props) {
  return (
    <div className="cron-li">
      <div className={`toggle-switch${job.enabled ? ' on' : ''}`} onClick={onToggle} />
      <div className="cron-li-info">
        <div className="cron-li-name">{job.name}</div>
        <div className="cron-li-sched">{formatSchedule(job)}</div>
      </div>
      <div className={`cron-li-dot ${statusClass(job)}`} />
    </div>
  )
}
