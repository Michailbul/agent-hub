import { useState, useCallback } from 'react'
import type { TreeData } from '@/types'
import { FilterBar } from './FilterBar'
import { AgentSection } from './AgentSection'
import { SkillLibrarySection, StudioSectionComponent } from './SkillLibrarySection'

interface SidebarProps {
  tree: TreeData | null
}

export function Sidebar({ tree }: SidebarProps) {
  const [openAgentId, setOpenAgentId] = useState<string | null>(null)

  const handleToggle = useCallback(
    (id: string) => {
      setOpenAgentId(prev => (prev === id ? null : id))
    },
    [],
  )

  if (!tree) return <div className="sidebar" />

  return (
    <div className="sidebar">
      <FilterBar />
      <div className="grp-lbl">Agents</div>
      {tree.agents.map(agent => (
        <AgentSection
          key={agent.id}
          agent={agent}
          isOpen={openAgentId === agent.id}
          onToggle={() => handleToggle(agent.id)}
        />
      ))}
      <div className="sb-div" />
      <div className="grp-lbl">Skill Libraries</div>
      {tree.libraries.map(lib => (
        <SkillLibrarySection key={lib.id} library={lib} />
      ))}
      {tree.studio && <StudioSectionComponent studio={tree.studio} />}
    </div>
  )
}
