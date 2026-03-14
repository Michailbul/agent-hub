import { useMemo, useState } from 'react'
import { useSkillsStore } from '@/store/skills'

export function SkillCreatePanel() {
  const sources = useSkillsStore(s => s.sources)
  const folders = useSkillsStore(s => s.folders)
  const draft = useSkillsStore(s => s.createSkillDraft)
  const cancelCreateSkill = useSkillsStore(s => s.cancelCreateSkill)
  const updateCreateSkillDraft = useSkillsStore(s => s.updateCreateSkillDraft)
  const createSkill = useSkillsStore(s => s.createSkill)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const masterSource = useMemo(
    () => sources.find(source => source.isMaster) || sources.find(source => source.kind === 'library' && source.ecosystem === 'agents') || null,
    [sources],
  )
  const folderOptions = useMemo(
    () => folders
      .filter(folder => folder.sourceId === masterSource?.id)
      .sort((left, right) => left.name.localeCompare(right.name)),
    [folders, masterSource?.id],
  )

  const handleSubmit = async () => {
    if (!draft.root) {
      setError('Master skills library is unavailable.')
      return
    }
    if (!draft.name.trim()) {
      setError('Name is required.')
      return
    }
    if (!draft.description.trim()) {
      setError('Description is required.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await createSkill()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create skill failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="sk-detail-inner">
      <div className="sk-detail-topbar">
        <button className="sk-detail-close" onClick={() => cancelCreateSkill()} title="Close">
          {'\u2715'}
        </button>
      </div>

      <div className="sk-detail-header">
        <h2 className="sk-detail-title">Create Skill</h2>
        <span className="sk-detail-dept">Master library</span>
      </div>

      <div className="sk-detail-meta">
        <div className="sk-meta-row">
          <span className="sk-meta-label">Source</span>
          <span className="sk-meta-value">{masterSource?.label || 'Unavailable'}</span>
        </div>
        <div className="sk-meta-row">
          <span className="sk-meta-label">Root</span>
          <span className="sk-meta-value sk-meta-folder">{draft.root || 'Unavailable'}</span>
        </div>
      </div>

      <div className="sk-detail-section">
        <div className="sk-detail-section-label">Skill Details</div>
        <label className="sk-form-field">
          <span className="sk-form-label">Name</span>
          <input
            className="sk-form-input"
            type="text"
            value={draft.name}
            onChange={e => {
              setError(null)
              updateCreateSkillDraft({ name: e.target.value })
            }}
            placeholder="Skill name"
          />
        </label>
        <label className="sk-form-field">
          <span className="sk-form-label">Description</span>
          <input
            className="sk-form-input"
            type="text"
            value={draft.description}
            onChange={e => {
              setError(null)
              updateCreateSkillDraft({ description: e.target.value })
            }}
            placeholder="What it does and when to use it"
          />
        </label>
        <label className="sk-form-field">
          <span className="sk-form-label">Folder</span>
          <select
            className="sk-form-input"
            value={draft.folder || ''}
            onChange={e => {
              setError(null)
              updateCreateSkillDraft({ folder: e.target.value || null })
            }}
          >
            <option value="">Root level</option>
            {folderOptions.map(folder => (
              <option key={folder.root} value={folder.name}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="sk-detail-section sk-detail-editor-section">
        <div className="sk-detail-section-label">Initial Content</div>
        <textarea
          className="sk-detail-editor"
          value={draft.body}
          onChange={e => {
            setError(null)
            updateCreateSkillDraft({ body: e.target.value, bodyTouched: true })
          }}
          spellCheck={false}
        />
      </div>

      {error && <div className="sk-form-error">{error}</div>}

      <div className="sk-detail-actions">
        <button
          className="sk-btn-save"
          onClick={() => void handleSubmit()}
          disabled={submitting || !draft.root}
        >
          {submitting ? 'Creating...' : 'Create Skill'}
        </button>
        <button className="sk-btn-delete" onClick={() => cancelCreateSkill()} disabled={submitting}>
          Cancel
        </button>
      </div>
    </div>
  )
}
