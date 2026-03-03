import { useState } from 'react'
import type { CronJob } from '@/types/cron'

interface Props {
  job: CronJob | null   // null = new
  onSave: (job: Partial<CronJob>) => void
  onClose: () => void
}

const AGENTS = ['main', 'persey', 'meda', 'desi']
const MODELS  = ['sonnet', 'opus', 'haiku', 'gpt-4o', 'gemini-2.0-flash']
const TZ_OPTIONS = ['Europe/Minsk', 'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo']

export function CronEditor({ job, onSave, onClose }: Props) {
  const isNew = !job

  const [name, setName]             = useState(job?.name || '')
  const [desc, setDesc]             = useState(job?.description || '')
  const [agentId, setAgentId]       = useState(job?.agentId || 'main')
  const [enabled, setEnabled]       = useState(job?.enabled ?? true)
  const [schedKind, setSchedKind]   = useState<'cron' | 'every'>(job?.schedule?.kind || 'cron')
  const [cronExpr, setCronExpr]     = useState(job?.schedule?.expr || '0 9 * * *')
  const [everyMs, setEveryMs]       = useState<number>((job?.schedule?.everyMs || 3600000) / 60000) // show in minutes
  const [tz, setTz]                 = useState(job?.schedule?.tz || 'Europe/Minsk')
  const [message, setMessage]       = useState(job?.payload?.message || '')
  const [model, setModel]           = useState(job?.payload?.model || 'sonnet')
  const [timeout, setTimeout_]      = useState(job?.payload?.timeoutSeconds || 300)
  const [deliveryMode, setDelivMode]= useState(job?.delivery?.mode || 'announce')
  const [delivChan, setDelivChan]   = useState(job?.delivery?.channel || 'telegram')
  const [delivTo, setDelivTo]       = useState(job?.delivery?.to || '')

  const CRON_PRESETS = [
    { label: 'Every day 9am',  expr: '0 9 * * *' },
    { label: 'Every day 5pm',  expr: '0 17 * * *' },
    { label: 'Every Monday',   expr: '0 9 * * 1' },
    { label: 'Every hour',     expr: '0 * * * *' },
    { label: 'Every 6 hours',  expr: '0 */6 * * *' },
  ]

  const handleSubmit = () => {
    if (!name.trim()) { alert('Name is required'); return }
    if (!message.trim()) { alert('Message/prompt is required'); return }

    const payload: Partial<CronJob> = {
      name: name.trim(),
      description: desc.trim() || undefined,
      agentId: agentId || undefined,
      enabled,
      schedule: schedKind === 'cron'
        ? { kind: 'cron', expr: cronExpr, tz }
        : { kind: 'every', everyMs: everyMs * 60000, tz },
      sessionTarget: 'isolated',
      wakeMode: 'now',
      payload: {
        kind: 'agentTurn',
        message: message.trim(),
        model,
        timeoutSeconds: timeout,
      },
      delivery: deliveryMode !== 'none' ? {
        mode: deliveryMode as any,
        channel: delivChan,
        to: delivTo.trim() || undefined,
      } : undefined,
    }
    onSave(payload)
  }

  return (
    <div className="cron-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cron-modal">
        <div className="cron-modal-header">
          <span>{isNew ? '+ New Cron Job' : `Edit: ${job.name}`}</span>
          <button className="cron-btn" onClick={onClose}>✕</button>
        </div>

        <div className="cron-modal-body">
          {/* Basic info */}
          <div className="cf-group">
            <label className="cf-label">Name *</label>
            <input className="cf-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. daily-review" />
          </div>

          <div className="cf-group">
            <label className="cf-label">Description</label>
            <input className="cf-input" value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="What this job does..." />
          </div>

          <div className="cf-row">
            <div className="cf-group" style={{ flex: 1 }}>
              <label className="cf-label">Agent</label>
              <select className="cf-select" value={agentId} onChange={e => setAgentId(e.target.value)}>
                {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="cf-group" style={{ flex: 1 }}>
              <label className="cf-label">Enabled</label>
              <div className="cf-toggle-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  className={`toggle-switch${enabled ? ' on' : ''}`}
                  onClick={() => setEnabled(!enabled)}
                />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: enabled ? 'var(--coral)' : 'var(--text-ghost)' }}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="cf-section-title">Schedule</div>
          <div className="cf-row">
            <button
              className={`cf-tab ${schedKind === 'cron' ? 'cf-tab-active' : ''}`}
              onClick={() => setSchedKind('cron')}
            >Cron expression</button>
            <button
              className={`cf-tab ${schedKind === 'every' ? 'cf-tab-active' : ''}`}
              onClick={() => setSchedKind('every')}
            >Repeat every</button>
          </div>

          {schedKind === 'cron' ? (
            <div className="cf-group">
              <input className="cf-input cf-mono" value={cronExpr}
                onChange={e => setCronExpr(e.target.value)}
                placeholder="0 9 * * *" />
              <div className="cf-presets">
                {CRON_PRESETS.map(p => (
                  <button key={p.expr} className="cf-preset" onClick={() => setCronExpr(p.expr)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="cf-group">
              <div className="cf-row cf-align">
                <span style={{ color: 'var(--t3)', fontSize: 13 }}>Every</span>
                <input className="cf-input cf-mono" style={{ width: 80 }}
                  type="number" value={everyMs}
                  onChange={e => setEveryMs(Number(e.target.value))} min={1} />
                <span style={{ color: 'var(--t3)', fontSize: 13 }}>minutes</span>
                <span style={{ color: 'var(--t3)', fontSize: 12, marginLeft: 4 }}>
                  ({everyMs < 60 ? `${everyMs}m` : everyMs < 1440 ? `${(everyMs/60).toFixed(1)}h` : `${(everyMs/1440).toFixed(1)}d`})
                </span>
              </div>
            </div>
          )}

          <div className="cf-group">
            <label className="cf-label">Timezone</label>
            <select className="cf-select" value={tz} onChange={e => setTz(e.target.value)}>
              {TZ_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Payload */}
          <div className="cf-section-title">Prompt / Message</div>
          <div className="cf-group">
            <textarea className="cf-textarea" value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What the agent should do when this cron fires..."
              rows={6} />
          </div>

          <div className="cf-row">
            <div className="cf-group" style={{ flex: 1 }}>
              <label className="cf-label">Model</label>
              <select className="cf-select" value={model} onChange={e => setModel(e.target.value)}>
                {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="cf-group" style={{ flex: 1 }}>
              <label className="cf-label">Timeout (seconds)</label>
              <input className="cf-input cf-mono" type="number"
                value={timeout} onChange={e => setTimeout_(Number(e.target.value))} min={30} max={3600} />
            </div>
          </div>

          {/* Delivery */}
          <div className="cf-section-title">Delivery</div>
          <div className="cf-row">
            {(['announce', 'silent', 'none'] as const).map(m => (
              <button key={m}
                className={`cf-tab ${deliveryMode === m ? 'cf-tab-active' : ''}`}
                onClick={() => setDelivMode(m)}
              >{m}</button>
            ))}
          </div>

          {deliveryMode !== 'none' && (
            <div className="cf-row">
              <div className="cf-group" style={{ flex: 1 }}>
                <label className="cf-label">Channel</label>
                <input className="cf-input" value={delivChan}
                  onChange={e => setDelivChan(e.target.value)} placeholder="telegram" />
              </div>
              <div className="cf-group" style={{ flex: 2 }}>
                <label className="cf-label">To (chat ID or channel name)</label>
                <input className="cf-input cf-mono" value={delivTo}
                  onChange={e => setDelivTo(e.target.value)} placeholder="-100123456789:topic:2" />
              </div>
            </div>
          )}
        </div>

        <div className="cron-modal-footer">
          <button className="cf-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="cf-btn-save" onClick={handleSubmit}>
            {isNew ? 'Create Job' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
