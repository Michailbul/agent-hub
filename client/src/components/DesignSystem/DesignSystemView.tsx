import { useState, useCallback, useMemo, useEffect } from 'react'
import type { TokenMap } from './tokenDefinitions'
import { TOKEN_DEFS, DEFAULT_LIGHT, DEFAULT_DARK } from './tokenDefinitions'
import { PRESETS } from './presets'
import { copyCSS } from './exportTokens'
import { TokenEditor } from './TokenEditor'
import { SkillsLabPreview } from './SkillsLabPreview'
import './design-system.css'

const LS_KEY = 'design-system-tokens'

interface StoredState {
  light: TokenMap
  dark: TokenMap
  editingMode: 'light' | 'dark'
  previewMode: 'light' | 'dark'
  activePreset: string | null
}

function loadStored(): StoredState | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as StoredState
  } catch { /* ignore */ }
  return null
}

function saveStored(state: StoredState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export function DesignSystemView() {
  const stored = useMemo(() => loadStored(), [])

  const [lightTokens, setLightTokens] = useState<TokenMap>(() => stored?.light ?? { ...DEFAULT_LIGHT })
  const [darkTokens, setDarkTokens] = useState<TokenMap>(() => stored?.dark ?? { ...DEFAULT_DARK })
  const [editingMode, setEditingMode] = useState<'light' | 'dark'>(() => stored?.editingMode ?? 'light')
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>(() => stored?.previewMode ?? 'light')
  const [activePreset, setActivePreset] = useState<string | null>(() => stored?.activePreset ?? 'current')
  const [colorful, setColorful] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  // Persist on change
  useEffect(() => {
    saveStored({ light: lightTokens, dark: darkTokens, editingMode, previewMode, activePreset })
  }, [lightTokens, darkTokens, editingMode, previewMode, activePreset])

  const currentTokens = editingMode === 'light' ? lightTokens : darkTokens
  const setCurrentTokens = editingMode === 'light' ? setLightTokens : setDarkTokens

  const handleTokenChange = useCallback((key: string, value: string) => {
    setCurrentTokens(prev => ({ ...prev, [key]: value }))
    setActivePreset(null) // user modified, no longer a preset
  }, [setCurrentTokens])

  const handlePresetChange = useCallback((presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return
    setLightTokens({ ...preset.light })
    setDarkTokens({ ...preset.dark })
    setActivePreset(presetId)
  }, [])

  const handleReset = useCallback(() => {
    setLightTokens({ ...DEFAULT_LIGHT })
    setDarkTokens({ ...DEFAULT_DARK })
    setActivePreset('current')
  }, [])

  const handleCopyCSS = useCallback(async () => {
    const ok = await copyCSS(lightTokens, darkTokens)
    setToast(ok ? 'CSS copied to clipboard' : 'Failed to copy')
    setTimeout(() => setToast(null), 2000)
  }, [lightTokens, darkTokens])

  // Build preview style object: override all --sh-* vars
  const previewTokens = previewMode === 'light' ? lightTokens : darkTokens
  const previewStyle = useMemo(() => {
    const style: Record<string, string> = {}
    for (const def of TOKEN_DEFS) {
      const val = previewTokens[def.key]
      if (val != null) style[`--${def.key}`] = val
    }
    return style as React.CSSProperties
  }, [previewTokens])

  return (
    <div className="ds-page">
      <TokenEditor
        tokens={currentTokens}
        onTokenChange={handleTokenChange}
        editingMode={editingMode}
        onEditingModeChange={setEditingMode}
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        onReset={handleReset}
        onCopyCSS={handleCopyCSS}
      />
      <div className="ds-preview-area">
        <div className="ds-preview-toolbar">
          <span className="ds-preview-label">Preview</span>
          <div className="ds-preview-mode-toggle">
            <button
              className={`ds-mode-btn${previewMode === 'light' ? ' active' : ''}`}
              onClick={() => setPreviewMode('light')}
            >Light</button>
            <button
              className={`ds-mode-btn${previewMode === 'dark' ? ' active' : ''}`}
              onClick={() => setPreviewMode('dark')}
            >Dark</button>
          </div>
          <button
            className={`ds-mode-btn${colorful ? ' active' : ''}`}
            onClick={() => setColorful(c => !c)}
            title="Tint selections and active states with accent color"
          >Colorful</button>
        </div>
        <div className="ds-preview-container" style={previewStyle}>
          <SkillsLabPreview colorful={colorful} />
        </div>
      </div>

      {toast && <div className="ds-toast">{toast}</div>}
    </div>
  )
}
