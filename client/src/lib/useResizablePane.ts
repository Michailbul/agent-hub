import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent } from 'react'

type UseResizablePaneArgs = {
  value: number
  onChange: (next: number) => void
  min: number
  max: number
  enabled?: boolean
  direction?: 1 | -1
  resetTo?: number
}

type HandleProps = {
  onMouseDown: (event: ReactMouseEvent<HTMLElement>) => void
  onDoubleClick?: () => void
  role?: string
  tabIndex?: number
  'aria-label'?: string
}

type UseResizablePaneResult = {
  handleProps: HandleProps
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function useResizablePane({
  value,
  onChange,
  min,
  max,
  enabled = true,
  direction = 1,
  resetTo,
}: UseResizablePaneArgs): UseResizablePaneResult {
  const cleanupRef = useRef<null | (() => void)>(null)

  useEffect(() => {
    const next = clamp(value, min, max)
    if (next !== value) onChange(next)
  }, [max, min, onChange, value])

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  const onMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) return

      event.preventDefault()
      const startX = event.clientX
      const startSize = value
      const previousCursor = document.body.style.cursor
      const previousUserSelect = document.body.style.userSelect

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = (moveEvent.clientX - startX) * direction
        onChange(clamp(startSize + delta, min, max))
      }

      const teardown = () => {
        document.body.style.cursor = previousCursor
        document.body.style.userSelect = previousUserSelect
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
        window.removeEventListener('blur', handleMouseUp)
        cleanupRef.current = null
      }

      const handleMouseUp = () => {
        teardown()
      }

      cleanupRef.current = teardown
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('blur', handleMouseUp)
    },
    [direction, enabled, max, min, onChange, value],
  )

  const onDoubleClick = useCallback(() => {
    if (typeof resetTo !== 'number') return
    onChange(clamp(resetTo, min, max))
  }, [max, min, onChange, resetTo])

  return {
    handleProps: {
      onMouseDown,
      onDoubleClick,
      role: 'separator',
      tabIndex: 0,
    },
  }
}
