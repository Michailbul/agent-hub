import type { CronJob } from '@/types/cron'

interface Props {
  job: CronJob
  selected: boolean
  onSelect: () => void
  onToggle: (job: CronJob) => void
}

function formatSchedule(job: CronJob): string {
  if (job.schedule.kind === 'cron') return job.schedule.expr || 'cron'
  return `every ${(job.schedule.everyMs || 60000) / 60000}m`
}

function statusClass(job: CronJob): string {
  if (job.state?.lastRunStatus === 'error') return 'err'
  if (job.state?.lastRunStatus === 'ok') return 'ok'
  return ''
}

export function CronListItem({ job, selected, onSelect, onToggle }: Props) {
  return (
    <div className={`cron-li${selected ? ' selected' : ''}`} onClick={onSelect}>
      <div className="cron-li-left">
        <div
          className={`toggle-switch${job.enabled ? ' on' : ''}`}
          onClick={event => {
            event.stopPropagation()
            onToggle(job)
          }}
        />
      </div>

      <div className="cron-li-body">
        <div className="cron-li-name">{job.name}</div>
        <div className="cron-li-meta">
          {formatSchedule(job)}
          {' · '}
          {job.payload?.model || 'default'}
        </div>
      </div>

      <div className={`cron-li-status ${statusClass(job)}`} />
    </div>
  )
}
