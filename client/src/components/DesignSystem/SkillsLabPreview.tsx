import './design-system-preview.css'

/*
 * Static replica of SkillsLabV2 (the production Skills Lab).
 * Uses ONLY var(--sh-*) tokens for all colors/fonts/shadows.
 * Mirrors the real DOM structure: nav → results → editor, plus status bar.
 * Prefix: dsp- (design-system-preview)
 */

const DEPARTMENTS = [
  { name: 'Engineering', count: 28, active: false },
  { name: 'Design', count: 9, active: true },
  { name: 'Writing', count: 7, active: false },
  { name: 'Marketing', count: 5, active: false },
]

const SOURCES = [
  { name: 'Claude Code', color: 'var(--sh-coral)', count: 42, active: false },
  { name: 'Community', color: 'var(--sh-blue)', count: 34, active: false },
  { name: 'OpenClaw', color: 'var(--sh-green)', count: 8, active: false },
]

const SKILL_GROUPS = [
  {
    label: 'Frontend',
    skills: [
      { name: 'react-dev', meta: 'Community · v2.1', active: false, starred: false },
      { name: 'shadcn-ui', meta: 'Claude Code · v1.8', active: true, starred: true },
      { name: 'frontend-design', meta: 'Community · v1.3', active: false, starred: false },
      { name: 'interaction-design', meta: 'Community · v1.0', active: false, starred: true },
    ],
  },
  {
    label: 'Backend',
    skills: [
      { name: 'convex-queries', meta: 'Community · v3.2', active: false, starred: false },
      { name: 'convex-mutations', meta: 'Community · v3.2', active: false, starred: false },
      { name: 'database-schema-designer', meta: 'Claude Code · v1.4', active: false, starred: true },
    ],
  },
  {
    label: 'DevOps',
    skills: [
      { name: 'commit-work', meta: 'Claude Code · v2.0', active: false, starred: true },
      { name: 'create-pr', meta: 'Claude Code · v1.5', active: false, starred: false },
    ],
  },
]

const FILE_TREE = [
  { name: 'SKILL.md', active: true, indent: 0 },
  { name: 'README.md', active: false, indent: 0 },
  { name: 'examples/', active: false, indent: 0 },
  { name: 'basic.md', active: false, indent: 1 },
  { name: 'advanced.md', active: false, indent: 1 },
]

export function SkillsLabPreview({ colorful = false }: { colorful?: boolean }) {
  return (
    <div className={`dsp-canvas${colorful ? ' dsp-canvas--colorful' : ''}`}>
      <div className="dsp-panels">
        {/* ═══ Nav Panel ═══ */}
        <aside className="dsp-nav">
          {/* Header — matches s3-panel-header */}
          <header className="dsp-panel-header">
            <h3 className="dsp-panel-title">Skills</h3>
            <span className="dsp-panel-badge">84</span>
          </header>

          {/* Search bar — matches s3-search-bar */}
          <div className="dsp-nav-controls">
            <div className="dsp-search-bar">
              <svg className="dsp-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span className="dsp-search-placeholder">Search skills...</span>
            </div>

            {/* Scope pills — matches s3-scope-switch */}
            <div className="dsp-scope-switch">
              <button className="dsp-scope-pill active">All Libraries</button>
              <button className="dsp-scope-pill">Claude Code</button>
              <button className="dsp-scope-pill">Starred</button>
            </div>
          </div>

          {/* Nav body — departments + sources */}
          <div className="dsp-nav-tree">
            <div className="dsp-nav-divider" />

            <div className="dsp-nav-section">
              <div className="dsp-nav-section-label">Departments</div>
              {DEPARTMENTS.map(d => (
                <button key={d.name} className={`dsp-nav-section-item${d.active ? ' active' : ''}`}>
                  <span className="dsp-nav-section-item-name">{d.name}</span>
                  <span className="dsp-nav-section-item-count">{d.count}</span>
                </button>
              ))}
            </div>

            <div className="dsp-nav-divider" />

            <div className="dsp-nav-section">
              <div className="dsp-nav-section-label">Sources</div>
              {SOURCES.map(s => (
                <button key={s.name} className={`dsp-nav-section-item${s.active ? ' active' : ''}`}>
                  <span className="dsp-nav-section-item-left">
                    <span className="dsp-nav-section-item-dot" style={{ background: s.color }} />
                    <span className="dsp-nav-section-item-name">{s.name}</span>
                  </span>
                  <span className="dsp-nav-section-item-count">{s.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nav status — matches s3-nav-status */}
          <div className="dsp-nav-status">
            <span>9 of 84</span>
            <button className="dsp-nav-status-clear">Clear</button>
          </div>
        </aside>

        <div className="dsp-panel-resizer" />

        {/* ═══ Results Panel ═══ */}
        <aside className="dsp-results-panel">
          <header className="dsp-panel-header dsp-results-header">
            <h3 className="dsp-panel-title">Design</h3>
            <div className="dsp-results-header-actions">
              <div className="dsp-view-toggles">
                <button className="dsp-view-toggle-btn active" title="List view">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
                </button>
                <button className="dsp-view-toggle-btn" title="Grid view">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
              </div>
              <span className="dsp-results-header-note">9</span>
              <button className="dsp-install-btn">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>Install</span>
              </button>
            </div>
          </header>

          <div className="dsp-results-body">
            {SKILL_GROUPS.map(group => (
              <div key={group.label} className="dsp-skill-group-block">
                <div className="dsp-skill-group-head">
                  <span className="dsp-skill-group-title">{group.label}</span>
                  <span className="dsp-skill-group-count">{group.skills.length}</span>
                </div>
                <div className="dsp-skill-list">
                  {group.skills.map(skill => (
                    <button key={skill.name} className={`dsp-skill-row${skill.active ? ' active' : ''}`}>
                      <span className="dsp-skill-name">{skill.name}</span>
                      <span className="dsp-skill-meta">{skill.meta}</span>
                      {skill.starred && (
                        <span className="dsp-star-btn starred">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="dsp-panel-resizer" />

        {/* ═══ Editor Panel ═══ */}
        <main className="dsp-editor-panel">
          <header className="dsp-panel-header dsp-editor-header">
            <div className="dsp-panel-title-row">
              <button className="dsp-back-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <div className="dsp-filename-area">
                <span className="dsp-filename">SKILL.md</span>
                <span className="dsp-file-meta">Claude Code · shadcn-ui</span>
              </div>
            </div>
            <div className="dsp-editor-actions">
              <button className="dsp-icon-btn" title="Copy path">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <button className="dsp-icon-btn" title="Open externally">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </button>
            </div>
          </header>

          <div className="dsp-editor-body">
            <div className="dsp-editor-shell">
              {/* File tree sidebar */}
              <aside className="dsp-files-panel">
                <div className="dsp-files-panel-head">
                  <span className="dsp-files-panel-label">Files</span>
                  <span className="dsp-files-panel-root">shadcn-ui</span>
                </div>
                {FILE_TREE.map(f => (
                  <button
                    key={f.name}
                    className={`dsp-tree-item${f.active ? ' active' : ''}`}
                    style={{ paddingLeft: 12 + f.indent * 14 }}
                  >
                    {f.name}
                  </button>
                ))}
              </aside>

              <div className="dsp-panel-resizer dsp-filetree-resizer" />

              {/* Editor content — markdown preview */}
              <div className="dsp-editor-pane">
                <div className="dsp-md-content">
                  <h1 className="dsp-md-h1">shadcn-ui</h1>
                  <p className="dsp-md-p">
                    Expert guidance for integrating and building applications with shadcn/ui
                    components, Tailwind CSS, and React.
                  </p>

                  <h2 className="dsp-md-h2">Installation</h2>
                  <pre className="dsp-md-code"><code>npx shadcn-ui@latest init</code></pre>

                  <h2 className="dsp-md-h2">Quick Start</h2>
                  <p className="dsp-md-p">
                    Add components to your project with the CLI. Each component is fully
                    customizable and uses your project's Tailwind configuration.
                  </p>
                  <pre className="dsp-md-code"><code>npx shadcn-ui@latest add button{'\n'}npx shadcn-ui@latest add card{'\n'}npx shadcn-ui@latest add dialog</code></pre>

                  <h2 className="dsp-md-h2">Parameters</h2>
                  <table className="dsp-md-table">
                    <thead>
                      <tr><th>Param</th><th>Type</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                      <tr><td><code>--style</code></td><td>string</td><td>Component style variant</td></tr>
                      <tr><td><code>--overwrite</code></td><td>boolean</td><td>Overwrite existing files</td></tr>
                      <tr><td><code>--path</code></td><td>string</td><td>Custom install path</td></tr>
                    </tbody>
                  </table>

                  <h2 className="dsp-md-h2">Theming</h2>
                  <p className="dsp-md-p">
                    Use CSS variables for theming. Configure colors in your{' '}
                    <code className="dsp-md-inline-code">globals.css</code> file. Supports light and
                    dark modes out of the box with <code className="dsp-md-inline-code">next-themes</code>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ═══ Status Bar ═══ */}
      <div className="dsp-statusbar">
        <div className="dsp-status-left">
          <span className="dsp-status-dot" />
          <span>84 skills · 6 agents · 3 sources</span>
        </div>
        <div className="dsp-status-right">
          <span className="dsp-status-kbd">&#x2318;K</span>
          <span className="dsp-status-kbd">&#x2191;&#x2193;</span>
          <span className="dsp-status-kbd">&#x23CE;</span>
        </div>
      </div>
    </div>
  )
}
