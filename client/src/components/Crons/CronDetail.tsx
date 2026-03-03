import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TreeData } from '@/types'
import type { CronJob } from '@/types/cron'

interface CronDetailProps {
  job: CronJob
  onSave: (updated: CronJob) => void
  onDelete: (id: string) => void
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
type SkillCategory = 'all' | 'coding' | 'content' | 'research' | 'data' | 'tools'

type SkillEntry = {
  name: string
  path: string
  agents: string[]
}

const CATEGORIES: Array<{ id: SkillCategory; label: string; keywords?: string[] }> = [
  { id: 'all', label: 'All' },
  { id: 'coding', label: 'Code', keywords: ['codex', 'coding', 'github', 'claude', 'git', 'pr', 'build'] },
  { id: 'content', label: 'Content', keywords: ['content', 'copy', 'social', 'carousel', 'writing', 'humanizer', 'ad', 'tweet', 'x-'] },
  { id: 'research', label: 'Research', keywords: ['research', 'web', 'search', 'extract', 'summarize', 'youtube', 'weather'] },
  { id: 'data', label: 'Data', keywords: ['kb', 'notion', 'data', 'enrichment', 'storage'] },
  { id: 'tools', label: 'Utils' },
]

function getCategory(name: string): SkillCategory {
  const normalized = name.toLowerCase()
  for (const category of CATEGORIES.slice(1, -1)) {
    if (category.keywords?.some(keyword => normalized.includes(keyword))) return category.id
  }
  return 'tools'
}

function skillFolderName(fullPath: string): string {
  const chunks = fullPath.split(/[\\/]/).filter(Boolean)
  return chunks.length >= 2 ? chunks[chunks.length - 2] : chunks[chunks.length - 1]
}

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

export function CronDetail({ job, onSave, onDelete }: CronDetailProps) {
  const promptRef = useRef<HTMLTextAreaElement | null>(null)

  const [agentOptions, setAgentOptions] = useState<TreeData['agents']>([])
  const [skills, setSkills] = useState<SkillEntry[]>([])

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
  const [skillsOpen, setSkillsOpen] = useState(true)
  const [skillSearch, setSkillSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<SkillCategory>('all')

  useEffect(() => {
    const loadTree = async () => {
      try {
        const response = await fetch('/api/tree')
        if (!response.ok) return
        const data = (await response.json()) as TreeData
        const agents = data.agents || []
        setAgentOptions(agents)

        const map = new Map<string, SkillEntry>()
        for (const agent of agents) {
          for (const skill of agent.skills) {
            const key = skillFolderName(skill.path)
            const normalizedKey = key.toLowerCase()
            const existing = map.get(normalizedKey)

            if (!existing) {
              map.set(normalizedKey, { name: key, path: skill.path, agents: [agent.label] })
              continue
            }

            if (!existing.agents.includes(agent.label)) {
              existing.agents.push(agent.label)
            }
          }
        }

        setSkills([...map.values()].sort((a, b) => a.name.localeCompare(b.name)))
      } catch {
        setAgentOptions([])
        setSkills([])
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
    setSkillsOpen(true)
    setSkillSearch('')
    setActiveCategory('all')
  }, [job])

  const selectedPreset = useMemo(() => {
    const match = CRON_PRESETS.find(preset => preset.expr === cronExpr)
    return match?.expr || ''
  }, [cronExpr])

  const filteredSkills = useMemo(() => {
    const query = skillSearch.trim().toLowerCase()

    return skills.filter(skill => {
      const matchesSearch = !query || skill.name.toLowerCase().includes(query)
      const matchesCategory = activeCategory === 'all' || getCategory(skill.name) === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [activeCategory, skillSearch, skills])

  const insertSkill = useCallback((skillName: string) => {
    const token = `[skill: ${skillName}]`
    setMessage(prev => {
      const node = promptRef.current
      if (!node) return `${prev}${token}`

      const start = node.selectionStart ?? prev.length
      const end = node.selectionEnd ?? prev.length
      const next = `${prev.slice(0, start)}${token}${prev.slice(end)}`

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
            <textarea
              ref={promptRef}
              className="cron-input cron-textarea"
              rows={10}
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="What should this agent do?"
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

          <div className="cron-skills-section">
            <button className="cron-advanced-toggle" onClick={() => setSkillsOpen(prev => !prev)}>
              <span>SKILLS {skillsOpen ? '▴' : '▾'}</span>
              <span className="cron-skills-hint">Click a skill to insert into prompt</span>
            </button>

            {skillsOpen && (
              <div className="cron-skills-body">
                <input
                  className="cron-skills-search"
                  placeholder="Search skills..."
                  value={skillSearch}
                  onChange={event => setSkillSearch(event.target.value)}
                />

                <div className="cron-skills-filter-bar">
                  {CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      className={`skills-filter-btn${activeCategory === category.id ? ' active' : ''}`}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>

                <div className="cron-skills-grid">
                  {filteredSkills.map(skill => (
                    <button key={skill.path} className="cron-skill-pill" onClick={() => insertSkill(skill.name)}>
                      {skill.name}
                      <span className="cron-skill-agents">
                        {skill.agents.slice(0, 2).map(agent => (
                          <span key={`${skill.path}-${agent}`} className="skill-agent-tag">{agent}</span>
                        ))}
                      </span>
                    </button>
                  ))}

                  {filteredSkills.length === 0 && <div className="crons-empty">No matching skills</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
