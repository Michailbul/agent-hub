type StatusBarProps = {
  filtered: number
  total: number
  scope: string
  hasFilters: boolean
  onResetFilters?: () => void
}

export function StatusBar({ filtered, total, scope, hasFilters, onResetFilters }: StatusBarProps) {
  return (
    <div className="kl-status-bar">
      <div className="kl-status-bar-section">
        <span className="kl-status-bar-dot" />
        <span>{filtered}/{total} skills</span>
      </div>
      <div className="kl-status-bar-section">
        <span>{scope === 'agents' ? 'Agents' : scope === 'claude-code' ? 'Claude Code' : scope === 'openclaw' ? 'OpenClaw' : scope}</span>
      </div>
      {hasFilters && (
        <>
          <span className="kl-status-bar-filtered">Filtered</span>
          {onResetFilters && (
            <button className="kl-status-bar-reset" onClick={onResetFilters}>
              Reset filters
            </button>
          )}
        </>
      )}
      <div className="kl-status-bar-kbd">
        <kbd>Cmd+K</kbd> Search
      </div>
    </div>
  )
}
