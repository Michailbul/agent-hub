import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * V10 "Slab" Syntax Theme
 * Full neo-brutalist: heavy weights, thick caret, slab typography
 * Terracotta + warm cream on charcoal
 */

const cream     = '#e8e0d4'
const primary   = '#d97757'
const warm      = '#b5a898'
const dim       = '#5a5549'
const bright    = '#f5f0e8'
const violet    = '#9c87f5'

export const v10Highlight = HighlightStyle.define([
  { tag: t.heading1, color: primary, fontWeight: '900', fontSize: '1.35em', letterSpacing: '-0.05em', textTransform: 'uppercase' as any },
  { tag: t.heading2, color: bright, fontWeight: '800', fontSize: '1.18em', letterSpacing: '-0.03em' },
  { tag: t.heading3, color: cream, fontWeight: '700', fontSize: '1.06em', letterSpacing: '-0.02em' },
  { tag: t.heading,  color: cream, fontWeight: '700' },
  { tag: t.strong,        color: bright,   fontWeight: '800' },
  { tag: t.emphasis,      color: warm,     fontStyle: 'italic' },
  { tag: t.strikethrough, color: dim,      textDecoration: 'line-through' },
  { tag: t.monospace,             color: violet, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9em', fontWeight: '500' },
  { tag: t.processingInstruction, color: violet },
  { tag: t.link, color: primary, fontWeight: '600', textDecoration: 'underline' },
  { tag: t.url,  color: warm },
  { tag: t.list,        color: dim },
  { tag: t.punctuation, color: dim, opacity: '0.8' },
  { tag: t.quote, color: warm, fontStyle: 'italic', borderLeft: '4px solid rgba(217,119,87,0.3)' as any },
  { tag: t.comment, color: dim, fontStyle: 'italic' },
  { tag: t.meta,    color: dim },
  { tag: t.content, color: cream },
  { tag: t.name,    color: cream },
])

export const v10EditorTheme = EditorView.theme({
  '&': {
    fontSize: '15px',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'transparent',
    color: '#e8e0d4',
  },
  '.cm-content': {
    padding: '32px 40px 80px',
    lineHeight: '1.85',
    caretColor: '#d97757',
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  '.cm-gutters': {
    background: '#1e1d1a',
    color: '#5a5549',
    border: 'none',
    borderRight: '3px solid #3e3e38',
    paddingRight: '12px',
    minWidth: '52px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: '700',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(217,119,87,0.12)',
    color: '#d97757',
  },
  '.cm-activeLine': {
    background: 'rgba(217,119,87,0.08)',
    boxShadow: 'inset 4px 0 0 #d97757',
  },
  '.cm-selectionBackground': {
    background: 'rgba(217,119,87,0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(217,119,87,0.28) !important',
  },
  '.cm-cursor': {
    borderLeft: '3px solid #d97757',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(217,119,87,0.15)',
    outline: '2px solid rgba(217,119,87,0.35)',
  },
})

export const v10Theme = [
  v10EditorTheme,
  syntaxHighlighting(v10Highlight),
]
