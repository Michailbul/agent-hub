import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { TreeData } from '@/types'
import type { CronJob } from '@/types/cron'

interface CronDetailProps {
  job: CronJob
  onSave: (updated: CronJob) => void
  onDelete: (id: string) => void
}

export interface CronDetailHandle {
  insertSkill: (name: string) => void
}

const TZ_OPTIONS = ['Europe/Minsk', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo']

const CRON_PRESETS = [
  { label: 'Custom', expr: '' },
  { label: 'Every day 9am', expr: '0 9 * * *' },
  { label: 'Every day 5pm', expr: '0 17 * * *' },
  { label: 'Every Monday', expr: '0 9 * * 1' },
  { label: 'Every hour', expr: '0 * * * *' },
  { label: 'Every 6 hours', expr: '0 */6 * * *' },
]

type EveryUnit = 'minutes' | 'hours' | 'days'

function toEveryFields(everyMs?: number): { value: number; unit: EveryUnit } {
  const ms = everyMs || 60000
  if (ms % 86400000 === 0) return { value: ms / 86400000, unit: 'days' }
  if (ms % 3600000 === 0) return { value: ms / 3600000, unit: 'hours' }
  return { value: Math.max(1, Math.round(ms / 60000)), unit: 'minutes' }
}

function toEveryMs(value: number, unit: EveryUnit): number {
  if (unit === 'hours') return value * 3600000
  if (unit === 'days') return value * 86400000
  return value * 60000
}

function normalizeJob(job: CronJob): CronJob {
  return {
    ...job,
    name: job.name.trim(),
    agentId: job.agentId || undefined,
    schedule: job.schedule.kind === 'cron'
      ? { kind: 'cron', expr: job.schedule.expr || '', tz: job.schedule.tz || 'UTC' }
      : { kind: 'every', everyMs: job.schedule.everyMs || 60000, tz: job.schedule.tz || 'UTC' },
    payload: {
      ...job.payload,
      message: job.payload.message,
      model: job.payload.model || '',
      timeoutSeconds: job.payload.timeoutSeconds ?? 300,
    },
    delivery: job.delivery?.mode === 'none'
      ? { mode: 'none' }
      : {
          ...(job.delivery || {}),
          mode: (job.delivery?.mode || 'announce') as 'announce' | 'silent',
        },
  }
}

export const CronDetail = forwardRef<CronDetailHandle, CronDetailProps>(function CronDetail(
  { job, onSave, onDelete },
  ref,
) {
  const promptRef = useRef<HTMLTextAreaElement | null>(null)
  const [agentOptions, setAgentOptions] = useState<TreeData['agents']>([])

  const initialEvery = useMemo(() => toEveryFields(job.schedule.everyMs), [job.id])

  const [name, setName] = useState(job.name)
  const [enabled, setEnabled] = useState(job.enabled)
  const [agentId, setAgentId] = useState(job.agentId || '')
  const [scheduleKind, setScheduleKind] = useState<'cron' | 'every'>(job.schedule.kind)
  const [cronExpr, setCronExpr] = useState(job.schedule.expr || '0 9 * * *')
  const [everyValue, setEveryValue] = useState(initialEvery.value)
  const [everyUnit, setEveryUnit] = useState<EveryUnit>(initialEvery.unit)
  const [timezone, setTimezone] = useState(job.schedule.tz || 'UTC')
  const [message, setMessage] = useState(job.payload.message || '')
  const [model, setModel] = useState(job.payload.model || '')
  const [timeoutSeconds, setTimeoutSeconds] = useState(job.payload.timeoutSeconds ?? 300)
  const [deliveryMode, setDeliveryMode] = useState<'announce' | 'silent' | 'none'>(job.delivery?.mode || 'announce')

  const resizePrompt = useCallback(() => {
    const node = promptRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${node.scrollHeight}px`
  }, [])

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await fetch('/api/tree')
        if (!response.ok) return
        const data = (await response.json()) as TreeData
        setAgentOptions(data.agents || [])
      } catch {
        setAgentOptions([])
      }
    }
    void loadAgents()
  }, [])

  useEffect(() => {
    const every = toEveryFields(job.schedule.everyMs)
    setName(job.name)
    setEnabled(job.enabled)
    setAgentId(job.agentId || '')
    setScheduleKind(job.schedule.kind)
    setCronExpr(job.schedule.expr || '0 9 * * *')
    setEveryValue(every.value)
    setEveryUnit(every.unit)
    setTimezone(job.schedule.tz || 'UTC')
    setMessage(job.payload.message || '')
    setModel(job.payload.model || '')
    setTimeoutSeconds(job.payload.timeoutSeconds ?? 300)
    setDeliveryMode(job.delivery?.mode || 'announce')
  }, [job])

  useEffect(() => {
    resizePrompt()
  }, [message, resizePrompt])

  useImperativeHandle(ref, () => ({
    insertSkill: (skillName: string) => {
      setMessage(prev => {
        const node = promptRef.current
        if (!node) return prev ? `${prev}\n${skillName}` : skillName

        const start = node.selectionStart ?? prev.length
        const end = node.selectionEnd ?? prev.length
        const next = `${prev.slice(0, start)}${skillName}${prev.slice(end)}`

        requestAnimationFrame(() => {
          const focusNode = promptRef.current
          if (!focusNode) return
          const pos = start + skillName.length
          focusNode.focus()
          focusNode.setSelectionRange(pos, pos)
        })

        return next
      })
    },
  }), [])

  const selectedPreset = useMemo(() => {
    const match = CRON_PRESETS.find(p => p.expr === cronExpr)
    return match?.expr || ''
  }, [cronExpr])

  const buildUpdatedJob = useCallback((): CronJob => {
    const updated: CronJob = {
      ...job,
      name: name.trim(),
      enabled,
      agentId: agentId || undefined,
      schedule: scheduleKind === 'cron'
        ? { kind: 'cron', expr: cronExpr.trim(), tz: timezone }
        : { kind: 'every', everyMs: toEveryMs(Math.max(1, everyValue), everyUnit), tz: timezone },
      payload: {
        ...job.payload,
        kind: 'agentTurn',
        message,
        model: model || undefined,
        timeoutSeconds,
      },
      delivery: deliveryMode === 'none'
        ? { mode: 'none' }
        : { ...(job.delivery || {}), mode: deliveryMode },
    }

    return normalizeJob(updated)
  }, [
    agentId,
    cronExpr,
    deliveryMode,
    enabled,
    everyUnit,
    everyValue,
    job,
    message,
    model,
    name,
    scheduleKind,
    timeoutSeconds,
    timezone,
  ])

  const dirty = useMemo(() => {
    const a = normalizeJob(job)
    const b = buildUpdatedJob()
    return JSON.stringify(a) !== JSON.stringify(b)
  }, [buildUpdatedJob, job])

  const handleSave = () => {
    if (!name.trim()) {
      alert('Name is required')
      return
    }
    if (!message.trim()) {
      alert('Prompt is required')
      return
    }
    onSave(buildUpdatedJob())
  }

  return (
    <div className="cron-detail">
      <div className="cron-detail-header">
        <span className="cron-detail-title">Cron Detail</span>
        {dirty && <span className="cron-dirty-badge">Unsaved</span>}
      </div>

      <div className="cron-field">
        <label className="cron-label">Name</label>
        <input
          className="cron-input"
          style={{ fontSize: 16, fontWeight: 700 }}
          value={name}
          onChange={event => setName(event.target.value)}
        />
      </div>

      <div className="cron-field">
        <label className="cron-label">Enabled</label>
        <div className={`toggle-switch${enabled ? ' on' : ''}`} onClick={() => setEnabled(prev => !prev)} />
      </div>

      <div className="cron-field">
        <label className="cron-label">Agent</label>
        <select className="cron-input" value={agentId} onChange={event => setAgentId(event.target.value)}>
          <option value="">None</option>
          {agentOptions.map(agent => (
            <option key={agent.id} value={agent.id}>{agent.label}</option>
          ))}
        </select>
      </div>

      <div className="cron-field">
        <label className="cron-label">Schedule</label>
        <div className="cf-row">
          <button
            className={`cf-tab ${scheduleKind === 'cron' ? 'cf-tab-active' : ''}`}
            onClick={() => setScheduleKind('cron')}
          >
            Cron
          </button>
          <button
            className={`cf-tab ${scheduleKind === 'every' ? 'cf-tab-active' : ''}`}
            onClick={() => setScheduleKind('every')}
          >
            Every N minutes
          </button>
        </div>
      </div>

      {scheduleKind === 'cron' ? (
        <>
          <div className="cron-field">
            <label className="cron-label">Cron Expression</label>
            <input
              className="cron-input"
              value={cronExpr}
              onChange={event => setCronExpr(event.target.value)}
            />
          </div>
          <div className="cron-field">
            <label className="cron-label">Preset</label>
            <select
              className="cron-input"
              value={selectedPreset}
              onChange={event => {
                if (!event.target.value) return
                setCronExpr(event.target.value)
              }}
            >
              {CRON_PRESETS.map(preset => (
                <option key={preset.label} value={preset.expr}>{preset.label}</option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <div className="cron-field">
          <label className="cron-label">Repeat</label>
          <div className="cf-row">
            <input
              className="cron-input"
              type="number"
              min={1}
              value={everyValue}
              onChange={event => setEveryValue(Number(event.target.value) || 1)}
            />
            <select className="cron-input" value={everyUnit} onChange={event => setEveryUnit(event.target.value as EveryUnit)}>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
          </div>
        </div>
      )}

      <div className="cron-field">
        <label className="cron-label">Timezone</label>
        <select className="cron-input" value={timezone} onChange={event => setTimezone(event.target.value)}>
          {TZ_OPTIONS.map(tz => (
            <option key={tz} value={tz}>{tz}</option>
          ))}
        </select>
      </div>

      <div className="cron-field">
        <label className="cron-label">Prompt</label>
        <textarea
          ref={promptRef}
          className="cron-input cron-textarea"
          rows={6}
          value={message}
          onChange={event => setMessage(event.target.value)}
        />
      </div>

      <div className="cron-field">
        <label className="cron-label">Model</label>
        <input className="cron-input" value={model} onChange={event => setModel(event.target.value)} />
      </div>

      <div className="cron-field">
        <label className="cron-label">Timeout</label>
        <input
          className="cron-input"
          type="number"
          min={1}
          value={timeoutSeconds}
          onChange={event => setTimeoutSeconds(Number(event.target.value) || 1)}
        />
      </div>

      <div className="cron-field">
        <label className="cron-label">Delivery Mode</label>
        <select
          className="cron-input"
          value={deliveryMode}
          onChange={event => setDeliveryMode(event.target.value as 'announce' | 'silent' | 'none')}
        >
          <option value="announce">announce</option>
          <option value="silent">silent</option>
          <option value="none">none</option>
        </select>
      </div>

      <div className="cron-detail-actions">
        <button className="btn-save" onClick={handleSave}>💾 Save Changes</button>
        <button
          className="btn-delete"
          onClick={() => {
            if (confirm('Delete this cron job?')) onDelete(job.id)
          }}
        >
          🗑 Delete
        </button>
      </div>
    </div>
  )
})
