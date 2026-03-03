import { useState } from 'react'
import type { SkillLibrary, StudioSection } from '@/types'
import { FileItem } from './FileItem'
import { useUIStore } from '@/store/ui'
import { usePanesStore } from '@/store/panes'

interface SkillLibrarySectionProps {
  library: SkillLibrary
}

export function SkillLibrarySection({ library }: SkillLibrarySectionProps) {
  const [open, setOpen] = useState(false)
  const filter = useUIStore(s => s.filter)
  const activePath = usePanesStore(s => {
    const p = s.panes.find(p => p.id === s.activePaneId)
    return p?.path ?? null
  })

  const visibleFiles = library.files.filter(f => {
    if (filter === 'all') return true
    return f.source === filter
  })

  if (visibleFiles.length === 0) return null

  return (
    <div className="lib-card">
      <div className="lib-hdr" onClick={() => setOpen(!open)}>
        <div className="lib-ic">{library.emoji}</div>
        <div>
          <div className="lib-nm">{library.label}</div>
          <div className="lib-sub">{visibleFiles.length} skills</div>
        </div>
        <span className="arr" style={{ marginLeft: 'auto' }}>
          {open ? '' : ''}▾
        </span>
      </div>
      <div className={`lib-files${open ? '' : ' hidden'}`}>
        {visibleFiles.map(f => (
          <FileItem key={f.path} file={f} activePath={activePath} />
        ))}
      </div>
    </div>
  )
}

interface StudioSectionProps {
  studio: StudioSection
}

export function StudioSectionComponent({ studio }: StudioSectionProps) {
  const [open, setOpen] = useState(false)
  const activePath = usePanesStore(s => {
    const p = s.panes.find(p => p.id === s.activePaneId)
    return p?.path ?? null
  })

  if (!studio.files.length) return null

  return (
    <>
      <div className="sb-div" />
      <div className="grp-lbl">Studio</div>
      <div className="studio-card">
        <div className="studio-hdr" onClick={() => setOpen(!open)}>
          <div className="studio-ic">{studio.emoji}</div>
          <div>
            <div className="lib-nm">{studio.label}</div>
            <div className="lib-sub">HQ context</div>
          </div>
          <span className="arr" style={{ marginLeft: 'auto' }}>▾</span>
        </div>
        <div className={`studio-files${open ? '' : ' hidden'}`}>
          {studio.files.map(f => (
            <FileItem key={f.path} file={f} activePath={activePath} />
          ))}
        </div>
      </div>
    </>
  )
}
