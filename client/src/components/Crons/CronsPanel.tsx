import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { TreeData } from '@/types'
import { useResizablePane } from '@/lib/useResizablePane'
import { useCronsStore } from '@/store/crons'
import { useLayoutStore } from '@/store/layout'
import { CronDetail, type CronDetailHandle } from './CronDetail'
import { CronListItem } from './CronListItem'
import { SkillsDrawer } from './SkillsDrawer'

function skillFolderName(fullPath: string): string {
  const chunks = fullPath.split(/[\\/]/).filter(Boolean)
  return chunks.length >= 2 ? chunks[chunks.length - 2] : chunks[chunks.length - 1]
}

export function CronsPanel() {
  const detailRef = useRef<CronDetailHandle | null>(null)

  const jobs = useCronsStore(state => state.jobs)
  const loading = useCronsStore(state => state.loading)
  const openJobIds = useCronsStore(state => state.openJobIds)
  const activeJobId = useCronsStore(state => state.activeJobId)
  const skillsOpen = useCronsStore(state => state.skillsOpen)
  const loadJobs = useCronsStore(state => state.loadJobs)
  const createJob = useCronsStore(state => state.createJob)
  const saveJob = useCronsStore(state => state.saveJob)
  const deleteJob = useCronsStore(state => state.deleteJob)
  const toggleJobEnabled = useCronsStore(state => state.toggleJobEnabled)
  const openJob = useCronsStore(state => state.openJob)
  const closeJob = useCronsStore(state => state.closeJob)
  const setActiveJobId = useCronsStore(state => state.setActiveJobId)
  const setSkillsOpen = useCronsStore(state => state.setSkillsOpen)

  const listWidth = useLayoutStore(state => state.cronsListWidth)
  const skillsWidth = useLayoutStore(state => state.cronsSkillsWidth)
  const setCronsListWidth = useLayoutStore(state => state.setCronsListWidth)
  const setCronsSkillsWidth = useLayoutStore(state => state.setCronsSkillsWidth)
  const hydrateFromStorage = useLayoutStore(state => state.hydrateFromStorage)

  const [skillsIndex, setSkillsIndex] = useState<string[]>([])

  useEffect(() => {
    hydrateFromStorage()
    void loadJobs()
  }, [hydrateFromStorage, loadJobs])

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetch('/api/tree')
        if (!response.ok) return

        const data = (await response.json()) as TreeData
        const names = new Set<string>()

        for (const agent of data.agents || []) {
          for (const skill of agent.skills || []) {
            names.add(skillFolderName(skill.path))
          }
        }

        setSkillsIndex([...names].sort((a, b) => a.localeCompare(b)))
      } catch {
        setSkillsIndex([])
      }
    }

    void loadSkills()
  }, [])

  const { handleProps: listResizeHandle } = useResizablePane({
    value: listWidth,
    onChange: setCronsListWidth,
    min: 180,
    max: 420,
    resetTo: 220,
  })

  const { handleProps: skillsResizeHandle } = useResizablePane({
    value: skillsWidth,
    onChange: setCronsSkillsWidth,
    min: 260,
    max: 520,
    enabled: skillsOpen,
    direction: -1,
    resetTo: 360,
  })

  const activeJob = useMemo(
    () => jobs.find(job => job.id === activeJobId) ?? null,
    [activeJobId, jobs],
  )

  const skillsReservedWidth = skillsOpen ? skillsWidth : 40
  const pageStyle: CSSProperties = {
    ['--crons-skills-space' as string]: `${skillsReservedWidth}px`,
  }

  return (
    <div className={`crons-page${skillsOpen ? ' skills-open' : ' skills-collapsed'}`} style={pageStyle}>
      <div className="crons-layout">
        <div className="crons-list-col" style={{ width: `${listWidth}px` }}>
          <div className="crons-list-header">
            <span className="crons-list-label">CRON JOBS</span>
            <button className="crons-new-btn" onClick={() => void createJob()}>+ New</button>
          </div>
          <div className="cron-list-scroll">
            {loading ? (
              <div className="crons-loading">Loading...</div>
            ) : jobs.length === 0 ? (
              <div className="crons-loading">No cron jobs</div>
            ) : jobs.map(job => (
              <CronListItem
                key={job.id}
                job={job}
                selected={openJobIds.includes(job.id) && job.id === activeJobId}
                onSelect={() => openJob(job.id)}
                onToggle={item => void toggleJobEnabled(item)}
              />
            ))}
          </div>
        </div>

        <div className="resize-handle-vertical crons-list-resize" {...listResizeHandle} aria-label="Resize cron list">
          <span className="resize-grip" aria-hidden="true">⋮</span>
        </div>

        <div className="crons-main-col">
          <div className="cron-tabs">
            {openJobIds.map(id => {
              const job = jobs.find(entry => entry.id === id)
              if (!job) return null
              return (
                <div
                  key={id}
                  className={`cron-tab${id === activeJobId ? ' active' : ''}`}
                  onClick={() => setActiveJobId(id)}
                >
                  <span className="cron-tab-name">{job.name}</span>
                  <button
                    className="cron-tab-close"
                    onClick={event => {
                      event.stopPropagation()
                      closeJob(id)
                    }}
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          {activeJob ? (
            <CronDetail
              ref={detailRef}
              job={activeJob}
              skills={skillsIndex}
              onOpenSkills={() => setSkillsOpen(true)}
              onSave={updated => void saveJob(updated)}
              onDelete={id => void deleteJob(id)}
            />
          ) : (
            <div className="crons-empty">← Select a cron job</div>
          )}
        </div>

        <div
          className={`crons-skills-rail${skillsOpen ? '' : ' collapsed'}`}
          style={{ width: `${skillsOpen ? skillsWidth : 40}px` }}
        >
          {skillsOpen && (
            <div className="resize-handle-vertical crons-skills-resize" {...skillsResizeHandle} aria-label="Resize skills panel">
              <span className="resize-grip" aria-hidden="true">⋮</span>
            </div>
          )}
          {skillsOpen ? (
            <SkillsDrawer
              open={true}
              onClose={() => setSkillsOpen(false)}
              onInsertSkill={name => detailRef.current?.insertSkill(name)}
            />
          ) : (
            <button
              type="button"
              className="skills-rail-handle"
              onClick={() => setSkillsOpen(true)}
              aria-label="Open skills"
            >
              SKILLS
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
