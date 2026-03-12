import { useRef, useEffect, useState } from 'react'

interface InlineRenameProps {
  initialValue: string
  onCommit: (value: string) => void
  onCancel: () => void
}

export function InlineRename({ initialValue, onCommit, onCancel }: InlineRenameProps) {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.select()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = value.trim()
      if (trimmed && trimmed !== initialValue) {
        onCommit(trimmed)
      } else {
        onCancel()
      }
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleBlur = () => {
    const trimmed = value.trim()
    if (trimmed && trimmed !== initialValue) {
      onCommit(trimmed)
    } else {
      onCancel()
    }
  }

  return (
    <input
      ref={inputRef}
      className="sk-rename-input"
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onClick={e => e.stopPropagation()}
      autoFocus
    />
  )
}
