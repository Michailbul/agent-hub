import { useMemo, useState } from 'react'
import { useSkillsStore } from '@/store/skills'
import type { IndexSkill } from '@/store/skills'
import { SkillsToolbar } from './SkillsToolbar'
import { SkillFolder } from './SkillFolder'
import { SkillRow } from './SkillRow'

export function SkillsInventory() {
  const skills = useSkillsStore(s => s.skills)
  const sources = useSkillsStore(s => s.sources)
  const agents = useSkillsStore(s => s.agents)
  const folders = useSkillsStore(s => s.folders)
  const searchQuery = useSkillsStore(s => s.searchQuery)
  const activeSourceId = useSkillsStore(s => s.activeSourceId)
  const syncFilter = useSkillsStore(s => s.syncFilter)
  const draggedSkill = useSkillsStore(s => s.draggedSkill)
  const dropTargetAgentId = useSkillsStore(s => s.dropTargetAgentId)
  const setDropTargetAgent = useSkillsStore(s => s.setDropTargetAgent)
  const assignSkill = useSkillsStore(s => s.assignSkill)
  const createFolder = useSkillsStore(s => s.createFolder)

  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const q = searchQuery.trim().toLowerCase()

  const unsyncedCount = useMemo(() => skills.filter(s => !s.isInMaster).length, [skills])

  const filtered = useMemo(() => {
    let result = skills

    if (syncFilter === 'unsynced') {
      result = result.filter(s => !s.isInMaster)
    }

    if (activeSourceId) {
      result = result.filter(s =>
        s.variants.some(v => v.sourceId === activeSourceId)
      )
    }

    if (q) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        (s.grouping?.department || '').toLowerCase().includes(q)
      )
    }

    return result
  }, [skills, activeSourceId, syncFilter, q])

  // Group skills: folder skills vs root-level skills
  const { folderGroups, rootSkills } = useMemo(() => {
    const folderMap = new Map<string, IndexSkill[]>()
    const root: IndexSkill[] = []

    for (const skill of filtered) {
      const folder = skill.variants[0]?.folder
      if (folder) {
        if (!folderMap.has(folder)) folderMap.set(folder, [])
        folderMap.get(folder)!.push(skill)
      } else {
        root.push(skill)
      }
    }

    // Sort folder names
    const folderGroups = [...folderMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))

    return { folderGroups, rootSkills: root }
  }, [filtered])

  const handleAgentDragOver = (e: React.DragEvent, agentId: string) => {
    if (e.dataTransfer.types.includes('application/x-skill-assign')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
      setDropTargetAgent(agentId)
    }
  }

  const handleAgentDrop = async (e: React.DragEvent, agentId: string) => {
    e.preventDefault()
    setDropTargetAgent(null)
    try {
      const raw = e.dataTransfer.getData('application/x-skill-assign')
      if (!raw) return
      const data = JSON.parse(raw)
      await assignSkill(agentId, data.variantPath)
    } catch (err) {
      console.error('Assign failed:', err)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) { setCreatingFolder(false); return }
    // Pick the first library source root for folder creation
    const libSource = sources.find(s => s.kind === 'library')
    if (!libSource) return
    try {
      await createFolder(libSource.root, newFolderName.trim())
      setNewFolderName('')
      setCreatingFolder(false)
    } catch (err) {
      console.error('Create folder failed:', err)
    }
  }

  return (
    <div className="sk-list">
      <SkillsToolbar totalCount={filtered.length} unsyncedCount={unsyncedCount} />

      {/* Agent drop targets */}
      <div className="sk-list-agents">
        <div className="sk-list-section-label">Agents</div>
        <div className="sk-list-agents-row">
          {agents.map(agent => {
            const isTarget = dropTargetAgentId === agent.id
            const count = skills.filter(s => s.installedAgentIds.includes(agent.id)).length
            return (
              <div
                key={agent.id}
                className={`sk-agent-target${isTarget ? ' drop-hover' : ''}${draggedSkill ? ' drag-active' : ''}`}
                onDragOver={e => handleAgentDragOver(e, agent.id)}
                onDragLeave={() => setDropTargetAgent(null)}
                onDrop={e => handleAgentDrop(e, agent.id)}
              >
                <span className="sk-agent-emoji">{agent.emoji}</span>
                <span className="sk-agent-name">{agent.label}</span>
                <span className="sk-agent-count">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Skill tree */}
      <div className="sk-list-tree">
        <div className="sk-list-section-label">
          Library
        </div>

        {/* Folders with their skills */}
        {folderGroups.map(([folderName, folderSkills]) => (
          <SkillFolder
            key={folderName}
            folderName={folderName}
            skills={folderSkills}
            folder={folders.find(f => f.name === folderName)}
          />
        ))}

        {/* Root-level skills (not in any folder) */}
        {rootSkills.map(skill => (
          <SkillRow key={skill.id} skill={skill} />
        ))}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="sk-empty sk-empty-inline">
            <div className="sk-empty-text">
              {q || activeSourceId || syncFilter !== 'all' ? 'No matching skills' : 'No skills found'}
            </div>
          </div>
        )}

        {/* New folder button */}
        {!creatingFolder ? (
          <button
            className="sk-new-folder-btn"
            onClick={() => setCreatingFolder(true)}
          >
            <span className="sk-new-folder-icon">+</span>
            New Folder
          </button>
        ) : (
          <div className="sk-new-folder-input-row">
            <input
              className="sk-new-folder-input"
              type="text"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') void handleCreateFolder()
                if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
              }}
              onBlur={() => void handleCreateFolder()}
              autoFocus
            />
          </div>
        )}
      </div>
    </div>
  )
}
