import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * Dark Canvas Syntax Theme
 * Palette: deep matte + warm amber accent + soft blue emphasis
 * Designed for the spatial canvas editor — "candlelight on obsidian"
 */

const amber     = '#E8A44A'
const amberMid  = '#D4963F'
const amberDim  = '#C0882F'
const textBase  = '#D1D1D8'
const textFaint = '#55555F'
const codeColor = '#B07ADB'
const linkColor = '#8B9CF8'
const emColor   = '#7C9FBA'
const quoteColor = '#C0882F'

export const darkHighlight = HighlightStyle.define([
  // Headings — amber scale
  { tag: t.heading1, color: amber,    fontWeight: '800', fontSize: '1.2em',  letterSpacing: '-0.025em' },
  { tag: t.heading2, color: amberMid, fontWeight: '700', fontSize: '1.08em', letterSpacing: '-0.02em'  },
  { tag: t.heading3, color: amberDim, fontWeight: '700' },
  { tag: t.heading,  color: amberDim, fontWeight: '600' },

  // Emphasis
  { tag: t.strong,        color: amber,     fontWeight: '700' },
  { tag: t.emphasis,      color: emColor,   fontStyle: 'italic' },
  { tag: t.strikethrough, color: textFaint, textDecoration: 'line-through' },

  // Code
  { tag: t.monospace,              color: codeColor, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92em' },
  { tag: t.processingInstruction,  color: codeColor },

  // Links
  { tag: t.link, color: linkColor, textDecoration: 'underline', textDecorationColor: 'rgba(139,156,248,.35)' },
  { tag: t.url,  color: linkColor },

  // Lists & punctuation
  { tag: t.list,        color: amber },
  { tag: t.punctuation, color: textFaint, opacity: '0.5' },

  // Blockquote
  { tag: t.quote, color: quoteColor, fontStyle: 'italic' },

  // Meta / comments
  { tag: t.comment, color: textFaint, fontStyle: 'italic' },
  { tag: t.meta,    color: textFaint },

  // Base
  { tag: t.content, color: textBase },
  { tag: t.name,    color: textBase },
])

export const darkEditorTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    fontFamily: "'IBM Plex Sans', 'Inter', system-ui, sans-serif",
    background: 'transparent',
    color: '#D1D1D8',
  },
  '.cm-content': {
    padding: '28px 36px 80px',
    lineHeight: '1.75',
    caretColor: amber,
    maxWidth: '680px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  '.cm-gutters': {
    background: 'transparent',
    color: '#44444E',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.04)',
    paddingRight: '12px',
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(232,164,74,0.08)',
    color: amber,
  },
  '.cm-activeLine': {
    background: 'rgba(232,164,74,0.04)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(232,164,74,0.15) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(232,164,74,0.20) !important',
  },
  '.cm-cursor': {
    borderLeft: `2px solid ${amber}`,
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(232,164,74,0.15)',
    outline: '1px solid rgba(232,164,74,0.4)',
  },
  '.cm-line .tok-heading, .cm-line .cm-headerMark': {
    color: amber,
    opacity: '0.6',
  },
})

export const darkTheme = [
  darkEditorTheme,
  syntaxHighlighting(darkHighlight),
]
