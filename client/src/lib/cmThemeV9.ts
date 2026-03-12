import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * V9 "Oxide" Syntax Theme
 * V3 monochrome black meets V7 terracotta
 * Mostly neutral grays, terracotta only for headings and links
 */

const foreground = '#999999'
const primary    = '#d97757'
const bright     = '#cccccc'
const subtle     = '#444444'
const white      = '#e0e0e0'

export const v9Highlight = HighlightStyle.define([
  { tag: t.heading1, color: primary, fontWeight: '600', fontSize: '1.25em', letterSpacing: '-0.03em' },
  { tag: t.heading2, color: white, fontWeight: '600', fontSize: '1.12em', letterSpacing: '-0.025em' },
  { tag: t.heading3, color: bright, fontWeight: '500', fontSize: '1.02em' },
  { tag: t.heading,  color: bright, fontWeight: '500' },
  { tag: t.strong,        color: white,      fontWeight: '600' },
  { tag: t.emphasis,      color: foreground,  fontStyle: 'italic' },
  { tag: t.strikethrough, color: subtle,      textDecoration: 'line-through' },
  { tag: t.monospace,             color: primary, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92em' },
  { tag: t.processingInstruction, color: primary },
  { tag: t.link, color: primary, textDecoration: 'underline', textDecorationColor: 'rgba(217,119,87,0.4)' },
  { tag: t.url,  color: foreground },
  { tag: t.list,        color: subtle },
  { tag: t.punctuation, color: subtle, opacity: '0.5' },
  { tag: t.quote, color: foreground, fontStyle: 'italic' },
  { tag: t.comment, color: subtle, fontStyle: 'italic' },
  { tag: t.meta,    color: subtle },
  { tag: t.content, color: foreground },
  { tag: t.name,    color: foreground },
])

export const v9EditorTheme = EditorView.theme({
  '&': {
    fontSize: '15px',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'transparent',
    color: '#999999',
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
    color: '#333333',
    border: 'none',
    borderRight: '1px solid rgba(217,119,87,0.12)',
    paddingRight: '12px',
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(217,119,87,0.05)',
    color: '#666666',
  },
  '.cm-activeLine': {
    background: 'rgba(217,119,87,0.04)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(217,119,87,0.12) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(217,119,87,0.18) !important',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #d97757',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(217,119,87,0.1)',
    outline: '1px solid rgba(217,119,87,0.2)',
  },
})

export const v9Theme = [
  v9EditorTheme,
  syntaxHighlighting(v9Highlight),
]
