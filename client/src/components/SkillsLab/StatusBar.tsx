type StatusBarProps = {
  filtered: number
  total: number
  scope: string
  hasFilters: boolean
}

export function StatusBar({ filtered, total, scope, hasFilters }: StatusBarProps) {
  return (
    <div className="kl-status-bar">
      <div className="kl-status-bar-section">
        <span className="kl-status-bar-dot" />
        <span>{filtered}/{total} skills</span>
      </div>
      <div className="kl-status-bar-section">
        <span>{scope === 'claude' ? 'Claude Code' : 'All libraries'}</span>
      </div>
      {hasFilters && (
        <span className="kl-status-bar-filtered">Filtered</span>
      )}
      <div className="kl-status-bar-kbd">
        <kbd>Cmd+K</kbd> Search
      </div>
    </div>
  )
}
