export interface CronSchedule {
  kind: 'cron' | 'every'
  expr?: string          // cron expression (when kind=cron)
  everyMs?: number       // interval in ms (when kind=every)
  tz?: string
  anchorMs?: number
}

export interface CronPayload {
  kind: 'agentTurn'
  message: string
  model?: string
  timeoutSeconds?: number
}

export interface CronDelivery {
  mode: 'announce' | 'silent' | 'none'
  channel?: string
  to?: string
}

export interface CronState {
  nextRunAtMs?: number
  lastRunAtMs?: number
  lastRunStatus?: 'ok' | 'error'
  lastStatus?: string
  lastDurationMs?: number
  consecutiveErrors?: number
  lastError?: string
}

export interface CronJob {
  id: string
  name: string
  description?: string
  agentId?: string
  enabled: boolean
  createdAtMs: number
  updatedAtMs: number
  schedule: CronSchedule
  sessionTarget?: string
  wakeMode?: string
  payload: CronPayload
  delivery?: CronDelivery
  state?: CronState
}
