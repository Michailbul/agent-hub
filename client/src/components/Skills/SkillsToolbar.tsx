import { useState } from 'react'
import { useSkillsStore } from '@/store/skills'

interface SkillsToolbarProps {
  totalCount: number
  unsyncedCount: number
}

export function SkillsToolbar({ totalCount, unsyncedCount }: SkillsToolbarProps) {
  const sources = useSkillsStore(s => s.sources)
  const activeSourceId = useSkillsStore(s => s.activeSourceId)
  const setActiveSource = useSkillsStore(s => s.setActiveSource)
  const searchQuery = useSkillsStore(s => s.searchQuery)
  const setSearchQuery = useSkillsStore(s => s.setSearchQuery)
  const syncFilter = useSkillsStore(s => s.syncFilter)
  const setSyncFilter = useSkillsStore(s => s.setSyncFilter)
  const repos = useSkillsStore(s => s.repos)
  const pullRepo = useSkillsStore(s => s.pullRepo)

  const [pullingId, setPullingId] = useState<string | null>(null)

  const handlePull = async (repoId: string) => {
    setPullingId(repoId)
    try {
      await pullRepo(repoId)
    } catch (err) {
      console.error('Pull failed:', err)
    } finally {
      setPullingId(null)
    }
  }

  return (
    <div className="sk-toolbar">
      <div className="sk-toolbar-top">
        <div className="sk-toolbar-title">
          <span className="sk-toolbar-heading">Skills</span>
          <span className="sk-toolbar-count">{totalCount}</span>
        </div>
        <div className="sk-search-wrap">
          <input
            className="sk-search"
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="sk-source-pills">
        <button
          className={`sk-source-pill${activeSourceId === null && syncFilter === 'all' ? ' active' : ''}`}
          onClick={() => { setActiveSource(null); setSyncFilter('all') }}
        >
          All
        </button>
        {sources.map(source => (
          <button
            key={source.id}
            className={`sk-source-pill${activeSourceId === source.id ? ' active' : ''}`}
            onClick={() => { setActiveSource(activeSourceId === source.id ? null : source.id); setSyncFilter('all') }}
          >
            {source.label.replace(' Skills', '').replace(' Workspace', '')}
          </button>
        ))}
        {unsyncedCount > 0 && (
          <>
            <span className="sk-pill-divider" />
            <button
              className={`sk-source-pill sk-pill-sync${syncFilter === 'unsynced' ? ' active' : ''}`}
              onClick={() => { setSyncFilter(syncFilter === 'unsynced' ? 'all' : 'unsynced'); setActiveSource(null) }}
            >
              Unsynced
              <span className="sk-pill-badge">{unsyncedCount}</span>
            </button>
          </>
        )}
      </div>
      {repos.length > 0 && (
        <div className="sk-repo-row">
          {repos.map(repo => (
            <div key={repo.id} className="sk-repo-chip">
              <span className="sk-repo-chip-name">{repo.name}</span>
              {repo.skillCount !== undefined && (
                <span className="sk-repo-chip-count">{repo.skillCount}</span>
              )}
              {repo.isGitRepo && (
                <button
                  className="sk-repo-pull"
                  onClick={() => handlePull(repo.id)}
                  disabled={pullingId === repo.id}
                  title="Git pull"
                >
                  {pullingId === repo.id ? '...' : '\u2193'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
