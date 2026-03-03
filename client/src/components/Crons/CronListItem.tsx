import type { CronJob } from '@/types/cron'

interface Props {
  job: CronJob
  selected: boolean
  onSelect: () => void
  onToggle: (job: CronJob) => void
}

function formatSchedule(job: CronJob): string {
  if (job.schedule.kind === 'cron') return job.schedule.expr || 'cron'

  const ms = job.schedule.everyMs || 0
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `Every ${minutes}m`
  if (minutes < 1440) return `Every ${Math.round(minutes / 60)}h`
  return `Every ${Math.round(minutes / 1440)}d`
}

function statusClass(job: CronJob): string {
  if (!job.enabled) return 'dis'
  if ((job.state?.consecutiveErrors || 0) > 0 || job.state?.lastRunStatus === 'error') return 'err'
  if (job.state?.lastRunStatus === 'ok') return 'ok'
  return 'dis'
}

export function CronListItem({ job, selected, onSelect, onToggle }: Props) {
  return (
    <div className={`cron-li${selected ? ' selected' : ''}`} onClick={onSelect}>
      <div
        className={`toggle-switch${job.enabled ? ' on' : ''}`}
        onClick={event => {
          event.stopPropagation()
          onToggle(job)
        }}
      />

      <div className="cron-li-info">
        <div className="cron-li-name">{job.name}</div>
        <div className="cron-li-sched">{formatSchedule(job)}</div>
      </div>

      <div className={`cron-li-dot ${statusClass(job)}`} />
    </div>
  )
}
