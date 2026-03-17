import type { TokenMap } from './tokenDefinitions'

export interface Preset {
  id: string
  label: string
  light: TokenMap
  dark: TokenMap
}

/*
 * Architecture: shared neutral base + accent-only overrides.
 *
 * The base is IDENTICAL across all presets — black/white bg, neutral gray
 * surfaces, borders, text hierarchy, shadows. The ONLY thing that changes
 * per-preset is the accent color, applied to a small set of tokens:
 * sh-coral, sh-primary, sh-accent, sh-blue, and their light/hover variants.
 *
 * The accent is a punctuation mark, not a wash.
 */

const LIGHT_BASE: TokenMap = {
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
  'sh-green': '#22C55E',
  'sh-green-light': 'rgba(34,197,94,0.1)',
  'sh-red': '#EF4444',
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
  // Accent defaults (monochrome — accent = ink)
  'sh-coral': '#0D0D0D',
  'sh-coral-hover': '#000000',
  'sh-coral-light': 'rgba(0,0,0,0.04)',
  'sh-coral-subtle': 'rgba(0,0,0,0.02)',
  'sh-primary': '#0D0D0D',
  'sh-primary-fg': '#FFFFFF',
  'sh-accent': '#0D0D0D',
  'sh-blue': '#0D0D0D',
  'sh-blue-light': 'rgba(0,0,0,0.05)',
  'sh-focus-ring': 'rgba(0,0,0,0.12)',
}

const DARK_BASE: TokenMap = {
  'sh-bg': '#111111',
  'sh-surface': '#191919',
  'sh-surface-hover': 'rgba(255,255,255,0.04)',
  'sh-surface-active': 'rgba(255,255,255,0.07)',
  'sh-ink': '#E8E8E8',
  'sh-text-primary': '#E8E8E8',
  'sh-text-secondary': '#8E8E8E',
  'sh-text-tertiary': '#555555',
  'sh-text-ghost': '#333333',
  'sh-border': 'rgba(255,255,255,0.08)',
  'sh-border-hover': 'rgba(255,255,255,0.14)',
  'sh-green': '#22C55E',
  'sh-green-light': 'rgba(34,197,94,0.14)',
  'sh-red': '#EF4444',
  'sh-shadow-sm': '0 1px 2px rgba(0,0,0,0.4)',
  'sh-shadow-md': '0 2px 8px rgba(0,0,0,0.4)',
  'sh-shadow-cmd': '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
  'sh-blur': 'none',
  'sh-sidebar-bg': '#161616',
  'sh-selection': 'rgba(255,255,255,0.05)',
  'sh-selection-active': 'rgba(255,255,255,0.09)',
  'sh-font': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  'sh-font-mono': "'SF Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  'sh-radius': '0',
  // Accent defaults (monochrome — accent = ink)
  'sh-coral': '#E8E8E8',
  'sh-coral-hover': '#FFFFFF',
  'sh-coral-light': 'rgba(255,255,255,0.06)',
  'sh-coral-subtle': 'rgba(255,255,255,0.02)',
  'sh-primary': '#E8E8E8',
  'sh-primary-fg': '#111111',
  'sh-accent': '#E8E8E8',
  'sh-blue': '#E8E8E8',
  'sh-blue-light': 'rgba(255,255,255,0.06)',
  'sh-focus-ring': 'rgba(255,255,255,0.15)',
}

// Accent-only override helper
interface AccentSpec {
  light: string       // accent hex for light mode
  dark: string        // accent hex for dark mode (usually -400 variant)
  lightFg?: string    // text on accent button in light mode (default: #FFFFFF)
  darkFg?: string     // text on accent button in dark mode (default: #FFFFFF)
  radius?: string     // override border radius
  font?: string       // override font
  fontMono?: string   // override mono font
}

function accent(spec: AccentSpec): { light: TokenMap; dark: TokenMap } {
  const { light: l, dark: d, lightFg = '#FFFFFF', darkFg = '#FFFFFF' } = spec
  // Parse hex to get rgb for rgba()
  const lrgb = hexToRgb(l)
  const drgb = hexToRgb(d)

  const lightOverrides: TokenMap = {
    'sh-coral': l,
    'sh-coral-hover': darken(l, 12),
    'sh-coral-light': `rgba(${lrgb},0.08)`,
    'sh-coral-subtle': `rgba(${lrgb},0.03)`,
    'sh-primary': l,
    'sh-primary-fg': lightFg,
    'sh-accent': l,
    'sh-blue': l,
    'sh-blue-light': `rgba(${lrgb},0.06)`,
    'sh-focus-ring': `rgba(${lrgb},0.15)`,
  }
  if (spec.radius) lightOverrides['sh-radius'] = spec.radius
  if (spec.font) lightOverrides['sh-font'] = spec.font
  if (spec.fontMono) lightOverrides['sh-font-mono'] = spec.fontMono

  const darkOverrides: TokenMap = {
    'sh-coral': d,
    'sh-coral-hover': lighten(d, 15),
    'sh-coral-light': `rgba(${drgb},0.10)`,
    'sh-coral-subtle': `rgba(${drgb},0.04)`,
    'sh-primary': d,
    'sh-primary-fg': darkFg,
    'sh-accent': d,
    'sh-blue': d,
    'sh-blue-light': `rgba(${drgb},0.08)`,
    'sh-focus-ring': `rgba(${drgb},0.20)`,
  }
  if (spec.radius) darkOverrides['sh-radius'] = spec.radius
  if (spec.font) darkOverrides['sh-font'] = spec.font
  if (spec.fontMono) darkOverrides['sh-font-mono'] = spec.fontMono

  return { light: lightOverrides, dark: darkOverrides }
}

// ── Color utilities ──

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`
}

function clamp(n: number): number { return Math.max(0, Math.min(255, Math.round(n))) }

function darken(hex: string, pct: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  const r = clamp(((n >> 16) & 255) * (1 - pct / 100))
  const g = clamp(((n >> 8) & 255) * (1 - pct / 100))
  const b = clamp((n & 255) * (1 - pct / 100))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`
}

function lighten(hex: string, pct: number): string {
  const h = hex.replace('#', '')
  const n = parseInt(h, 16)
  const r = clamp(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * pct / 100)
  const g = clamp(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * pct / 100)
  const b = clamp((n & 255) + (255 - (n & 255)) * pct / 100)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`
}

// ── Preset definitions ──

const claude = accent({
  light: '#C27A50',  // oklch(0.62 0.14 39.15) — warm terracotta
  dark: '#D4885C',   // oklch(0.67 0.13 38.92) — lighter for dark bg
  radius: '8',
  font: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
  fontMono: "'Geist Mono', 'SF Mono', ui-monospace, monospace",
})

// ── Gradient-inspired presets ──
// Each color is the sweet-spot midpoint of a premium gradient,
// the single hue that captures the whole gradient's energy.

// Gradient Sunset — the orange→magenta horizon, warm coral-pink
const gradientSunset = accent({ light: '#E2654D', dark: '#F07B68', radius: '8' })

// Gradient Ocean — deep sea blue→teal, moody and immersive
const gradientOcean = accent({ light: '#0C7DA0', dark: '#22B8CF', radius: '6' })

// Gradient Aurora — northern lights green→violet, electric and rare
const gradientAurora = accent({ light: '#7048B6', dark: '#9F7AEA', radius: '8' })

// Gradient Dusk — twilight purple→rose, soft and atmospheric
const gradientDusk = accent({ light: '#B44AC0', dark: '#D88CE0', radius: '10' })

// Gradient Solar — golden hour gold→amber, warm and radiant
const gradientSolar = accent({
  light: '#C8850C', dark: '#E8A832',
  lightFg: '#1A1000', darkFg: '#1A1000', radius: '6',
})

// Gradient Ember — fire red→orange, deep and intense
const gradientEmber = accent({ light: '#C62828', dark: '#EF5350', radius: '4' })

// Gradient Neon — electric cyan→blue, vivid and futuristic
const gradientNeon = accent({ light: '#00ACC1', dark: '#26C6DA', radius: '6' })

// Gradient Frost — icy indigo→periwinkle, cool and precise (Linear-adjacent)
const gradientFrost = accent({ light: '#5558DA', dark: '#7B7FF0', radius: '6' })

// Gradient Mint — fresh teal→emerald, natural and calming
const gradientMint = accent({ light: '#059669', dark: '#34D399', radius: '6' })

// Gradient Rose — hot pink→crimson, bold and editorial
const gradientRose = accent({ light: '#D63384', dark: '#F06292', radius: '8' })

// Gradient Midnight — deep navy→indigo, serious and elegant
const gradientMidnight = accent({ light: '#3730A3', dark: '#6366F1', radius: '6' })

// Gradient Peach — soft apricot→salmon, warm and approachable
const gradientPeach = accent({ light: '#E07842', dark: '#F4A574', radius: '10' })

// ── Studio — shadcn/studio warm terracotta ──
// Full warm palette: cream text, earthy backgrounds, terracotta accent #d87757
// NOT accent-only — overrides base neutrals with warm undertones throughout
const STUDIO_FONT = "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
const STUDIO_FONT_MONO = "'Geist Mono', 'SF Mono', ui-monospace, monospace"

const studioLight: TokenMap = {
  'sh-bg': '#FAF8F1',
  'sh-surface': '#F3F1EA',
  'sh-surface-hover': 'rgba(48,48,40,0.04)',
  'sh-surface-active': 'rgba(48,48,40,0.07)',
  'sh-ink': '#303030',
  'sh-text-primary': '#303030',
  'sh-text-secondary': '#6B6960',
  'sh-text-tertiary': '#9A9890',
  'sh-text-ghost': '#CBC9C0',
  'sh-border': 'rgba(48,48,40,0.10)',
  'sh-border-hover': 'rgba(48,48,40,0.18)',
  'sh-green': '#22C55E',
  'sh-green-light': 'rgba(34,197,94,0.1)',
  'sh-red': '#EF4444',
  'sh-shadow-sm': '0 1px 2px rgba(48,40,30,0.05)',
  'sh-shadow-md': '0 1px 3px rgba(48,40,30,0.07), 0 1px 2px rgba(48,40,30,0.04)',
  'sh-shadow-cmd': '0 16px 48px rgba(48,40,30,0.14), 0 0 0 1px rgba(48,40,30,0.05)',
  'sh-blur': 'none',
  'sh-sidebar-bg': '#F3F1EA',
  'sh-selection': 'rgba(48,48,40,0.05)',
  'sh-selection-active': 'rgba(48,48,40,0.08)',
  'sh-font': STUDIO_FONT,
  'sh-font-mono': STUDIO_FONT_MONO,
  'sh-radius': '8',
  'sh-coral': '#C27A50',
  'sh-coral-hover': '#AB6B46',
  'sh-coral-light': 'rgba(194,122,80,0.10)',
  'sh-coral-subtle': 'rgba(194,122,80,0.04)',
  'sh-primary': '#C27A50',
  'sh-primary-fg': '#FFFFFF',
  'sh-accent': '#C27A50',
  'sh-blue': '#C27A50',
  'sh-blue-light': 'rgba(194,122,80,0.06)',
  'sh-focus-ring': 'rgba(194,122,80,0.18)',
}

const studioDark: TokenMap = {
  'sh-bg': '#262626',
  'sh-surface': '#303030',
  'sh-surface-hover': 'rgba(250,248,241,0.04)',
  'sh-surface-active': 'rgba(250,248,241,0.07)',
  'sh-ink': '#C3C1BA',
  'sh-text-primary': '#C3C1BA',
  'sh-text-secondary': '#8A8880',
  'sh-text-tertiary': '#5A5850',
  'sh-text-ghost': '#3A3830',
  'sh-border': 'rgba(250,248,241,0.08)',
  'sh-border-hover': 'rgba(250,248,241,0.14)',
  'sh-green': '#22C55E',
  'sh-green-light': 'rgba(34,197,94,0.14)',
  'sh-red': '#EF4444',
  'sh-shadow-sm': '0 1px 2px rgba(0,0,0,0.4)',
  'sh-shadow-md': '0 2px 8px rgba(0,0,0,0.4)',
  'sh-shadow-cmd': '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(250,248,241,0.05)',
  'sh-blur': 'none',
  'sh-sidebar-bg': '#2A2A28',
  'sh-selection': 'rgba(250,248,241,0.05)',
  'sh-selection-active': 'rgba(250,248,241,0.08)',
  'sh-font': STUDIO_FONT,
  'sh-font-mono': STUDIO_FONT_MONO,
  'sh-radius': '8',
  'sh-coral': '#D87757',
  'sh-coral-hover': '#E08A6A',
  'sh-coral-light': 'rgba(216,119,87,0.12)',
  'sh-coral-subtle': 'rgba(216,119,87,0.05)',
  'sh-primary': '#D87757',
  'sh-primary-fg': '#FFFFFF',
  'sh-accent': '#D87757',
  'sh-blue': '#D87757',
  'sh-blue-light': 'rgba(216,119,87,0.08)',
  'sh-focus-ring': 'rgba(216,119,87,0.22)',
}

export const PRESETS: Preset[] = [
  {
    id: 'mono',
    label: 'Mono',
    light: { ...LIGHT_BASE },
    dark: { ...DARK_BASE },
  },
  {
    id: 'claude',
    label: 'Claude',
    light: { ...LIGHT_BASE, ...claude.light },
    dark: { ...DARK_BASE, ...claude.dark },
  },
  {
    id: 'studio',
    label: 'Studio',
    light: studioLight,
    dark: studioDark,
  },
  {
    id: 'gradient-sunset',
    label: 'Gradient Sunset',
    light: { ...LIGHT_BASE, ...gradientSunset.light },
    dark: { ...DARK_BASE, ...gradientSunset.dark },
  },
  {
    id: 'gradient-ocean',
    label: 'Gradient Ocean',
    light: { ...LIGHT_BASE, ...gradientOcean.light },
    dark: { ...DARK_BASE, ...gradientOcean.dark },
  },
  {
    id: 'gradient-aurora',
    label: 'Gradient Aurora',
    light: { ...LIGHT_BASE, ...gradientAurora.light },
    dark: { ...DARK_BASE, ...gradientAurora.dark },
  },
  {
    id: 'gradient-dusk',
    label: 'Gradient Dusk',
    light: { ...LIGHT_BASE, ...gradientDusk.light },
    dark: { ...DARK_BASE, ...gradientDusk.dark },
  },
  {
    id: 'gradient-solar',
    label: 'Gradient Solar',
    light: { ...LIGHT_BASE, ...gradientSolar.light },
    dark: { ...DARK_BASE, ...gradientSolar.dark },
  },
  {
    id: 'gradient-ember',
    label: 'Gradient Ember',
    light: { ...LIGHT_BASE, ...gradientEmber.light },
    dark: { ...DARK_BASE, ...gradientEmber.dark },
  },
  {
    id: 'gradient-neon',
    label: 'Gradient Neon',
    light: { ...LIGHT_BASE, ...gradientNeon.light },
    dark: { ...DARK_BASE, ...gradientNeon.dark },
  },
  {
    id: 'gradient-frost',
    label: 'Gradient Frost',
    light: { ...LIGHT_BASE, ...gradientFrost.light },
    dark: { ...DARK_BASE, ...gradientFrost.dark },
  },
  {
    id: 'gradient-mint',
    label: 'Gradient Mint',
    light: { ...LIGHT_BASE, ...gradientMint.light },
    dark: { ...DARK_BASE, ...gradientMint.dark },
  },
  {
    id: 'gradient-rose',
    label: 'Gradient Rose',
    light: { ...LIGHT_BASE, ...gradientRose.light },
    dark: { ...DARK_BASE, ...gradientRose.dark },
  },
  {
    id: 'gradient-midnight',
    label: 'Gradient Midnight',
    light: { ...LIGHT_BASE, ...gradientMidnight.light },
    dark: { ...DARK_BASE, ...gradientMidnight.dark },
  },
  {
    id: 'gradient-peach',
    label: 'Gradient Peach',
    light: { ...LIGHT_BASE, ...gradientPeach.light },
    dark: { ...DARK_BASE, ...gradientPeach.dark },
  },
]
