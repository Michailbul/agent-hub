interface Props {
  activeView: 'editor' | 'crons'
  onSwitch: (v: 'editor' | 'crons') => void
}

export function ActivityBar({ activeView, onSwitch }: Props) {
  return (
    <div className="activity-bar">
      <button
        className={`act-btn${activeView === 'editor' ? ' active' : ''}`}
        onClick={() => onSwitch('editor')}
        title="Files"
      >📄</button>
      <button
        className={`act-btn${activeView === 'crons' ? ' active' : ''}`}
        onClick={() => onSwitch('crons')}
        title="Crons"
      >⏰</button>
      <div className="act-spacer" />
      <button className="act-btn" title="Settings">⚙</button>
    </div>
  )
}
