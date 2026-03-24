import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Feather } from 'lucide-react'
import type { UnifiedSkill } from '@/store/skillsLab'

type CommandPaletteProps = {
  skills: UnifiedSkill[]
  onSelectSkill: (skillId: string) => void
  onClose: () => void
}

export function CommandPalette({ skills, onSelectSkill, onClose }: CommandPaletteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)

  const results = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return skills.slice(0, 20)

    return skills
      .filter(s => {
        const name = s.displayName.toLowerCase()
        const pillar = s.pillarName.toLowerCase()
        const family = (s.familyLabel || '').toLowerCase()
        return name.includes(q) || pillar.includes(q) || family.includes(q)
      })
      .slice(0, 30)
  }, [query, skills])

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[highlighted]) {
      e.preventDefault()
      onSelectSkill(results[highlighted].id)
      onClose()
    }
  }

  return (
    <div className="kl-command-backdrop" onClick={onClose}>
      <div className="kl-command-card" onClick={e => e.stopPropagation()}>
        <div className="kl-command-input-wrap">
          <Search size={16} strokeWidth={1.5} className="kl-command-input-icon" />
          <input
            ref={inputRef}
            className="kl-command-input"
            placeholder="Search skills..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <span className="kl-command-hint">ESC</span>
        </div>

        <div className="kl-command-results">
          {results.length === 0 ? (
            <div className="kl-command-empty">
              No skills match &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              <div className="kl-command-group-label">
                {query.trim() ? 'Results' : 'Recent skills'}
              </div>
              {results.map((skill, i) => (
                <button
                  key={skill.id}
                  className={`kl-command-item${i === highlighted ? ' highlighted' : ''}`}
                  onClick={() => {
                    onSelectSkill(skill.id)
                    onClose()
                  }}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <Feather size={14} strokeWidth={1.5} className="kl-command-item-icon" />
                  <span className="kl-command-item-name">{skill.displayName}</span>
                  <span className="kl-command-item-meta">{skill.pillarName}</span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="kl-command-footer">
          <span><kbd>&uarr;</kbd> <kbd>&darr;</kbd> navigate</span>
          <span><kbd>Enter</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
