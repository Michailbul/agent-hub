import { Star } from 'lucide-react'
import type { UnifiedSkill } from '@/store/skillsLab'

type SkillCardViewProps = {
  skills: UnifiedSkill[]
  activeSkillId: string | null
  starredIds: Set<string>
  onSelect: (skillId: string) => void
  onToggleStar: (skillId: string) => void
}

export function SkillCardView({
  skills,
  activeSkillId,
  starredIds,
  onSelect,
  onToggleStar,
}: SkillCardViewProps) {
  return (
    <div className="kl-skill-grid">
      {skills.map(skill => (
        <div
          key={skill.id}
          className={`kl-skill-card${activeSkillId === skill.id ? ' active' : ''}`}
          onClick={() => onSelect(skill.id)}
        >
          <span className="kl-skill-card-name">{skill.displayName}</span>
          <span className="kl-skill-card-desc">
            {skill.pillarName}{skill.familyLabel ? ` \u00b7 ${skill.familyLabel}` : ''}
          </span>
          <div className="kl-skill-card-footer">
            <span className="kl-skill-card-chip">{skill.pillarName}</span>
            <button
              className={`kl-skill-card-star${starredIds.has(skill.id) ? ' starred' : ''}`}
              onClick={e => {
                e.stopPropagation()
                onToggleStar(skill.id)
              }}
              title={starredIds.has(skill.id) ? 'Unstar' : 'Star'}
            >
              <Star
                size={12}
                strokeWidth={1.5}
                fill={starredIds.has(skill.id) ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
