import { useEffect, useMemo, useState } from 'react'
import type { TreeData } from '@/types'

type SkillsDrawerProps = {
  open: boolean
  onClose: () => void
  onInsertSkill: (name: string) => void
}

type SkillCategory = 'all' | 'coding' | 'content' | 'research' | 'data' | 'tools'

type SkillEntry = {
  name: string
  agents: { id: string; label: string; color: string }[]
}

const CATEGORIES: Array<{ id: SkillCategory; label: string; keywords?: string[] }> = [
  { id: 'all', label: 'All' },
  { id: 'coding', label: 'Code', keywords: ['codex', 'coding', 'github', 'claude', 'git', 'pr', 'build'] },
  { id: 'content', label: 'Content', keywords: ['content', 'copy', 'social', 'carousel', 'writing', 'humanizer', 'ad', 'tweet', 'x-'] },
  { id: 'research', label: 'Research', keywords: ['research', 'web', 'search', 'extract', 'summarize', 'youtube', 'weather'] },
  { id: 'data', label: 'Data', keywords: ['kb', 'notion', 'data', 'enrichment', 'storage'] },
  { id: 'tools', label: 'Utils' },
]

function getCategory(name: string): SkillCategory {
  const normalized = name.toLowerCase()
  for (const category of CATEGORIES.slice(1, -1)) {
    if (category.keywords?.some(keyword => normalized.includes(keyword))) return category.id
  }
  return 'tools'
}

function skillFolderName(fullPath: string): string {
  const chunks = fullPath.split(/[\\/]/).filter(Boolean)
  return chunks.length >= 2 ? chunks[chunks.length - 2] : chunks[chunks.length - 1]
}

function hashColor(seed: string): string {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }

  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 65% 40%)`
}

export function SkillsDrawer({ open, onClose, onInsertSkill }: SkillsDrawerProps) {
  const [skills, setSkills] = useState<SkillEntry[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<SkillCategory>('all')

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/tree')
        if (!response.ok) return

        const data = (await response.json()) as TreeData
        const map = new Map<string, SkillEntry>()

        for (const agent of data.agents || []) {
          for (const skill of agent.skills || []) {
            const name = skillFolderName(skill.path)
            const key = name.toLowerCase()
            const existing = map.get(key)
            const owner = {
              id: agent.id,
              label: agent.label,
              color: hashColor(agent.id),
            }

            if (!existing) {
              map.set(key, { name, agents: [owner] })
              continue
            }

            if (!existing.agents.some(entry => entry.id === owner.id)) {
              existing.agents.push(owner)
            }
          }
        }

        setSkills([...map.values()].sort((a, b) => a.name.localeCompare(b.name)))
      } catch {
        setSkills([])
      }
    }

    void load()
  }, [])

  const filteredSkills = useMemo(() => {
    const query = search.trim().toLowerCase()
    return skills.filter(skill => {
      const matchSearch = !query || skill.name.toLowerCase().includes(query)
      const matchCategory = activeCategory === 'all' || getCategory(skill.name) === activeCategory
      return matchSearch && matchCategory
    })
  }, [activeCategory, search, skills])

  return (
    <aside className={`skills-drawer${open ? ' open' : ''}`}>
      <div className="skills-drawer-header">
        <span className="skills-drawer-title">SKILLS</span>
        <button className="skills-drawer-close" onClick={onClose} aria-label="Close skills drawer">×</button>
      </div>

      <div className="skills-drawer-body">
        <input
          className="cron-skills-search"
          placeholder="Search skills..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />

        <div className="cron-skills-filter-bar">
          {CATEGORIES.map(category => (
            <button
              key={category.id}
              className={`skills-filter-btn${activeCategory === category.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="cron-skills-grid">
          {filteredSkills.map(skill => (
            <button
              key={skill.name}
              className="skill-pill"
              draggable
              onDragStart={event => {
                event.dataTransfer.setData('text/plain', skill.name)
                event.dataTransfer.setData('application/x-agent-hub-skill', skill.name)
                event.dataTransfer.effectAllowed = 'copy'
              }}
              onClick={() => onInsertSkill(skill.name)}
            >
              <span>{skill.name}</span>
              <span className="skill-pill-agents">
                {skill.agents.slice(0, 3).map(agent => (
                  <span
                    key={`${skill.name}-${agent.id}`}
                    className="skill-agent-tag"
                    style={{ borderColor: agent.color, color: agent.color }}
                    title={agent.label}
                  >
                    {agent.label}
                  </span>
                ))}
              </span>
            </button>
          ))}

          {filteredSkills.length === 0 && <div className="crons-empty">No matching skills</div>}
        </div>
      </div>
    </aside>
  )
}
