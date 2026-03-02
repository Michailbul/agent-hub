import { useRef, useEffect, useCallback, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language'
import { usePanesStore } from '@/store/panes'
import { useUIStore } from '@/store/ui'
import { saveFile } from '@/lib/api'
import { PaneHeader } from './PaneHeader'
import { PaneStatus } from './PaneStatus'
import type { PaneState } from '@/types'

interface PaneProps {
  pane: PaneState
  isActive: boolean
}

export function Pane({ pane, isActive }: PaneProps) {
  const cmRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const paneRef = useRef(pane)
  paneRef.current = pane
  const externalUpdate = useRef(false)

  const { updateContent, setDirty, closePane, setActivePane, openFileInPane, insertPaneAfter } = usePanesStore()
  const { flashSaved, toast } = useUIStore()

  const [cursorLine, setCursorLine] = useState(1)
  const [cursorCol, setCursorCol] = useState(1)

  const doSave = useCallback(async () => {
    const p = paneRef.current
    if (!p.path || p.isLocal) return
    const view = viewRef.current
    if (!view) return
    try {
      await saveFile(p.path, view.state.doc.toString())
      setDirty(p.id, false)
      flashSaved()
      toast('Saved', 'success')
    } catch {
      toast('Save failed', 'error')
    }
  }, [setDirty, flashSaved, toast])

  // Initialize CodeMirror
  useEffect(() => {
    if (!cmRef.current) return
    const saveKeymap = keymap.of([
      {
        key: 'Mod-s',
        run: () => {
          void doSave()
          return true
        },
      },
    ])

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged && !externalUpdate.current) {
        updateContent(pane.id, update.state.doc.toString())
      }
      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head
        const line = update.state.doc.lineAt(pos)
        setCursorLine(line.number)
        setCursorCol(pos - line.from + 1)
      }
    })

    const state = EditorState.create({
      doc: pane.content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle),
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        saveKeymap,
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({ state, parent: cmRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // Only init once per mount — content updates handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pane.id])

  // Sync content from external changes (file load)
  const prevContentRef = useRef(pane.content)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    // Only update if content changed externally (not from editor typing)
    if (pane.content !== prevContentRef.current && pane.content !== view.state.doc.toString()) {
      externalUpdate.current = true
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: pane.content },
      })
      externalUpdate.current = false
    }
    prevContentRef.current = pane.content
  }, [pane.content])

  const handleClose = useCallback(() => closePane(pane.id), [closePane, pane.id])
  const handleMouseDown = useCallback(() => setActivePane(pane.id), [setActivePane, pane.id])

  const handleHeaderDrop = useCallback(
    async (data: { path: string; label: string }) => {
      const newId = insertPaneAfter(pane.id)
      if (!newId) {
        toast('Max 4 panes', 'error')
        return
      }
      try {
        const r = await fetch('/api/file?path=' + encodeURIComponent(data.path))
        const content = r.ok ? await r.text() : ''
        openFileInPane(newId, data.path, data.label, content)
      } catch {
        toast('Failed to load file', 'error')
      }
    },
    [pane.id, insertPaneAfter, openFileInPane, toast],
  )

  const handleContentDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault()
      e.currentTarget.closest('.pane')?.classList.add('drag-target')
    }
  }, [])

  const handleContentDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.closest('.pane')?.classList.remove('drag-target')
  }, [])

  const handleContentDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.currentTarget.closest('.pane')?.classList.remove('drag-target')
      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'))
        if (data.path) {
          setActivePane(pane.id)
          const r = await fetch('/api/file?path=' + encodeURIComponent(data.path))
          const content = r.ok ? await r.text() : ''
          openFileInPane(pane.id, data.path, data.label, content)
        }
      } catch {
        // ignore
      }
    },
    [pane.id, setActivePane, openFileInPane],
  )

  const lines = pane.content.split('\n').length
  const words = pane.content.trim() ? pane.content.trim().split(/\s+/).length : 0

  return (
    <div
      className={`pane${isActive ? ' active-pane' : ''}`}
      data-id={pane.id}
      onMouseDown={handleMouseDown}
    >
      <PaneHeader
        paneId={pane.id}
        label={pane.label}
        isDirty={pane.isDirty}
        hasFile={!!pane.path}
        isLocal={pane.isLocal}
        onSave={doSave}
        onClose={handleClose}
        onHeaderDrop={handleHeaderDrop}
      />
      <div
        className="pane-cm"
        onDragOver={handleContentDragOver}
        onDragLeave={handleContentDragLeave}
        onDrop={handleContentDrop}
      >
        {!pane.path && (
          <div className={`pane-empty${pane.path ? ' hidden' : ''}`}>
            <div className="pe-icon">{'\uD83D\uDCC4'}</div>
            <div className="pe-title">Empty pane</div>
            <div className="pe-sub">
              Click a file to open here<br />
              <span style={{ opacity: 0.6 }}>drag here → replace</span><br />
              <span style={{ opacity: 0.6 }}>drag to tab header → new pane</span>
            </div>
          </div>
        )}
        <div ref={cmRef} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} />
      </div>
      <PaneStatus lines={lines} words={words} cursorLine={cursorLine} cursorCol={cursorCol} />
    </div>
  )
}
