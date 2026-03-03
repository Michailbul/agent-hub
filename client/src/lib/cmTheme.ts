import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * Laniameda Brand Syntax Theme
 * Palette: warm paper + coral accent + blue headings + purple code
 * No green — warm, editorial, cohesive
 */

const h1Color   = '#1d4ed8'   // deep blue
const h2Color   = '#2563eb'   // blue
const h3Color   = '#3b82f6'   // medium blue
const h4Color   = '#60a5fa'   // light blue
const boldColor = '#ff7a64'   // coral — brand accent
const emColor   = '#b45309'   // warm amber-brown (italic)
const codeColor = '#7c3aed'   // purple (inline code)
const linkColor = '#6d28d9'   // deep purple (links)
const urlColor  = '#9333ea'   // purple-ish (URLs)
const listColor = '#ff7a64'   // coral (list bullets)
const quoteColor = '#92400e'  // dark amber (blockquotes)
const mutedColor = '#a8a29e'  // stone gray (comments, hr)
const baseColor  = '#201710'  // near-black
const t2Color    = '#4c3a2d'

export const brandHighlight = HighlightStyle.define([
  // ── Headings — blue scale
  { tag: t.heading1,    color: h1Color, fontWeight: '800', fontSize: '1.2em',  letterSpacing: '-0.025em' },
  { tag: t.heading2,    color: h2Color, fontWeight: '700', fontSize: '1.08em', letterSpacing: '-0.02em'  },
  { tag: t.heading3,    color: h3Color, fontWeight: '700' },
  { tag: t.heading,     color: h4Color, fontWeight: '600' },

  // ── Emphasis
  { tag: t.strong,      color: boldColor, fontWeight: '700' },
  { tag: t.emphasis,    color: emColor,   fontStyle: 'italic' },
  { tag: t.strikethrough, color: mutedColor, textDecoration: 'line-through' },

  // ── Code
  { tag: t.monospace,   color: codeColor, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92em' },
  { tag: t.processingInstruction, color: codeColor },

  // ── Links
  { tag: t.link,        color: linkColor, textDecoration: 'underline', textDecorationColor: 'rgba(109,40,217,.4)' },
  { tag: t.url,         color: urlColor },

  // ── Lists & punctuation
  { tag: t.list,        color: listColor },
  { tag: t.punctuation, color: t2Color, opacity: '0.5' },

  // ── Blockquote
  { tag: t.quote,       color: quoteColor, fontStyle: 'italic' },

  // ── Meta / comments
  { tag: t.comment,     color: mutedColor, fontStyle: 'italic' },
  { tag: t.meta,        color: mutedColor },

  // ── Base
  { tag: t.content,     color: baseColor },
  { tag: t.name,        color: baseColor },
])

// ── Editor chrome theme
export const brandEditorTheme = EditorView.theme({
  '&': {
    fontSize: '13.5px',
    fontFamily: "'JetBrains Mono', monospace",
    background: '#fffaf5',
    color: '#201710',
  },
  '.cm-content': {
    padding: '20px 24px',
    lineHeight: '1.9',
    caretColor: '#ff7a64',
    maxWidth: '860px',
  },
  '.cm-gutters': {
    background: '#fff4ea',
    color: '#c4b5a5',
    border: 'none',
    borderRight: '1px solid rgba(32,23,16,.07)',
    paddingRight: '8px',
    minWidth: '44px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
    letterSpacing: '0',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(255,122,100,.06)',
    color: '#ff7a64',
  },
  '.cm-activeLine': {
    background: 'rgba(255,122,100,.035)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(124,58,237,.15) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(124,58,237,.18) !important',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #ff7a64',
    borderLeftColor: '#ff7a64',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(255,122,100,.15)',
    outline: '1px solid rgba(255,122,100,.4)',
  },
  // Style the ## heading markers themselves in coral
  '.cm-line .tok-heading, .cm-line .cm-headerMark': {
    color: '#ff7a64',
    opacity: '0.7',
  },
})

export const brandTheme = [
  brandEditorTheme,
  syntaxHighlighting(brandHighlight),
]
