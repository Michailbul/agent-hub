/**
 * CMEditor — isolated CodeMirror 6 instance.
 * Keyed by pane.path so it remounts cleanly when a new file opens.
 * No content sync useEffect needed — CM initializes with correct doc on mount.
 */
import { useRef, useEffect, useCallback } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { bracketMatching } from '@codemirror/language'
import { brandTheme } from '@/lib/cmTheme'
import { usePanesStore } from '@/store/panes'
import { useUIStore } from '@/store/ui'
import { saveFile } from '@/lib/api'

interface CMEditorProps {
  paneId: string
  initialContent: string
  filePath: string | null
  isLocal: boolean
  isLoading: boolean
  onCursorChange: (line: number, col: number) => void
}

export function CMEditor({ paneId, initialContent, filePath, isLocal, isLoading, onCursorChange }: CMEditorProps) {
  const cmRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const { updateContent, setDirty } = usePanesStore()
  const { flashSaved, toast } = useUIStore()

  const doSave = useCallback(async () => {
    if (!filePath || isLocal) return
    const view = viewRef.current
    if (!view) return
    try {
      await saveFile(filePath, view.state.doc.toString())
      setDirty(paneId, false)
      flashSaved()
      toast('Saved', 'success')
    } catch {
      toast('Save failed', 'error')
    }
  }, [filePath, isLocal, paneId, setDirty, flashSaved, toast])

  useEffect(() => {
    if (!cmRef.current) return

    const saveKeymap = keymap.of([{
      key: 'Mod-s',
      run: () => { void doSave(); return true },
    }])

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        // User typed — sync to store
        updateContent(paneId, update.state.doc.toString())
      }
      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head
        const line = update.state.doc.lineAt(pos)
        onCursorChange(line.number, pos - line.from + 1)
      }
    })

    const state = EditorState.create({
      doc: initialContent,   // ← always correct on mount (keyed by path)
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        ...brandTheme,
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        saveKeymap,
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({ state, parent: cmRef.current })
    viewRef.current = view

    // Focus CM when file loads
    view.focus()

    return () => {
      view.destroy()
      viewRef.current = null
    }
  // Only run on mount — key prop handles remount when file changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update save handler when filePath/isLocal changes without remount
  useEffect(() => {
    // Nothing needed — doSave reads current filePath via closure on call
  }, [doSave])

  return (
    <div className="pane-editor-wrap">
      <div
        ref={cmRef}
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      />
      {isLoading && <div className="pane-loading">Loading...</div>}
    </div>
  )
}
