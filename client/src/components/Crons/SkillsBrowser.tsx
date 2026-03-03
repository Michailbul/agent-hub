import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { TreeData } from '@/types'
import { BADGE_PALETTE } from '@/components/Sidebar/AgentBadge'

interface SkillsBrowserProps {
  onInsertSkill: (name: string) => void
}

type SkillEntry = {
  name: string
  path: string
  agents: string[]
}

type SkillCategory = 'all' | 'coding' | 'content' | 'research' | 'data' | 'tools'

const CATEGORIES: Array<{ id: SkillCategory; label: string; keywords?: string[] }> = [
  { id: 'all', label: 'All' },
  { id: 'coding', label: 'Code', keywords: ['codex', 'coding', 'github', 'claude', 'git', 'pr', 'build'] },
  { id: 'content', label: 'Content', keywords: ['content', 'copy', 'social', 'carousel', 'writing', 'humanizer', 'ad', 'tweet', 'x-'] },
  { id: 'research', label: 'Research', keywords: ['research', 'web', 'search', 'extract', 'summarize', 'youtube', 'weather'] },
  { id: 'data', label: 'Data', keywords: ['kb', 'notion', 'data', 'enrichment', 'storage'] },
  { id: 'tools', label: 'Utils' },
]

function getCategory(name: string): SkillCategory {
  const n = name.toLowerCase()
  for (const cat of CATEGORIES.slice(1, -1)) {
    if (cat.keywords?.some(k => n.includes(k))) return cat.id
  }
  return 'tools'
}

function skillFolderName(fullPath: string): string {
  const chunks = fullPath.split(/[\\/]/).filter(Boolean)
  return chunks.length >= 2 ? chunks[chunks.length - 2] : chunks[chunks.length - 1]
}

function highlightMatch(name: string, query: string): ReactNode {
  const q = query.trim()
  if (!q) return name

  const idx = name.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return name

  const before = name.slice(0, idx)
  const hit = name.slice(idx, idx + q.length)
  const after = name.slice(idx + q.length)

  return (
    <>
      {before}
      <mark style={{ background: 'var(--accent-subtle)', color: 'inherit', padding: 0 }}>{hit}</mark>
      {after}
    </>
  )
}

export function SkillsBrowser({ onInsertSkill }: SkillsBrowserProps) {
  const [agents, setAgents] = useState<TreeData['agents']>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<SkillCategory>('all')

  useEffect(() => {
    const loadTree = async () => {
      try {
        const response = await fetch('/api/tree')
        if (!response.ok) return
        const data = (await response.json()) as TreeData
        setAgents(data.agents || [])
      } catch {
        setAgents([])
      }
    }

    void loadTree()
  }, [])

  const agentColorByLabel = useMemo(() => {
    const map = new Map<string, string>()
    agents.forEach((agent, index) => {
      map.set(agent.label, BADGE_PALETTE[index % BADGE_PALETTE.length])
    })
    return map
  }, [agents])

  const skills = useMemo<SkillEntry[]>(() => {
    const map = new Map<string, SkillEntry>()

    for (const agent of agents) {
      for (const skill of agent.skills) {
        const name = skillFolderName(skill.path)
        const key = name.toLowerCase()
        const existing = map.get(key)

        if (!existing) {
          map.set(key, { name, path: skill.path, agents: [agent.label] })
          continue
        }

        if (!existing.agents.includes(agent.label)) {
          existing.agents.push(agent.label)
        }
      }
    }

    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [agents])

  const query = search.trim().toLowerCase()

  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      const matchesSearch = !query || skill.name.toLowerCase().includes(query)
      const matchesCategory = activeCategory === 'all' || getCategory(skill.name) === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [activeCategory, query, skills])

  const count = filteredSkills.length

  return (
    <div className="skills-browser">
      <div className="skills-browser-header">
        <span className="crons-list-label">Skills</span>
        <span className="a-badge">{count}</span>
      </div>

      <div className="skills-search-wrap">
        <input
          className="skills-search"
          placeholder="Search skills..."
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      <div className="skills-filter-bar">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`skills-filter-btn${activeCategory === cat.id ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="skills-list">
        {filteredSkills.map(skill => (
          <div key={skill.path} className="skill-item" onClick={() => onInsertSkill(skill.name)}>
            <div className="skill-name">{highlightMatch(skill.name, search)}</div>
            <div className="skill-tags">
              {skill.agents.map(agentLabel => (
                <span
                  key={`${skill.name}-${agentLabel}`}
                  className="skill-agent-tag"
                  style={{ borderColor: agentColorByLabel.get(agentLabel), background: agentColorByLabel.get(agentLabel) }}
                >
                  {agentLabel}
                </span>
              ))}
            </div>
          </div>
        ))}

        {filteredSkills.length === 0 && (
          <div className="crons-empty">No matching skills</div>
        )}
      </div>
    </div>
  )
}
