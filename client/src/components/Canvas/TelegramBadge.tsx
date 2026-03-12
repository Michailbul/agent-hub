interface TelegramBadgeProps {
  telegram: {
    accountId: string
    name: string
    enabled: boolean
    groupCount: number
    dmPolicy: string | null
  }
}

export function TelegramBadge({ telegram }: TelegramBadgeProps) {
  return (
    <div className="cv-tg-badge" title={`${telegram.name} · ${telegram.groupCount} group${telegram.groupCount !== 1 ? 's' : ''} · DM: ${telegram.dmPolicy || 'off'}`}>
      <span className={`cv-tg-dot ${telegram.enabled ? 'on' : 'off'}`} />
      <span className="cv-tg-icon">✈️</span>
      <span className="cv-tg-name">{telegram.name}</span>
      {telegram.groupCount > 0 && (
        <span className="cv-tg-groups">{telegram.groupCount}g</span>
      )}
    </div>
  )
}
