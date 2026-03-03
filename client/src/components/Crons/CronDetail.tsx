import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { TreeData } from '@/types'
import type { CronJob } from '@/types/cron'
import { PromptComposer } from './PromptComposer'

interface CronDetailProps {
  job: CronJob
  skills: string[]
  onOpenSkills: () => void
  onSave: (updated: CronJob) => void
  onDelete: (id: string) => void
}

export type CronDetailHandle = {
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
    wakeMode: job.wakeMode || 'now',
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
  { job, skills, onOpenSkills, onSave, onDelete },
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
  const [wakeMode, setWakeMode] = useState(job.wakeMode || 'now')

  const [advancedOpen, setAdvancedOpen] = useState(false)

  useEffect(() => {
    const loadTree = async () => {
      try {
        const response = await fetch('/api/tree')
        if (!response.ok) return
        const data = (await response.json()) as TreeData
        setAgentOptions(data.agents || [])
      } catch {
        setAgentOptions([])
      }
    }

    void loadTree()
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
    setWakeMode(job.wakeMode || 'now')
    setAdvancedOpen(false)
  }, [job])

  const selectedPreset = useMemo(() => {
    const match = CRON_PRESETS.find(preset => preset.expr === cronExpr)
    return match?.expr || ''
  }, [cronExpr])

  const insertSkill = useCallback((skillName: string) => {
    const cleanName = skillName.trim()
    if (!cleanName) return

    const tokenCore = `[skill: ${cleanName}]`

    setMessage(prev => {
      const node = promptRef.current
      const start = node?.selectionStart ?? prev.length
      const end = node?.selectionEnd ?? prev.length

      const before = prev.slice(0, start)
      const after = prev.slice(end)

      const needsLeadSpace = before.length > 0 && !/\s$/.test(before)
      const needsTrailSpace = after.length > 0 && !/^\s/.test(after)

      // Insert as a token separated by spaces (prevents weird indentation/outdenting feel)
      const token = `${needsLeadSpace ? ' ' : ''}${tokenCore}${needsTrailSpace ? ' ' : ''}`

      const next = `${before}${token}${after}`

      requestAnimationFrame(() => {
        const focusNode = promptRef.current
        if (!focusNode) return
        const pos = start + token.length
        focusNode.focus()
        focusNode.setSelectionRange(pos, pos)
      })

      return next
    })
  }, [])

  useImperativeHandle(ref, () => ({ insertSkill }), [insertSkill])

  const buildUpdatedJob = useCallback((): CronJob => {
    const updated: CronJob = {
      ...job,
      name: name.trim(),
      enabled,
      agentId: agentId || undefined,
      wakeMode,
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
    wakeMode,
  ])

  const isDirty = useMemo(() => {
    const before = normalizeJob(job)
    const after = buildUpdatedJob()
    return JSON.stringify(before) !== JSON.stringify(after)
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
    <div className="cron-detail-wrap">
      <div className="crons-detail-topbar">
        <div className="crons-topbar-left">
          <span className="cron-topbar-label">CRON DETAIL</span>
          {isDirty && <span className="cron-dirty-badge">UNSAVED</span>}
        </div>
        <div className="crons-topbar-right">
          <button type="button" className="btn-skill" onClick={onOpenSkills}>
            Skills ▸
          </button>
          <button
            className="btn-delete"
            onClick={() => {
              if (confirm('Delete this cron job?')) onDelete(job.id)
            }}
          >
            Delete
          </button>
          <button className="btn-save" onClick={handleSave} disabled={!isDirty}>Save</button>
        </div>
      </div>

      <div className="cron-detail-body">
        <div className="cron-detail-inner">
          <input
            className="cron-name-input"
            value={name}
            onChange={event => setName(event.target.value)}
            placeholder="job-name"
          />

          <div className="cron-row-2">
            <div className="cron-field">
              <label className="cron-label">Enabled</label>
              <div className="cron-inline-status">
                <div className={`toggle-switch${enabled ? ' on' : ''}`} onClick={() => setEnabled(prev => !prev)} />
                <span className="cron-inline-text">{enabled ? 'Active' : 'Paused'}</span>
              </div>
            </div>

            <div className="cron-field">
              <label className="cron-label">Agent</label>
              <select className="cron-select" value={agentId} onChange={event => setAgentId(event.target.value)}>
                <option value="">None</option>
                {agentOptions.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.emoji} {agent.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="cron-field">
            <label className="cron-label">SCHEDULE</label>
            <div className="cf-row">
              <button
                className={`cf-tab${scheduleKind === 'cron' ? ' cf-tab-active' : ''}`}
                onClick={() => setScheduleKind('cron')}
              >
                Cron expression
              </button>
              <button
                className={`cf-tab${scheduleKind === 'every' ? ' cf-tab-active' : ''}`}
                onClick={() => setScheduleKind('every')}
              >
                Every N minutes
              </button>
            </div>
          </div>

          {scheduleKind === 'cron' ? (
            <div className="cron-row-2">
              <div className="cron-field">
                <label className="cron-label">Expression</label>
                <input className="cron-input" value={cronExpr} onChange={event => setCronExpr(event.target.value)} />
              </div>
              <div className="cron-field">
                <label className="cron-label">Preset</label>
                <select
                  className="cron-select"
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
            </div>
          ) : (
            <div className="cron-row-2">
              <div className="cron-field">
                <label className="cron-label">Repeat every</label>
                <input
                  className="cron-input"
                  type="number"
                  min={1}
                  value={everyValue}
                  onChange={event => setEveryValue(Number(event.target.value) || 1)}
                />
              </div>
              <div className="cron-field">
                <label className="cron-label">Unit</label>
                <select
                  className="cron-select"
                  value={everyUnit}
                  onChange={event => setEveryUnit(event.target.value as EveryUnit)}
                >
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                </select>
              </div>
            </div>
          )}

          <div className="cron-field">
            <label className="cron-label">Timezone</label>
            <select className="cron-select" value={timezone} onChange={event => setTimezone(event.target.value)}>
              {TZ_OPTIONS.map(tz => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div className="cron-field">
            <label className="cron-label">PROMPT</label>
            <PromptComposer
              value={message}
              onChange={setMessage}
              onInsertSkill={insertSkill}
              skills={skills}
              textareaRef={promptRef}
            />
          </div>

          <div>
            <button className="cron-advanced-toggle" onClick={() => setAdvancedOpen(prev => !prev)}>
              <span>ADVANCED {advancedOpen ? '▴' : '▾'}</span>
            </button>
            <div className={`cron-advanced-body ${advancedOpen ? 'open' : 'closed'}`}>
              <div className="cron-advanced-inner">
                <div className="cron-row-2">
                  <div className="cron-field">
                    <label className="cron-label">Model</label>
                    <input className="cron-input" value={model} onChange={event => setModel(event.target.value)} />
                  </div>
                  <div className="cron-field">
                    <label className="cron-label">Timeout (seconds)</label>
                    <input
                      className="cron-input"
                      type="number"
                      min={1}
                      value={timeoutSeconds}
                      onChange={event => setTimeoutSeconds(Number(event.target.value) || 1)}
                    />
                  </div>
                </div>

                <div className="cron-row-2">
                  <div className="cron-field">
                    <label className="cron-label">Delivery mode</label>
                    <select
                      className="cron-select"
                      value={deliveryMode}
                      onChange={event => setDeliveryMode(event.target.value as 'announce' | 'silent' | 'none')}
                    >
                      <option value="announce">announce</option>
                      <option value="silent">silent</option>
                      <option value="none">none</option>
                    </select>
                  </div>
                  <div className="cron-field">
                    <label className="cron-label">Wake mode</label>
                    <select className="cron-select" value={wakeMode} onChange={event => setWakeMode(event.target.value)}>
                      <option value="now">now</option>
                      <option value="next">next</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
