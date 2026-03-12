import { useCallback } from 'react'
import { useCanvasStore } from '@/store/canvas'

export function AgentList() {
  const data = useCanvasStore(s => s.data)
  const selectedAgentId = useCanvasStore(s => s.selectedAgentId)
  const setSelectedAgent = useCanvasStore(s => s.setSelectedAgent)
  const enterAgentDocs = useCanvasStore(s => s.enterAgentDocs)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!data) return
    const agents = data.agents
    const idx = agents.findIndex(a => a.id === selectedAgentId)
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault()
      const next = Math.min(idx + 1, agents.length - 1)
      setSelectedAgent(agents[next].id)
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault()
      const prev = Math.max(idx - 1, 0)
      setSelectedAgent(agents[prev].id)
    }
  }, [data, selectedAgentId, setSelectedAgent])

  if (!data) return null

  return (
    <div className="cv-list" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="cv-list-header">
        <span className="cv-list-title">Agents</span>
        <span className="cv-list-count">{data.agents.length}</span>
      </div>
      <div className="cv-list-items">
        {data.agents.map(agent => {
          const isActive = agent.id === selectedAgentId
          const modelShort = agent.model.primary
            ? agent.model.primary.split('/').pop() || agent.model.primary
            : null
          return (
            <button
              key={agent.id}
              className={`cv-list-item${isActive ? ' active' : ''}`}
              onClick={() => setSelectedAgent(agent.id)}
              onDoubleClick={() => enterAgentDocs(agent.id)}
            >
              <span className="cv-list-emoji">{agent.emoji}</span>
              <div className="cv-list-content">
                <span className="cv-list-name">{agent.label}</span>
                <span className="cv-list-role">{agent.role}</span>
              </div>
              <div className="cv-list-right">
                {agent.skillCount > 0 && (
                  <span className="cv-list-badge">{agent.skillCount}</span>
                )}
                {modelShort && (
                  <span className="cv-list-model">{modelShort}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
      <div className="cv-status-bar">
        <span className="cv-status-text">{data.agents.length} agents</span>
      </div>
    </div>
  )
}
