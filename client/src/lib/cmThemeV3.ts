import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { EditorView } from '@codemirror/view'

/**
 * V3 "OpenAI Mono" Syntax Theme
 * Stark monochrome — white on black, teal only for code
 * Confidence through restraint, typography does the heavy lifting
 */

const white       = '#FFFFFF'
const secondary   = '#A0A0A0'
const tertiary    = '#555555'
const teal        = '#00A67E'

export const v3Highlight = HighlightStyle.define([
  // Headings — pure white, differentiated ONLY by weight and size
  { tag: t.heading1, color: white, fontWeight: '800', fontSize: '1.25em', letterSpacing: '-0.03em' },
  { tag: t.heading2, color: white, fontWeight: '700', fontSize: '1.12em', letterSpacing: '-0.025em' },
  { tag: t.heading3, color: white, fontWeight: '600', fontSize: '1.02em', letterSpacing: '-0.02em' },
  { tag: t.heading,  color: white, fontWeight: '600' },

  // Emphasis
  { tag: t.strong,        color: white,     fontWeight: '700' },
  { tag: t.emphasis,      color: secondary, fontStyle: 'italic' },
  { tag: t.strikethrough, color: tertiary,  textDecoration: 'line-through' },

  // Code — teal accent
  { tag: t.monospace,             color: teal, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.92em' },
  { tag: t.processingInstruction, color: teal },

  // Links
  { tag: t.link, color: secondary, textDecoration: 'underline', textDecorationColor: 'rgba(160,160,160,0.4)' },
  { tag: t.url,  color: secondary },

  // Lists & punctuation
  { tag: t.list,        color: tertiary },
  { tag: t.punctuation, color: tertiary, opacity: '0.5' },

  // Blockquote
  { tag: t.quote, color: secondary, fontStyle: 'italic' },

  // Meta / comments
  { tag: t.comment, color: tertiary, fontStyle: 'italic' },
  { tag: t.meta,    color: tertiary },

  // Base
  { tag: t.content, color: white },
  { tag: t.name,    color: white },
])

export const v3EditorTheme = EditorView.theme({
  '&': {
    fontSize: '15px',
    fontFamily: "'Inter', system-ui, sans-serif",
    background: 'transparent',
    color: '#FFFFFF',
  },
  '.cm-content': {
    padding: '32px 40px 80px',
    lineHeight: '1.8',
    caretColor: '#FFFFFF',
    maxWidth: '720px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  '.cm-gutters': {
    background: 'transparent',
    color: '#555555',
    border: 'none',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    paddingRight: '12px',
    minWidth: '48px',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '11px',
  },
  '.cm-activeLineGutter': {
    background: 'rgba(255,255,255,0.03)',
    color: '#A0A0A0',
  },
  '.cm-activeLine': {
    background: 'rgba(255,255,255,0.03)',
  },
  '.cm-selectionBackground': {
    background: 'rgba(255,255,255,0.1) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    background: 'rgba(255,255,255,0.12) !important',
  },
  '.cm-cursor': {
    borderLeft: '2px solid #FFFFFF',
  },
  '&.cm-focused': {
    outline: 'none',
  },
  '.cm-matchingBracket': {
    background: 'rgba(255,255,255,0.08)',
    outline: '1px solid rgba(255,255,255,0.15)',
  },
  '.cm-line .tok-heading, .cm-line .cm-headerMark': {
    color: '#555555',
    opacity: '0.6',
  },
})

export const v3Theme = [
  v3EditorTheme,
  syntaxHighlighting(v3Highlight),
]
