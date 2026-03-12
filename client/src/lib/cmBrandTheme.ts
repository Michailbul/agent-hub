import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * Brand Light Theme — Warm paper, coral accent, ink text
 * The only light-mode editor across all variants
 */

const ink          = '#201710'
const secondary    = '#4c3a2d'
const tertiary     = '#7d6755'
const ghost        = '#ab9381'
const coral        = '#ff7a64'
const warmCode     = '#b05730'

export const brandHighlight = HighlightStyle.define([
  { tag: t.heading1, color: coral, fontWeight: '700', fontSize: '1.3em', letterSpacing: '-0.03em' },
  { tag: t.heading2, color: secondary, fontWeight: '700', fontSize: '1.15em', letterSpacing: '-0.025em' },
  { tag: t.heading3, color: tertiary, fontWeight: '600', fontSize: '1.05em', letterSpacing: '-0.02em' },
  { tag: t.heading,  color: secondary, fontWeight: '600' },

  { tag: t.strong,        color: ink,       fontWeight: '700' },
  { tag: t.emphasis,      color: tertiary,  fontStyle: 'italic' },
  { tag: t.strikethrough, color: ghost,     textDecoration: 'line-through' },

  { tag: t.monospace,             color: warmCode, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92em' },
  { tag: t.processingInstruction, color: warmCode },

  { tag: t.link, color: coral, textDecoration: 'underline', textDecorationColor: 'rgba(255,122,100,0.35)' },
  { tag: t.url,  color: tertiary },

  { tag: t.list,        color: ghost },
  { tag: t.punctuation, color: ghost, opacity: '0.6' },

  { tag: t.quote, color: tertiary, fontStyle: 'italic' },

  { tag: t.comment, color: ghost, fontStyle: 'italic' },
  { tag: t.meta,    color: ghost },

  { tag: t.content, color: ink },
  { tag: t.name,    color: ink },
])

export const brandEditorTheme = EditorView.theme({
  '&': {
    fontSize: '15px',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'transparent',
    color: '#201710',
  },
  '.cm-content': {
    padding: '32px 40px 80px',
    lineHeight: '1.85',
    caretColor: '#ff7a64',
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  '.cm-gutters': {
    background: 'transparent',
    color: '#ab9381',
    border: 'none',
    borderRight: '1px solid rgba(32,23,16,0.06)',
    paddingRight: '12px',
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(255,122,100,0.04)',
    color: '#7d6755',
  },
  '.cm-activeLine': {
    background: 'rgba(255,122,100,0.04)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(255,122,100,0.12) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(255,122,100,0.16) !important',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #ff7a64',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(255,122,100,0.1)',
    outline: '1px solid rgba(255,122,100,0.2)',
  },
  '.cm-line .tok-heading, .cm-line .cm-headerMark': {
    color: '#ab9381',
    opacity: '0.5',
  },
})

export const brandTheme = [
  brandEditorTheme,
  syntaxHighlighting(brandHighlight),
]
