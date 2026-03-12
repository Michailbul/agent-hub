/**
 * HeadquartersPage — The Workspace
 *
 * Unified HQ page: V2 workspace layout + V1 chip-style source buttons.
 * Sources: linked folders (HQ, Cloud, etc.) managed via /api/hq endpoints.
 * Left: source chips + file tree. Right: centered Notion-like editor.
 */
import { useEffect, useState, useCallback } from 'react'
import { useHQStore } from '@/store/hq'
import { HQFileTree } from './shared/HQFileTree'
import { HQEditor } from './shared/HQEditor'
import { LinkFolderDialog } from './shared/LinkFolderDialog'
import './hq.css'

export function HeadquartersPage() {
  const {
    sources, activeSourceId, setActiveSource,
    fileTree, activeFilePath, treeLoading, loading,
    drawerOpen, toggleDrawer,
    loadConfig, openLinkDialog, unlinkSource,
  } = useHQStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load config on mount
  useEffect(() => { loadConfig() }, [loadConfig])

  const activeSource = sources.find(s => s.id === activeSourceId)
  const hasSources = sources.length > 0

  const handleUnlink = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Unlink this folder from HQ?')) unlinkSource(id)
  }, [unlinkSource])

  return (
    <div className="hq-page">
      {/* ── Top bar with source chips ── */}
      <div className="hq-topbar">
        <div className="hq-topbar-left">
          <button className="hq-drawer-toggle" onClick={toggleDrawer} title="Toggle file browser">
            <span className={`hq-drawer-icon${drawerOpen ? ' open' : ''}`}>☰</span>
          </button>
          <span className="hq-section-label">HQ</span>
        </div>

        <div className="hq-chips-area">
          {sources.map(s => (
            <button
              key={s.id}
              className={`hq-chip${activeSourceId === s.id ? ' active' : ''}`}
              onClick={() => setActiveSource(s.id)}
              style={{ '--source-color': s.color } as React.CSSProperties}
            >
              <span className="hq-chip-icon">{s.icon || '📁'}</span>
              <span className="hq-chip-name">{s.name}</span>
              {s.fileCount !== undefined && (
                <span className="hq-chip-count">{s.fileCount}</span>
              )}
              <button
                className="hq-chip-unlink"
                onClick={(e) => handleUnlink(e, s.id)}
                title="Unlink folder"
              >
                ×
              </button>
            </button>
          ))}
          <button className="hq-chip hq-chip-add" onClick={openLinkDialog}>
            <span className="hq-chip-icon">+</span>
            <span className="hq-chip-name">Link folder</span>
          </button>
        </div>

        <div className="hq-topbar-right">
          {activeSource && (
            <span className="hq-source-path-label">{activeSource.path}</span>
          )}
        </div>
      </div>

      {/* ── Body: sidebar + editor ── */}
      <div className="hq-body">
        {/* File sidebar */}
        <div className={`hq-sidebar${drawerOpen ? '' : ' collapsed'}`}>
          {activeSource && (
            <div className="hq-sidebar-header">
              <span className="hq-sidebar-source-icon">{activeSource.icon || '📁'}</span>
              <div className="hq-sidebar-source-info">
                <span className="hq-sidebar-source-name">{activeSource.name}</span>
                <span className="hq-sidebar-source-path">{activeSource.path}</span>
              </div>
            </div>
          )}

          <div className="hq-sidebar-tree">
            {loading || treeLoading ? (
              <div className="hq-tree-loading">
                <span className="hq-loading-spinner" />
                <span className="hq-loading-text">Loading...</span>
              </div>
            ) : (
              <HQFileTree files={fileTree} />
            )}
          </div>

          <button
            className="hq-sidebar-collapse"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {drawerOpen ? '‹' : '›'}
          </button>
        </div>

        {/* Main editor area */}
        <div className="hq-main">
          {/* Breadcrumb bar */}
          <div className="hq-path-bar">
            {activeSource && (
              <span className="hq-path-source" style={{ color: activeSource.color }}>
                {activeSource.icon || '📁'} {activeSource.name}
              </span>
            )}
            {activeFilePath && (
              <>
                <span className="hq-path-sep">/</span>
                <span className="hq-path-file">
                  {activeFilePath.replace(activeSource?.path || '', '').replace(/^\//, '')}
                </span>
              </>
            )}
          </div>

          {/* Editor or empty state */}
          {hasSources ? (
            <div className="hq-editor-container">
              <HQEditor />
            </div>
          ) : (
            <div className="hq-empty-state">
              <div className="hq-empty-inner">
                <span className="hq-empty-icon">🏢</span>
                <span className="hq-empty-title">Link your Headquarters folder</span>
                <span className="hq-empty-desc">
                  Point to your company's operational docs, runbooks,
                  and business files. All your files in one place.
                </span>
                <button className="hq-empty-cta" onClick={openLinkDialog}>
                  + Link a folder
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Link folder dialog */}
      <LinkFolderDialog />
    </div>
  )
}
