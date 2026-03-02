import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

// Brand palette
const coral   = '#ff7a64'
const blue1   = '#2563eb'  // h1 — deep blue
const blue2   = '#3b82f6'  // h2 — medium blue
const blue3   = '#60a5fa'  // h3 — lighter blue
const blue4   = '#93c5fd'  // h4/h5/h6
const teal    = '#0d9488'  // inline code, monospace
const green   = '#16a34a'  // bold
const purple  = '#7c3aed'  // links
const amber   = '#d97706'  // blockquote, emphasis
const muted   = '#9ca3af'  // comments, hr
const ink     = '#201710'  // base text
const t2      = '#4c3a2d'

export const brandHighlight = HighlightStyle.define([
  // Headings — blue scale
  { tag: t.heading1,         color: blue1,  fontWeight: '800', fontSize: '1.18em', letterSpacing: '-0.02em' },
  { tag: t.heading2,         color: blue2,  fontWeight: '700', fontSize: '1.08em' },
  { tag: t.heading3,         color: blue3,  fontWeight: '700' },
  { tag: t.heading,          color: blue4,  fontWeight: '600' },

  // Emphasis
  { tag: t.strong,           color: green,  fontWeight: '700' },
  { tag: t.emphasis,         color: amber,  fontStyle: 'italic' },
  { tag: t.strikethrough,    color: muted,  textDecoration: 'line-through' },

  // Links
  { tag: t.link,             color: purple, textDecoration: 'underline' },
  { tag: t.url,              color: coral,  opacity: '0.85' },

  // Code
  { tag: t.monospace,        color: teal,   fontFamily: "'JetBrains Mono', monospace" },
  { tag: t.processingInstruction, color: teal },

  // Lists & punctuation
  { tag: t.list,             color: coral },
  { tag: t.punctuation,      color: t2,     opacity: '0.6' },
  { tag: t.quote,            color: amber,  fontStyle: 'italic' },

  // Meta / comments (HTML in markdown, etc.)
  { tag: t.comment,          color: muted,  fontStyle: 'italic' },
  { tag: t.meta,             color: muted },

  // Base
  { tag: t.content,          color: ink },
  { tag: t.name,             color: ink },
])

// Editor theme — base colors, gutter, selection
export const brandEditorTheme = EditorView.theme({
  '&': {
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', monospace",
    background: '#fffaf5',
    color: '#201710',
  },
  '.cm-content': {
    padding: '16px 20px',
    lineHeight: '1.9',
    caretColor: '#ff7a64',
  },
  '.cm-gutters': {
    background: '#fff4ea',
    color: '#ab9381',
    border: 'none',
    borderRight: '1px solid rgba(32,23,16,.08)',
    paddingRight: '6px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(255,122,100,.08)',
  },
  '.cm-activeLine': {
    background: 'rgba(255,122,100,.04)',
  },
  '.cm-selectionBackground, ::selection': {
    background: 'rgba(255,122,100,.18) !important',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #ff7a64',
  },
  '.cm-focused': {
    outline: 'none',
  },
  // Heading marker (#, ##) in coral
  '.tok-heading': {
    color: '#ff7a64',
  },
})

export const brandTheme = [
  brandEditorTheme,
  syntaxHighlighting(brandHighlight),
]
