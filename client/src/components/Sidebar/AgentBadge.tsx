const BADGE_PALETTE = ['#ff7a64', '#c4b5fd', '#fde68a', '#7dd3fc', '#f9a8d4', '#a5b4fc']

interface AgentBadgeProps {
  label: string
  index: number
}

function initials(label: string): string {
  const clean = label.trim()
  if (!clean) return 'AG'
  return clean.slice(0, 2).toUpperCase()
}

export function AgentBadge({ label, index }: AgentBadgeProps) {
  const bg = BADGE_PALETTE[index % BADGE_PALETTE.length]
  return (
    <div className="av agent-badge" style={{ background: bg, boxShadow: '2px 2px 0 #201710' }}>
      {initials(label)}
    </div>
  )
}

export { BADGE_PALETTE }
