import { useEffect } from 'react'
import { useSkillsStore } from '@/store/skills'
import { SkillsInventory } from './SkillsInventory'
import { SkillDetailPanel } from './SkillDetailPanel'
import { SkillCreatePanel } from './SkillCreatePanel'

export function SkillsPanel() {
  const loadSkills = useSkillsStore(s => s.loadSkills)
  const loadRepos = useSkillsStore(s => s.loadRepos)
  const loading = useSkillsStore(s => s.loading)
  const selectedSkillId = useSkillsStore(s => s.selectedSkillId)
  const creatingSkill = useSkillsStore(s => s.creatingSkill)

  useEffect(() => {
    void loadSkills()
    void loadRepos()
  }, [loadSkills, loadRepos])

  return (
    <div className="sk-layout">
      {loading && <div className="sk-loading-bar" />}
      <SkillsInventory />
      <div className="sk-detail">
        {creatingSkill ? (
          <SkillCreatePanel />
        ) : selectedSkillId ? (
          <SkillDetailPanel />
        ) : (
          <div className="sk-empty">
            <div className="sk-empty-icon">{'\u2728'}</div>
            <div className="sk-empty-text">Select a skill or create a new one</div>
          </div>
        )}
      </div>
    </div>
  )
}
