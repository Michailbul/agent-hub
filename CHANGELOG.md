# Changelog

## 0.2.0 — 2025-03-24

Complete rewrite from vanilla JS to a modern React stack.

### Added
- React 19 + Vite 7 + TailwindCSS v4 client, replacing the single-file vanilla JS UI
- CodeMirror 6 editor with markdown mode (was CodeMirror 5)
- Tiptap rich-text editor for WYSIWYG markdown editing
- Zustand state management
- Skills Lab v2 — browse, filter, and manage skills with a navigator sidebar
- Semantic skill search powered by Google Gemini embeddings (optional)
- TypeScript server (`src/server.ts`) replacing the old `server.js`
- CLI entry point (`agent-hub` bin) with `--no-open` flag
- Auto-discovery of `.claude/`, `.codex/` skill library mounts
- Filesystem watchers for auto-detecting config and skill changes
- Mobile-responsive UI
- Claude Code plugin support (MCP tools)

### Changed
- Server rewritten in TypeScript, bundled with tsup
- Client is now a separate Vite app in `client/`
- Build pipeline: `npm run build` produces `dist/` (server) + `dist-client/` (SPA)
- Auth cookie switched to `httpOnly: true`

### Removed
- Legacy `index.html` (66KB vanilla JS UI)
- Legacy `server.js`
- macOS SkillPicker/SkillBrowser apps (moved to separate repo)

## 0.1.0

Initial release — single-file vanilla JS editor with Express server.
