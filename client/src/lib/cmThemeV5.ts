import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * V5 "Frost Void" Syntax Theme
 * Icy precision — cyan accents on pure darkness
 * Mission control at absolute zero
 */

const primary     = '#E8ECF0'
const secondary   = '#6B7280'
const tertiary    = '#3B3F47'
const cyan        = '#00D4AA'
const cyanMid     = '#00B894'
const cyanDeep    = '#009B7D'
const pink        = '#F472B6'

export const v5Highlight = HighlightStyle.define([
  // Headings — cyan gradient, bold and precise
  { tag: t.heading1, color: cyan,     fontWeight: '800', fontSize: '1.25em', letterSpacing: '-0.03em' },
  { tag: t.heading2, color: cyanMid,  fontWeight: '700', fontSize: '1.12em', letterSpacing: '-0.025em' },
  { tag: t.heading3, color: cyanDeep, fontWeight: '600', fontSize: '1.02em', letterSpacing: '-0.02em' },
  { tag: t.heading,  color: cyanMid,  fontWeight: '600' },

  // Emphasis
  { tag: t.strong,        color: primary,   fontWeight: '700' },
  { tag: t.emphasis,      color: secondary, fontStyle: 'italic' },
  { tag: t.strikethrough, color: tertiary,  textDecoration: 'line-through' },

  // Code — pink for contrast against cyan
  { tag: t.monospace,             color: pink, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92em' },
  { tag: t.processingInstruction, color: pink },

  // Links — cyan underline
  { tag: t.link, color: cyan, textDecoration: 'underline', textDecorationColor: 'rgba(0,212,170,0.4)' },
  { tag: t.url,  color: cyan },

  // Lists & punctuation
  { tag: t.list,        color: tertiary },
  { tag: t.punctuation, color: tertiary, opacity: '0.5' },

  // Blockquote
  { tag: t.quote, color: secondary, fontStyle: 'italic' },

  // Meta / comments
  { tag: t.comment, color: tertiary, fontStyle: 'italic' },
  { tag: t.meta,    color: tertiary },

  // Base
  { tag: t.content, color: primary },
  { tag: t.name,    color: primary },
])

export const v5EditorTheme = EditorView.theme({
  '&': {
    fontSize: '14px',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'transparent',
    color: '#E8ECF0',
  },
  '.cm-content': {
    padding: '32px 40px 80px',
    lineHeight: '1.7',
    caretColor: '#00D4AA',
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  '.cm-gutters': {
    background: 'transparent',
    color: '#3B3F47',
    border: 'none',
    borderRight: '1px solid rgba(0,212,170,0.06)',
    paddingRight: '12px',
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(0,212,170,0.04)',
    color: '#6B7280',
  },
  '.cm-activeLine': {
    background: 'rgba(0,212,170,0.04)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(0,212,170,0.12) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(0,212,170,0.12) !important',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #00D4AA',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(0,212,170,0.08)',
    outline: '1px solid rgba(0,212,170,0.15)',
  },
  '.cm-line .tok-heading, .cm-line .cm-headerMark': {
    color: '#3B3F47',
    opacity: '0.6',
  },
})

export const v5Theme = [
  v5EditorTheme,
  syntaxHighlighting(v5Highlight),
]
