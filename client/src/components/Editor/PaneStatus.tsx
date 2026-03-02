interface PaneStatusProps {
  lines: number
  words: number
  cursorLine: number
  cursorCol: number
}

export function PaneStatus({ lines, words, cursorLine, cursorCol }: PaneStatusProps) {
  return (
    <div className="pane-status">
      <span className="st">Lines: {lines}</span>
      <span className="st">Words: {words}</span>
      <span className="st">Ln {cursorLine}, Col {cursorCol}</span>
    </div>
  )
}
