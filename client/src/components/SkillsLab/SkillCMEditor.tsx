import { useRef, useEffect, useCallback, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown } from '@codemirror/lang-markdown'
import { bracketMatching } from '@codemirror/language'
import { darkTheme } from '@/lib/cmDarkTheme'
import { saveFile } from '@/lib/api'
import type { Extension } from '@codemirror/state'

interface SkillCMEditorProps {
  content: string
  filePath: string | null
  onDirtyChange?: (dirty: boolean) => void
  /** Custom CodeMirror theme extensions. Falls back to darkTheme */
  theme?: Extension[]
  /** CSS class prefix for wrapper elements. Falls back to 'sc' */
  prefix?: string
}

export function SkillCMEditor({ content, filePath, onDirtyChange, theme, prefix = 'sc' }: SkillCMEditorProps) {
  const cmRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const doSave = useCallback(async () => {
    if (!filePath) return
    const view = viewRef.current
    if (!view) return
    try {
      await saveFile(filePath, view.state.doc.toString())
      setDirty(false)
      onDirtyChange?.(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } catch {
      // save failed silently
    }
  }, [filePath, onDirtyChange])

  useEffect(() => {
    if (!cmRef.current) return

    const saveKeymap = keymap.of([{
      key: 'Mod-s',
      run: () => { void doSave(); return true },
    }])

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        setDirty(true)
        onDirtyChange?.(true)
      }
    })

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        history(),
        bracketMatching(),
        ...(theme ?? darkTheme),
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        saveKeymap,
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({ state, parent: cmRef.current })
    viewRef.current = view
    view.focus()

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`${prefix}-cm-wrap`}>
      <div className={`${prefix}-cm-status`}>
        {dirty && <span className={`${prefix}-unsaved-dot`} />}
        {saved && <span className={`${prefix}-saved-flash`}>Saved</span>}
        {filePath && <span className={`${prefix}-cm-path`}>{filePath}</span>}
      </div>
      <div ref={cmRef} className={`${prefix}-cm-editor`} />
    </div>
  )
}
