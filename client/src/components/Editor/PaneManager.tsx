import { useCallback, useRef } from 'react'
import { usePanesStore } from '@/store/panes'
import { Pane } from './Pane'

export function PaneManager() {
  const panes = usePanesStore(s => s.panes)
  const activePaneId = usePanesStore(s => s.activePaneId)
  const dragState = useRef<{
    rightIndex: number
    startX: number
    leftEl: HTMLElement
    rightEl: HTMLElement
    leftW: number
    rightW: number
  } | null>(null)

  const handleDividerMouseDown = useCallback(
    (e: React.MouseEvent, rightIndex: number) => {
      e.preventDefault()
      const area = e.currentTarget.parentElement
      if (!area) return
      const leftPane = area.querySelector<HTMLElement>(
        `[data-id="${panes[rightIndex - 1].id}"]`,
      )
      const rightPane = area.querySelector<HTMLElement>(
        `[data-id="${panes[rightIndex].id}"]`,
      )
      if (!leftPane || !rightPane) return

      const divider = e.currentTarget as HTMLElement
      divider.classList.add('dragging')
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      dragState.current = {
        rightIndex,
        startX: e.clientX,
        leftEl: leftPane,
        rightEl: rightPane,
        leftW: leftPane.getBoundingClientRect().width,
        rightW: rightPane.getBoundingClientRect().width,
      }

      const onMove = (ev: MouseEvent) => {
        const s = dragState.current
        if (!s) return
        const dx = ev.clientX - s.startX
        const newLeft = Math.max(200, s.leftW + dx)
        const newRight = Math.max(200, s.rightW - dx)
        if (newLeft >= 200 && newRight >= 200) {
          s.leftEl.style.flexBasis = newLeft + 'px'
          s.leftEl.style.flexGrow = '0'
          s.rightEl.style.flexBasis = newRight + 'px'
          s.rightEl.style.flexGrow = '0'
        }
      }

      const onUp = () => {
        divider.classList.remove('dragging')
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        dragState.current = null
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
    },
    [panes],
  )

  return (
    <>
      {panes.map((pane, i) => (
        <span key={pane.id} style={{ display: 'contents' }}>
          {i > 0 && (
            <div
              className="pane-divider"
              onMouseDown={e => handleDividerMouseDown(e, i)}
            />
          )}
          <Pane pane={pane} isActive={pane.id === activePaneId} />
        </span>
      ))}
    </>
  )
}
