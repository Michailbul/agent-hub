import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * V6 "Coral Reef" Syntax Theme
 * Palette: Warm coral, amber, peach on deep ocean midnight
 * Tropical ocean at dusk — warm glass, vibrant coral tones
 */

const coral      = '#FF7A64'
const amber      = '#E8A44A'
const peach      = '#FFB088'
const seaGreen   = '#5CAA7A'
const textBase   = '#F2EBE5'
const textSecondary = '#8A7E74'
const textTertiary  = '#4A4038'

export const v6Highlight = HighlightStyle.define([
  // Headings — coral reef scale (coral → amber → peach)
  { tag: t.heading1, color: coral,  fontWeight: '800', fontSize: '1.2em',  letterSpacing: '-0.025em' },
  { tag: t.heading2, color: amber,  fontWeight: '700', fontSize: '1.08em', letterSpacing: '-0.02em'  },
  { tag: t.heading3, color: peach,  fontWeight: '700' },
  { tag: t.heading,  color: amber,  fontWeight: '600' },

  // Emphasis
  { tag: t.strong,        color: coral,          fontWeight: '700' },
  { tag: t.emphasis,      color: textSecondary,   fontStyle: 'italic' },
  { tag: t.strikethrough, color: textTertiary,    textDecoration: 'line-through' },

  // Code — sea green
  { tag: t.monospace,             color: seaGreen, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92em' },
  { tag: t.processingInstruction, color: seaGreen },

  // Links — amber with warm underline
  { tag: t.link, color: amber, textDecoration: 'underline', textDecorationColor: 'rgba(232,164,74,0.35)' },
  { tag: t.url,  color: amber },

  // Lists & punctuation
  { tag: t.list,        color: coral },
  { tag: t.punctuation, color: textTertiary, opacity: '0.5' },

  // Blockquote
  { tag: t.quote, color: peach, fontStyle: 'italic' },

  // Meta / comments
  { tag: t.comment, color: textTertiary, fontStyle: 'italic' },
  { tag: t.meta,    color: textTertiary },

  // Base
  { tag: t.content, color: textBase },
  { tag: t.name,    color: textBase },
])

export const v6EditorTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'transparent',
    color: '#F2EBE5',
  },
  '.cm-content': {
    padding: '28px 36px 80px',
    lineHeight: '1.75',
    caretColor: coral,
    maxWidth: '680px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  '.cm-gutters': {
    background: 'transparent',
    color: '#4A4038',
    border: 'none',
    borderRight: '1px solid rgba(255,122,100,0.06)',
    paddingRight: '12px',
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(255,122,100,0.06)',
    color: coral,
  },
  '.cm-activeLine': {
    background: 'rgba(255,122,100,0.04)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(255,122,100,0.12) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(255,122,100,0.18) !important',
  },
  '.cm-cursor': {
    borderLeft: `2px solid ${coral}`,
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(255,122,100,0.12)',
    outline: '1px solid rgba(255,122,100,0.35)',
  },
  '.cm-line .tok-heading, .cm-line .cm-headerMark': {
    color: coral,
    opacity: '0.6',
  },
})

export const v6Theme = [
  v6EditorTheme,
  syntaxHighlighting(v6Highlight),
]
