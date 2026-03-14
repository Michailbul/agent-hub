import { useCallback } from 'react'
import { useHQStore } from '@/store/hq'

export function LinkFolderDialog() {
  const {
    linkDialogOpen, linkForm, setLinkForm, submitLink, closeLinkDialog,
    pickFolder, pickingFolder, browsePathOpen, browseCurrentPath,
    browseParentPath, browseEntries, browseError, browseToPath,
    chooseBrowsedPath, closePathBrowser,
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
                {pickingFolder ? '...' : 'Browse path'}
              </button>
            </div>
            <span className="hq-field-hint">
              Browse server folders here, or type an absolute server path manually
            </span>
          </div>

          {browsePathOpen && (
            <div className="hq-folder-browser">
              <div className="hq-folder-browser-bar">
                <span className="hq-folder-browser-label">
                  {browseCurrentPath || 'Available roots'}
                </span>
                <div className="hq-folder-browser-actions">
                  <button
                    type="button"
                    className="hq-btn-ghost"
                    onClick={() => browseParentPath ? browseToPath(browseParentPath) : browseToPath(null)}
                    disabled={pickingFolder || (!browseParentPath && !browseCurrentPath)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="hq-btn-primary"
                    onClick={() => browseCurrentPath && chooseBrowsedPath(browseCurrentPath)}
                    disabled={!browseCurrentPath}
                  >
                    Use this folder
                  </button>
                  <button type="button" className="hq-btn-ghost" onClick={closePathBrowser}>
                    Close
                  </button>
                </div>
              </div>

              {browseError && (
                <div className="hq-folder-browser-empty">{browseError}</div>
              )}

              {!browseError && browseEntries.length === 0 && !pickingFolder && (
                <div className="hq-folder-browser-empty">No subfolders here</div>
              )}

              {!browseError && browseEntries.length > 0 && (
                <div className="hq-folder-browser-list">
                  {browseEntries.map(entry => (
                    <button
                      key={entry.path}
                      type="button"
                      className="hq-folder-browser-entry"
                      onClick={() => browseToPath(entry.path)}
                      disabled={pickingFolder}
                    >
                      <span className="hq-folder-browser-entry-name">📁 {entry.name}</span>
                      <span className="hq-folder-browser-entry-path">{entry.path}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
