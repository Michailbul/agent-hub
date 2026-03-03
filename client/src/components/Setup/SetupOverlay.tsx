import { useRef, useEffect } from 'react'
import { useSetup } from '@/hooks/useSetup'

export function SetupOverlay() {
  const { cli, lines, scanning, done, startSetup } = useSetup()
  const termRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight
    }
  }, [lines])

  const cliBadge = () => {
    if (cli === 'claude') return '✓ Claude Code detected'
    if (cli === 'codex') return '✓ Codex CLI detected'
    return '\u26A0\uFE0F No CLI found on this machine — manual config required'
  }

  return (
    <div className="setup-overlay">
      <div className="setup-card">
        <div className="setup-eyebrow">⚙️ Agent Hub · First Run</div>
        <h1 className="setup-title">
          Set up your <span>workspace</span>
        </h1>
        <div
          className="setup-cli-badge"
          style={cli && cli !== 'claude' && cli !== 'codex' ? { color: 'var(--coral)' } : undefined}
        >
          {cliBadge()}
        </div>
        <p style={{ fontSize: 13, color: 'var(--t3)', margin: 0, lineHeight: 1.6 }}>
          Agent Hub will scan your machine for OpenClaw workspaces, agents, and skills &mdash; then
          write a config file automatically.
        </p>
        <div className="setup-term" ref={termRef}>
          {lines.length === 0 && (
            <span className="t-dim">// Ready to scan. Click the button to start.</span>
          )}
          {lines.map((line, i) => (
            <div key={i} className={line.className}>
              {line.text}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn-p" onClick={startSetup} disabled={scanning || done}>
            {scanning ? '⏳ Scanning...' : done ? '✓ Done' : '⚡ Scan my workspace'}
          </button>
          {done && (
            <button
              className="btn-p"
              style={{ background: 'var(--coral)', borderColor: 'var(--coral)' }}
              onClick={() => location.reload()}
            >
              🚀 Launch Hub →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
