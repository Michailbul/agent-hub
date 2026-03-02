import { useState, useCallback } from 'react'
import type { Agent } from '@/types'
import { FileItem } from './FileItem'
import { useUIStore } from '@/store/ui'
import { usePanesStore } from '@/store/panes'

interface AgentSectionProps {
  agent: Agent
  isOpen: boolean
  onToggle: () => void
}

function SubSection({
  icon,
  label,
  files,
  activePath,
  agents,
}: {
  icon: string
  label: string
  files: Agent['instructions']
  activePath: string | null
  agents: Agent[]
}) {
  const [open, setOpen] = useState(true)
  const filter = useUIStore(s => s.filter)

  const visibleFiles = files.filter(f => {
    if (filter === 'all') return true
    return (f.source || 'openclaw') === filter
  })

  if (visibleFiles.length === 0) return null

  return (
    <div className="sub-s">
      <div className="sub-hdr" onClick={e => { e.stopPropagation(); setOpen(!open) }}>
        <span className="sub-ico">{icon}</span>
        <span className="sub-lbl">{label}</span>
        <span className="sub-cnt">{visibleFiles.length}</span>
        <span className={`sub-arr${open ? ' dn' : ''}`}>\u25BE</span>
      </div>
      <div className={`sub-files${open ? '' : ' hidden'}`}>
        {visibleFiles.map(f => (
          <FileItem key={f.path} file={f} activePath={activePath} agents={agents} />
        ))}
      </div>
    </div>
  )
}

interface AgentSectionProps2 extends AgentSectionProps { agents: Agent[] }
export function AgentSection({ agent, isOpen, onToggle, agents }: AgentSectionProps2) {
  const activePath = usePanesStore(s => {
    const p = s.panes.find(p => p.id === s.activePaneId)
    return p?.path ?? null
  })

  const total = agent.instructions.length + agent.skills.length

  const handleClick = useCallback(() => {
    onToggle()
  }, [onToggle])

  return (
    <div className={`agent-card${isOpen ? ' is-open' : ''}`}>
      <div className={`agent-hdr${isOpen ? ' is-open' : ''}`} onClick={handleClick}>
        <div className="av">{agent.emoji}</div>
        <div className="a-info">
          <div className="a-name">{agent.label}</div>
          <div className="a-role">{agent.role}</div>
        </div>
        <span className="a-badge">{total}</span>
        <span className={`arr${isOpen ? ' dn' : ''}`}>\u25BE</span>
      </div>
      <div className={`agent-body${isOpen ? ' open' : ''}`}>
        {agent.instructions.length > 0 && (
          <SubSection icon="\uD83D\uDCCB" label="Instructions" files={agent.instructions} activePath={activePath} agents={agents} />
        )}
        {agent.skills.length > 0 && (
          <SubSection icon="\uD83E\uDDE0" label="Skills" files={agent.skills} activePath={activePath} agents={agents} />
        )}
      </div>
    </div>
  )
}
