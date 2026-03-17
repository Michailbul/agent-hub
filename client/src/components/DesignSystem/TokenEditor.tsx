import { useState, useCallback, useMemo } from 'react'
import type { TokenGroup, TokenMap, TokenType } from './tokenDefinitions'
import { TOKEN_GROUPS, TOKEN_DEFS } from './tokenDefinitions'
import { PRESETS } from './presets'

interface TokenEditorProps {
  tokens: TokenMap
  onTokenChange: (key: string, value: string) => void
  editingMode: 'light' | 'dark'
  onEditingModeChange: (mode: 'light' | 'dark') => void
  activePreset: string | null
  onPresetChange: (presetId: string) => void
  onReset: () => void
  onCopyCSS: () => void
}

const FONT_SUGGESTIONS = [
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  "'Geist Sans', 'Inter', -apple-system, sans-serif",
  "'DM Sans', 'Inter', -apple-system, sans-serif",
  "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
  "'JetBrains Mono', 'SF Mono', ui-monospace, monospace",
  "'Geist Mono', 'SF Mono', ui-monospace, monospace",
  "'SF Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  "'Fira Code', 'SF Mono', ui-monospace, monospace",
]

/** Convert any valid CSS color to a hex string for the color picker */
function toHex6(v: string): string {
  const trimmed = v.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/#(.)(.)(.)/)!
    return `#${r}${r}${g}${g}${b}${b}`
  }
  // For rgba/etc, return a neutral fallback for the picker
  return '#888888'
}

function ColorInput({ value, tokenKey, onChange }: { value: string; tokenKey: string; onChange: (key: string, v: string) => void }) {
  const hexValue = useMemo(() => toHex6(value), [value])

  return (
    <div className="ds-color-input">
      <div className="ds-color-swatch-wrap">
        <div className="ds-color-swatch" style={{ background: value }} />
        <input
          type="color"
          className="ds-color-picker"
          value={hexValue}
          onChange={e => onChange(tokenKey, e.target.value)}
        />
      </div>
      <input
        type="text"
        className="ds-token-text-input"
        value={value}
        onChange={e => onChange(tokenKey, e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}

function ShadowInput({ value, tokenKey, onChange }: { value: string; tokenKey: string; onChange: (key: string, v: string) => void }) {
  return (
    <div className="ds-shadow-input">
      <div className="ds-shadow-preview" style={{ boxShadow: value }} />
      <input
        type="text"
        className="ds-token-text-input"
        value={value}
        onChange={e => onChange(tokenKey, e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}

function FontInput({ value, tokenKey, onChange }: { value: string; tokenKey: string; onChange: (key: string, v: string) => void }) {
  return (
    <div className="ds-font-input">
      <input
        type="text"
        className="ds-token-text-input"
        value={value}
        onChange={e => onChange(tokenKey, e.target.value)}
        list={`ds-fonts-${tokenKey}`}
        spellCheck={false}
      />
      <datalist id={`ds-fonts-${tokenKey}`}>
        {FONT_SUGGESTIONS.map(f => <option key={f} value={f} />)}
      </datalist>
    </div>
  )
}

function NumberInput({ value, tokenKey, onChange }: { value: string; tokenKey: string; onChange: (key: string, v: string) => void }) {
  const num = parseFloat(value) || 0
  return (
    <div className="ds-number-input">
      <input
        type="range"
        min={0}
        max={24}
        step={1}
        value={num}
        onChange={e => onChange(tokenKey, e.target.value)}
        className="ds-range-slider"
      />
      <input
        type="number"
        className="ds-token-num-input"
        value={value}
        min={0}
        max={24}
        onChange={e => onChange(tokenKey, e.target.value)}
      />
    </div>
  )
}

function TokenInput({ type, value, tokenKey, onChange }: { type: TokenType; value: string; tokenKey: string; onChange: (key: string, v: string) => void }) {
  switch (type) {
    case 'color': return <ColorInput value={value} tokenKey={tokenKey} onChange={onChange} />
    case 'shadow': return <ShadowInput value={value} tokenKey={tokenKey} onChange={onChange} />
    case 'font': return <FontInput value={value} tokenKey={tokenKey} onChange={onChange} />
    case 'number': return <NumberInput value={value} tokenKey={tokenKey} onChange={onChange} />
  }
}

export function TokenEditor({
  tokens,
  onTokenChange,
  editingMode,
  onEditingModeChange,
  activePreset,
  onPresetChange,
  onReset,
  onCopyCSS,
}: TokenEditorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<TokenGroup>>(
    () => new Set(TOKEN_GROUPS.map(g => g.key))
  )

  const toggleGroup = useCallback((group: TokenGroup) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<TokenGroup, typeof TOKEN_DEFS>()
    for (const g of TOKEN_GROUPS) map.set(g.key, [])
    for (const t of TOKEN_DEFS) map.get(t.group)!.push(t)
    return map
  }, [])

  return (
    <div className="ds-editor">
      {/* Header */}
      <div className="ds-editor-header">
        <h2 className="ds-editor-title">Design Tokens</h2>
        <div className="ds-mode-toggle">
          <button
            className={`ds-mode-btn${editingMode === 'light' ? ' active' : ''}`}
            onClick={() => onEditingModeChange('light')}
          >Light</button>
          <button
            className={`ds-mode-btn${editingMode === 'dark' ? ' active' : ''}`}
            onClick={() => onEditingModeChange('dark')}
          >Dark</button>
        </div>
      </div>

      {/* Token groups */}
      <div className="ds-groups">
        {TOKEN_GROUPS.map(group => {
          const defs = grouped.get(group.key)!
          const expanded = expandedGroups.has(group.key)
          return (
            <div key={group.key} className="ds-group">
              <button
                className="ds-group-header"
                onClick={() => toggleGroup(group.key)}
              >
                <span className={`ds-group-chevron${expanded ? ' open' : ''}`}>&#x25B8;</span>
                <span className="ds-group-label">{group.label}</span>
                <span className="ds-group-count">{defs.length}</span>
              </button>
              {expanded && (
                <div className="ds-group-body">
                  {defs.map(def => (
                    <div key={def.key} className="ds-token-row">
                      <label className="ds-token-label">{def.label}</label>
                      <TokenInput
                        type={def.type}
                        value={tokens[def.key] || ''}
                        tokenKey={def.key}
                        onChange={onTokenChange}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom toolbar */}
      <div className="ds-toolbar">
        <select
          className="ds-preset-select"
          value={activePreset || ''}
          onChange={e => onPresetChange(e.target.value)}
        >
          <option value="" disabled>Presets...</option>
          {PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        <button className="ds-toolbar-btn" onClick={onCopyCSS}>Copy CSS</button>
        <button className="ds-toolbar-btn ds-toolbar-btn-ghost" onClick={onReset}>Reset</button>
      </div>
    </div>
  )
}
