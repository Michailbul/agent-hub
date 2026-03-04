import { useCallback, useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react'

type UseResizableOptions = {
  key: string
  initial: number
  min: number
  max: number
  enabled?: boolean
  direction?: 1 | -1
}

type UseResizableResult = {
  size: number
  setSize: (next: number | ((current: number) => number)) => void
  handleProps: {
    onMouseDown: (event: ReactMouseEvent<HTMLElement>) => void
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function useResizable({
  key,
  initial,
  min,
  max,
  enabled = true,
  direction = 1,
}: UseResizableOptions): UseResizableResult {
  const readInitial = useMemo(() => {
    if (typeof window === 'undefined') return clamp(initial, min, max)

    const raw = window.localStorage.getItem(key)
    const parsed = raw ? Number(raw) : NaN
    if (!Number.isFinite(parsed)) return clamp(initial, min, max)

    return clamp(parsed, min, max)
  }, [initial, key, max, min])

  const [size, setSizeState] = useState<number>(readInitial)

  useEffect(() => {
    setSizeState(current => clamp(current, min, max))
  }, [min, max])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, String(size))
  }, [key, size])

  const setSize = useCallback(
    (next: number | ((current: number) => number)) => {
      setSizeState(current => {
        const resolved = typeof next === 'function' ? next(current) : next
        return clamp(resolved, min, max)
      })
    },
    [max, min],
  )

  const onMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (!enabled || event.button !== 0) return

      event.preventDefault()
      const startX = event.clientX
      const startSize = size

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = (moveEvent.clientX - startX) * direction
        setSizeState(clamp(startSize + delta, min, max))
      }

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [direction, enabled, max, min, size],
  )

  return {
    size,
    setSize,
    handleProps: { onMouseDown },
  }
}
