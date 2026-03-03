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
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loadTree = async () => {
      try {
        const response = await fetch('/api/tree')
        if (!response.ok) return
        const data = (await response.json()) as TreeData
        setAgents(data.agents || [])
        setGroupOpen(prev => {
          const next = { ...prev }
          for (const agent of data.agents || []) {
            if (next[agent.label] === undefined) next[agent.label] = true
          }
          return next
        })
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
  const searchActive = query.length > 0

  const filteredSkills = useMemo(() => {
    if (!query) return skills
    return skills.filter(skill => skill.name.toLowerCase().includes(query))
  }, [query, skills])

  const groupedSkills = useMemo(() => {
    const groups: Array<{ agentLabel: string; items: SkillEntry[] }> = []

    for (const agent of agents) {
      const items = skills.filter(skill => skill.agents.includes(agent.label))
      if (items.length > 0) groups.push({ agentLabel: agent.label, items })
    }

    return groups
  }, [agents, skills])

  const count = searchActive ? filteredSkills.length : skills.length

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

      <div className="skills-list">
        {searchActive ? (
          filteredSkills.map(skill => (
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
          ))
        ) : (
          groupedSkills.map(group => (
            <div key={group.agentLabel}>
              <button
                className="skills-group-header"
                onClick={() => setGroupOpen(prev => ({ ...prev, [group.agentLabel]: !prev[group.agentLabel] }))}
              >
                <span>{groupOpen[group.agentLabel] ? '▾' : '▸'}</span>
                <span>{group.agentLabel}</span>
                <span>({group.items.length})</span>
              </button>
              {groupOpen[group.agentLabel] !== false && group.items.map(skill => (
                <div key={`${group.agentLabel}-${skill.path}`} className="skill-item" onClick={() => onInsertSkill(skill.name)}>
                  <div className="skill-name">{skill.name}</div>
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
            </div>
          ))
        )}
      </div>
    </div>
  )
}
