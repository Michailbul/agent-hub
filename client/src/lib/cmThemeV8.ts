import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * V8 "Brutalist Clay" Syntax Theme
 * Same warm earth palette as V7 but with brutalist edge:
 * Thicker caret, boxier active line, bolder weights
 */

const foreground    = '#c3c0b6'
const primary       = '#d97757'
const muted         = '#b7b5a9'
const subtle        = '#52514a'
const cardFg        = '#faf9f5'
const chart2        = '#9c87f5'

export const v8Highlight = HighlightStyle.define([
  { tag: t.heading1, color: primary, fontWeight: '800', fontSize: '1.3em', letterSpacing: '-0.04em' },
  { tag: t.heading2, color: cardFg, fontWeight: '700', fontSize: '1.15em', letterSpacing: '-0.03em' },
  { tag: t.heading3, color: foreground, fontWeight: '700', fontSize: '1.05em', letterSpacing: '-0.02em' },
  { tag: t.heading,  color: foreground, fontWeight: '700' },
  { tag: t.strong,        color: cardFg,    fontWeight: '800' },
  { tag: t.emphasis,      color: muted,     fontStyle: 'italic' },
  { tag: t.strikethrough, color: subtle,    textDecoration: 'line-through' },
  { tag: t.monospace,             color: chart2, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92em' },
  { tag: t.processingInstruction, color: chart2 },
  { tag: t.link, color: primary, textDecoration: 'underline', textDecorationColor: primary },
  { tag: t.url,  color: muted },
  { tag: t.list,        color: subtle },
  { tag: t.punctuation, color: subtle, opacity: '0.7' },
  { tag: t.quote, color: muted, fontStyle: 'italic' },
  { tag: t.comment, color: subtle, fontStyle: 'italic' },
  { tag: t.meta,    color: subtle },
  { tag: t.content, color: foreground },
  { tag: t.name,    color: foreground },
])

export const v8EditorTheme = EditorView.theme({
  '&': {
    fontSize: '15px',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'transparent',
    color: '#c3c0b6',
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
    background: '#1a1915',
    color: '#52514a',
    border: 'none',
    borderRight: '3px solid #d97757',
    paddingRight: '12px',
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    fontWeight: '600',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(217,119,87,0.1)',
    color: '#d97757',
  },
  '.cm-activeLine': {
    background: 'rgba(217,119,87,0.08)',
    borderLeft: '3px solid rgba(217,119,87,0.3)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(217,119,87,0.18) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(217,119,87,0.25) !important',
  },
  '.cm-cursor': {
    borderLeft: '3px solid #d97757',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(217,119,87,0.15)',
    outline: '2px solid rgba(217,119,87,0.4)',
  },
})

export const v8Theme = [
  v8EditorTheme,
  syntaxHighlighting(v8Highlight),
]
