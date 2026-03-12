import { useEffect } from 'react'
import { useSkillsStore } from '@/store/skills'
import { SkillsInventory } from './SkillsInventory'
import { SkillDetailPanel } from './SkillDetailPanel'

export function SkillsPanel() {
  const loadSkills = useSkillsStore(s => s.loadSkills)
  const loadRepos = useSkillsStore(s => s.loadRepos)
  const loading = useSkillsStore(s => s.loading)
  const selectedSkillId = useSkillsStore(s => s.selectedSkillId)

  useEffect(() => {
    void loadSkills()
    void loadRepos()
  }, [loadSkills, loadRepos])

  return (
    <div className="sk-layout">
      {loading && <div className="sk-loading-bar" />}
      <SkillsInventory />
      <div className="sk-detail">
        {selectedSkillId ? (
          <SkillDetailPanel />
        ) : (
          <div className="sk-empty">
            <div className="sk-empty-icon">{'\u2728'}</div>
            <div className="sk-empty-text">Select a skill to view details</div>
          </div>
        )}
      </div>
    </div>
  )
}
