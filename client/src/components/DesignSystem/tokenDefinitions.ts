export type TokenGroup =
  | 'core'
  | 'text'
  | 'interactive'
  | 'accent'
  | 'shadows'
  | 'typography'

export type TokenType = 'color' | 'shadow' | 'font' | 'number'

export interface TokenDef {
  key: string          // CSS var name without -- prefix, e.g. "sh-bg"
  label: string
  group: TokenGroup
  type: TokenType
}

export const TOKEN_GROUPS: { key: TokenGroup; label: string }[] = [
  { key: 'core', label: 'Core Colors' },
  { key: 'text', label: 'Text Hierarchy' },
  { key: 'interactive', label: 'Interactive States' },
  { key: 'accent', label: 'Accent & Status' },
  { key: 'shadows', label: 'Shadows & Effects' },
  { key: 'typography', label: 'Typography' },
]

export const TOKEN_DEFS: TokenDef[] = [
  // Core Colors
  { key: 'sh-bg', label: 'Background', group: 'core', type: 'color' },
  { key: 'sh-surface', label: 'Surface', group: 'core', type: 'color' },
  { key: 'sh-border', label: 'Border', group: 'core', type: 'color' },
  { key: 'sh-border-hover', label: 'Border Hover', group: 'core', type: 'color' },
  { key: 'sh-sidebar-bg', label: 'Sidebar BG', group: 'core', type: 'color' },
  { key: 'sh-ink', label: 'Ink', group: 'core', type: 'color' },

  // Text Hierarchy
  { key: 'sh-text-primary', label: 'Primary', group: 'text', type: 'color' },
  { key: 'sh-text-secondary', label: 'Secondary', group: 'text', type: 'color' },
  { key: 'sh-text-tertiary', label: 'Tertiary', group: 'text', type: 'color' },
  { key: 'sh-text-ghost', label: 'Ghost', group: 'text', type: 'color' },

  // Interactive States
  { key: 'sh-surface-hover', label: 'Surface Hover', group: 'interactive', type: 'color' },
  { key: 'sh-surface-active', label: 'Surface Active', group: 'interactive', type: 'color' },
  { key: 'sh-selection', label: 'Selection', group: 'interactive', type: 'color' },
  { key: 'sh-selection-active', label: 'Selection Active', group: 'interactive', type: 'color' },
  { key: 'sh-coral-light', label: 'Coral Light', group: 'interactive', type: 'color' },
  { key: 'sh-coral-subtle', label: 'Coral Subtle', group: 'interactive', type: 'color' },
  { key: 'sh-focus-ring', label: 'Focus Ring', group: 'interactive', type: 'color' },

  // Accent & Status
  { key: 'sh-primary', label: 'Primary', group: 'accent', type: 'color' },
  { key: 'sh-primary-fg', label: 'Primary FG', group: 'accent', type: 'color' },
  { key: 'sh-accent', label: 'Accent', group: 'accent', type: 'color' },
  { key: 'sh-coral', label: 'Coral', group: 'accent', type: 'color' },
  { key: 'sh-coral-hover', label: 'Coral Hover', group: 'accent', type: 'color' },
  { key: 'sh-blue', label: 'Blue', group: 'accent', type: 'color' },
  { key: 'sh-blue-light', label: 'Blue Light', group: 'accent', type: 'color' },
  { key: 'sh-green', label: 'Green', group: 'accent', type: 'color' },
  { key: 'sh-green-light', label: 'Green Light', group: 'accent', type: 'color' },
  { key: 'sh-red', label: 'Red', group: 'accent', type: 'color' },

  // Shadows & Effects
  { key: 'sh-shadow-sm', label: 'Shadow SM', group: 'shadows', type: 'shadow' },
  { key: 'sh-shadow-md', label: 'Shadow MD', group: 'shadows', type: 'shadow' },
  { key: 'sh-shadow-cmd', label: 'Shadow CMD', group: 'shadows', type: 'shadow' },
  { key: 'sh-blur', label: 'Blur', group: 'shadows', type: 'shadow' },

  // Typography
  { key: 'sh-font', label: 'Font Family', group: 'typography', type: 'font' },
  { key: 'sh-font-mono', label: 'Mono Font', group: 'typography', type: 'font' },
  { key: 'sh-radius', label: 'Border Radius', group: 'typography', type: 'number' },
]

export type TokenMap = Record<string, string>

export const DEFAULT_LIGHT: TokenMap = {
  'sh-bg': '#FFFFFF',
  'sh-surface': '#F7F7F8',
  'sh-surface-hover': 'rgba(0,0,0,0.03)',
  'sh-surface-active': 'rgba(0,0,0,0.06)',
  'sh-ink': '#0D0D0D',
  'sh-text-primary': '#0D0D0D',
  'sh-text-secondary': '#666666',
  'sh-text-tertiary': '#999999',
  'sh-text-ghost': '#CCCCCC',
  'sh-border': '#EBEBEB',
  'sh-border-hover': '#D4D4D4',
  'sh-coral': '#0D0D0D',
  'sh-coral-hover': '#000000',
  'sh-coral-light': 'rgba(0,0,0,0.04)',
  'sh-coral-subtle': 'rgba(0,0,0,0.02)',
  'sh-green': '#22C55E',
  'sh-green-light': 'rgba(34,197,94,0.1)',
  'sh-blue': '#0D0D0D',
  'sh-blue-light': 'rgba(0,0,0,0.05)',
  'sh-red': '#EF4444',
  'sh-primary': '#0D0D0D',
  'sh-primary-fg': '#FFFFFF',
  'sh-focus-ring': 'rgba(0,0,0,0.12)',
  'sh-accent': '#0D0D0D',
  'sh-shadow-sm': '0 1px 2px rgba(0,0,0,0.04)',
  'sh-shadow-md': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
  'sh-shadow-cmd': '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
  'sh-blur': 'none',
  'sh-sidebar-bg': '#F7F7F8',
  'sh-selection': 'rgba(0,0,0,0.05)',
  'sh-selection-active': 'rgba(0,0,0,0.08)',
  'sh-font': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  'sh-font-mono': "'SF Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  'sh-radius': '0',
}

export const DEFAULT_DARK: TokenMap = {
  'sh-bg': '#191A1A',
  'sh-surface': '#202222',
  'sh-surface-hover': 'rgba(255,255,255,0.05)',
  'sh-surface-active': 'rgba(255,255,255,0.08)',
  'sh-ink': '#E8E8E8',
  'sh-text-primary': '#E8E8E8',
  'sh-text-secondary': '#8E8E8E',
  'sh-text-tertiary': '#555555',
  'sh-text-ghost': '#333333',
  'sh-border': 'rgba(255,255,255,0.07)',
  'sh-border-hover': 'rgba(255,255,255,0.12)',
  'sh-coral': '#E8E8E8',
  'sh-coral-hover': '#FFFFFF',
  'sh-coral-light': 'rgba(255,255,255,0.06)',
  'sh-coral-subtle': 'rgba(255,255,255,0.02)',
  'sh-green': '#22C55E',
  'sh-green-light': 'rgba(34,197,94,0.14)',
  'sh-blue': '#E8E8E8',
  'sh-blue-light': 'rgba(255,255,255,0.06)',
  'sh-red': '#EF4444',
  'sh-primary': '#E8E8E8',
  'sh-primary-fg': '#191A1A',
  'sh-focus-ring': 'rgba(255,255,255,0.15)',
  'sh-accent': '#E8E8E8',
  'sh-shadow-sm': '0 1px 2px rgba(0,0,0,0.4)',
  'sh-shadow-md': '0 2px 8px rgba(0,0,0,0.4)',
  'sh-shadow-cmd': '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
  'sh-blur': 'none',
  'sh-sidebar-bg': '#1E1F1F',
  'sh-selection': 'rgba(255,255,255,0.06)',
  'sh-selection-active': 'rgba(255,255,255,0.1)',
  'sh-font': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  'sh-font-mono': "'SF Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  'sh-radius': '0',
}
