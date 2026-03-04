import { useEffect, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Markdown } from '@tiptap/markdown'

type RichMarkdownEditorProps = {
  value: string
  onChange: (nextMarkdown: string) => void
  onDirty: () => void
  onSave: () => void
  isDirty: boolean
  isLoading: boolean
  onFallbackToMarkdown: () => void
}

export function RichMarkdownEditor({
  value,
  onChange,
  onDirty,
  onSave,
  isDirty,
  isLoading,
  onFallbackToMarkdown,
}: RichMarkdownEditorProps) {
  const suppressUpdateRef = useRef(false)

  const editor = useEditor({
    immediatelyRender: false,
    content: value,
    contentType: 'markdown',
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Markdown,
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    editorProps: {
      handleKeyDown: (_view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
          event.preventDefault()
          onSave()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: tiptapEditor }) => {
      if (suppressUpdateRef.current) return
      try {
        const nextMarkdown = tiptapEditor.getMarkdown()
        if (nextMarkdown !== value) {
          onChange(nextMarkdown)
          onDirty()
        }
      } catch {
        onFallbackToMarkdown()
      }
    },
    onCreate: ({ editor: tiptapEditor }) => {
      try {
        const nextMarkdown = tiptapEditor.getMarkdown()
        if (nextMarkdown !== value) {
          onChange(nextMarkdown)
        }
      } catch {
        onFallbackToMarkdown()
      }
    },
  })

  useEffect(() => {
    if (!editor) return
    try {
      const currentMarkdown = editor.getMarkdown()
      if (currentMarkdown === value) return
      suppressUpdateRef.current = true
      editor.commands.setContent(value, { contentType: 'markdown' })
    } catch {
      onFallbackToMarkdown()
    } finally {
      suppressUpdateRef.current = false
    }
  }, [editor, value, onFallbackToMarkdown])

  if (!editor) return null

  return (
    <div className="pane-editor-wrap">
      <EditorContent editor={editor} className={`tiptap${isDirty ? ' is-dirty' : ''}`} />
      {isLoading && <div className="pane-loading">Loading...</div>}
    </div>
  )
}
