import { useCallback } from 'react'
import { useHQStore } from '@/store/hq'

export function LinkFolderDialog() {
  const {
    linkDialogOpen, linkForm, setLinkForm, submitLink, closeLinkDialog,
    pickFolder, pickingFolder,
  } = useHQStore()

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    submitLink()
  }, [submitLink])

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) closeLinkDialog()
  }, [closeLinkDialog])

  if (!linkDialogOpen) return null

  return (
    <div className="hq-dialog-backdrop" onClick={handleBackdrop}>
      <form className="hq-dialog" onSubmit={handleSubmit}>
        <div className="hq-dialog-header">
          <span className="hq-dialog-title">Link a folder</span>
          <button type="button" className="hq-dialog-close" onClick={closeLinkDialog}>x</button>
        </div>

        <div className="hq-dialog-body">
          {/* Folder path — primary action with Browse button */}
          <div className="hq-field">
            <span className="hq-field-label">Folder</span>
            <div className="hq-field-row">
              <input
                className="hq-field-input mono"
                value={linkForm.path}
                onChange={e => setLinkForm({ path: e.target.value })}
                placeholder="/path/to/folder or ~/folder"
                autoFocus
              />
              <button
                type="button"
                className="hq-btn-browse"
                onClick={pickFolder}
                disabled={pickingFolder}
              >
                {pickingFolder ? '...' : 'Browse'}
              </button>
            </div>
            <span className="hq-field-hint">
              Click Browse to open the system folder picker, or type a path
            </span>
          </div>

          <label className="hq-field">
            <span className="hq-field-label">Name</span>
            <input
              className="hq-field-input"
              value={linkForm.name}
              onChange={e => setLinkForm({ name: e.target.value })}
              placeholder="e.g. Headquarters"
            />
          </label>

          <label className="hq-field">
            <span className="hq-field-label">Description</span>
            <input
              className="hq-field-input"
              value={linkForm.description}
              onChange={e => setLinkForm({ description: e.target.value })}
              placeholder="e.g. Operational docs & runbooks"
            />
          </label>
        </div>

        <div className="hq-dialog-footer">
          <button type="button" className="hq-btn-ghost" onClick={closeLinkDialog}>
            Cancel
          </button>
          <button
            type="submit"
            className="hq-btn-primary"
            disabled={!linkForm.name || !linkForm.path}
          >
            Link folder
          </button>
        </div>
      </form>
    </div>
  )
}
