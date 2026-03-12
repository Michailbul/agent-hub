import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import type { TreeData } from '@/types'
import type { CronJob } from '@/types/cron'
import { PromptComposer } from './PromptComposer'

interface CronDetailProps {
  job: CronJob
  skills: string[]
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

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export const CronDetail = forwardRef<CronDetailHandle, CronDetailProps>(function CronDetail(
  { job, skills, onSave, onDelete },
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
  }, [agentId, cronExpr, deliveryMode, enabled, everyUnit, everyValue, job, message, model, name, scheduleKind, timeoutSeconds, timezone, wakeMode])

  const isDirty = useMemo(() => {
    const before = normalizeJob(job)
    const after = buildUpdatedJob()
    return JSON.stringify(before) !== JSON.stringify(after)
  }, [buildUpdatedJob, job])

  const handleSave = () => {
    if (!name.trim()) { alert('Name is required'); return }
    if (!message.trim()) { alert('Prompt is required'); return }
    onSave(buildUpdatedJob())
  }

  // Keyboard shortcut: Cmd/Ctrl+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (isDirty) handleSave()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isDirty, handleSave])

  return (
    <div className="nd-wrap">
      {/* ── Floating action bar ── */}
      <div className="nd-action-bar">
        <div className="nd-action-left">
          {isDirty && <span className="nd-unsaved-pill">Unsaved changes</span>}
        </div>
        <div className="nd-action-right">
          <button
            className="nd-btn nd-btn-danger"
            onClick={() => { if (confirm('Delete this cron job?')) onDelete(job.id) }}
          >
            Delete
          </button>
          <button className="nd-btn nd-btn-primary" onClick={handleSave} disabled={!isDirty}>
            {isDirty ? 'Save' : 'Saved'}
          </button>
        </div>
      </div>

      {/* ── Document scroll area ── */}
      <div className="nd-scroll">
        <div className="nd-page">
          {/* ── Title ── */}
          <input
            className="nd-title"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Untitled cron job"
            spellCheck={false}
          />

          {/* ── Status badge ── */}
          <div className="nd-status-row">
            <div className={`nd-status-badge ${enabled ? 'active' : 'paused'}`} onClick={() => setEnabled(p => !p)}>
              <span className="nd-status-dot" />
              {enabled ? 'Active' : 'Paused'}
            </div>
            {job.state?.lastRunAtMs && (
              <span className="nd-meta-text">
                Last run {formatRelativeTime(job.state.lastRunAtMs)}
                {job.state.lastRunStatus === 'error' && <span className="nd-run-error"> · Error</span>}
                {job.state.lastRunStatus === 'ok' && <span className="nd-run-ok"> · OK</span>}
              </span>
            )}
          </div>

          {/* ── Property table (Notion-style) ── */}
          <div className="nd-props">
            <div className="nd-prop-row">
              <span className="nd-prop-label">Agent</span>
              <div className="nd-prop-value">
                <select className="nd-inline-select" value={agentId} onChange={e => setAgentId(e.target.value)}>
                  <option value="">None</option>
                  {agentOptions.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.emoji} {agent.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="nd-prop-row">
              <span className="nd-prop-label">Schedule</span>
              <div className="nd-prop-value">
                <div className="nd-schedule-group">
                  <div className="nd-pill-switch">
                    <button
                      className={`nd-pill-opt ${scheduleKind === 'cron' ? 'on' : ''}`}
                      onClick={() => setScheduleKind('cron')}
                    >
                      Cron
                    </button>
                    <button
                      className={`nd-pill-opt ${scheduleKind === 'every' ? 'on' : ''}`}
                      onClick={() => setScheduleKind('every')}
                    >
                      Interval
                    </button>
                  </div>

                  {scheduleKind === 'cron' ? (
                    <div className="nd-sched-fields">
                      <input
                        className="nd-inline-input nd-mono"
                        value={cronExpr}
                        onChange={e => setCronExpr(e.target.value)}
                        placeholder="0 9 * * *"
                      />
                      <select
                        className="nd-inline-select nd-select-sm"
                        value={selectedPreset}
                        onChange={e => { if (e.target.value) setCronExpr(e.target.value) }}
                      >
                        {CRON_PRESETS.map(p => (
                          <option key={p.label} value={p.expr}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="nd-sched-fields">
                      <span className="nd-sched-prefix">every</span>
                      <input
                        className="nd-inline-input nd-input-narrow"
                        type="number"
                        min={1}
                        value={everyValue}
                        onChange={e => setEveryValue(Number(e.target.value) || 1)}
                      />
                      <select
                        className="nd-inline-select nd-select-sm"
                        value={everyUnit}
                        onChange={e => setEveryUnit(e.target.value as EveryUnit)}
                      >
                        <option value="minutes">minutes</option>
                        <option value="hours">hours</option>
                        <option value="days">days</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="nd-prop-row">
              <span className="nd-prop-label">Timezone</span>
              <div className="nd-prop-value">
                <select className="nd-inline-select" value={timezone} onChange={e => setTimezone(e.target.value)}>
                  {TZ_OPTIONS.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>

            <div className="nd-prop-row">
              <span className="nd-prop-label">Model</span>
              <div className="nd-prop-value">
                <input
                  className="nd-inline-input"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  placeholder="default"
                />
              </div>
            </div>

            <div className="nd-prop-row">
              <span className="nd-prop-label">Timeout</span>
              <div className="nd-prop-value">
                <input
                  className="nd-inline-input nd-input-narrow"
                  type="number"
                  min={1}
                  value={timeoutSeconds}
                  onChange={e => setTimeoutSeconds(Number(e.target.value) || 1)}
                />
                <span className="nd-unit-suffix">seconds</span>
              </div>
            </div>

            <div className="nd-prop-row">
              <span className="nd-prop-label">Delivery</span>
              <div className="nd-prop-value">
                <select
                  className="nd-inline-select nd-select-sm"
                  value={deliveryMode}
                  onChange={e => setDeliveryMode(e.target.value as 'announce' | 'silent' | 'none')}
                >
                  <option value="announce">Announce</option>
                  <option value="silent">Silent</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>

            <div className="nd-prop-row">
              <span className="nd-prop-label">Wake</span>
              <div className="nd-prop-value">
                <select className="nd-inline-select nd-select-sm" value={wakeMode} onChange={e => setWakeMode(e.target.value)}>
                  <option value="now">Immediate</option>
                  <option value="next">Next window</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className="nd-divider" />

          {/* ── Prompt (main content) ── */}
          <div className="nd-prompt-section">
            <div className="nd-prompt-header">
              <span className="nd-section-icon">⚡</span>
              <span className="nd-section-title">Prompt</span>
              <span className="nd-section-hint">What should this agent do when triggered?</span>
            </div>
            <PromptComposer
              value={message}
              onChange={setMessage}
              onInsertSkill={insertSkill}
              skills={skills}
              textareaRef={promptRef}
            />
          </div>
        </div>
      </div>
    </div>
  )
})
