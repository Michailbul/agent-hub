import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * V7 "Clay" Syntax Theme
 * Warm earth tones — terracotta primary, parchment text, organic feel
 * shadcn/ui-inspired dark mode palette
 */

const foreground    = '#e8e0d4'
const primary       = '#d97757'
const muted         = '#b5a898'
const subtle        = '#5a5549'
const cardFg        = '#f5f0e8'
const chart2        = '#9c87f5'

export const v7Highlight = HighlightStyle.define([
  // Headings — warm parchment, terracotta tints
  { tag: t.heading1, color: primary, fontWeight: '700', fontSize: '1.25em', letterSpacing: '-0.03em' },
  { tag: t.heading2, color: cardFg, fontWeight: '600', fontSize: '1.12em', letterSpacing: '-0.025em' },
  { tag: t.heading3, color: foreground, fontWeight: '600', fontSize: '1.02em', letterSpacing: '-0.02em' },
  { tag: t.heading,  color: foreground, fontWeight: '600' },

  // Emphasis
  { tag: t.strong,        color: cardFg,    fontWeight: '700' },
  { tag: t.emphasis,      color: muted,     fontStyle: 'italic' },
  { tag: t.strikethrough, color: subtle,    textDecoration: 'line-through' },

  // Code — violet accent from chart-2
  { tag: t.monospace,             color: chart2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92em' },
  { tag: t.processingInstruction, color: chart2 },

  // Links
  { tag: t.link, color: primary, textDecoration: 'underline', textDecorationColor: 'rgba(217,119,87,0.4)' },
  { tag: t.url,  color: muted },

  // Lists & punctuation
  { tag: t.list,        color: subtle },
  { tag: t.punctuation, color: subtle, opacity: '0.6' },

  // Blockquote
  { tag: t.quote, color: muted, fontStyle: 'italic' },

  // Meta / comments
  { tag: t.comment, color: subtle, fontStyle: 'italic' },
  { tag: t.meta,    color: subtle },

  // Base
  { tag: t.content, color: foreground },
  { tag: t.name,    color: foreground },
])

export const v7EditorTheme = EditorView.theme({
  '&': {
    fontSize: '15px',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'transparent',
    color: '#e8e0d4',
  },
  '.cm-content': {
    padding: '32px 40px 80px',
    lineHeight: '1.8',
    caretColor: '#d97757',
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  '.cm-gutters': {
    background: 'transparent',
    color: '#5a5549',
    border: 'none',
    borderRight: '1px solid #3e3e38',
    paddingRight: '12px',
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(217,119,87,0.06)',
    color: '#b5a898',
  },
  '.cm-activeLine': {
    background: 'rgba(217,119,87,0.06)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(217,119,87,0.15) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(217,119,87,0.2) !important',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #d97757',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(217,119,87,0.12)',
    outline: '1px solid rgba(217,119,87,0.25)',
  },
  '.cm-line .tok-heading, .cm-line .cm-headerMark': {
    color: '#5a5549',
    opacity: '0.6',
  },
})

export const v7Theme = [
  v7EditorTheme,
  syntaxHighlighting(v7Highlight),
]
