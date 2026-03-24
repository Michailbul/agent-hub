# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Dev Commands

```bash
npm run dev          # Concurrent server (tsup --watch) + client (Vite) dev servers
npm run build        # Production build: tsup → dist/ + Vite → dist-client/
npm start            # Run production server (node dist/cli.js)
npm run server:dev   # Server only (watch mode)
npm run client:dev   # Client only (Vite dev server on :5173)
```

Client dev server proxies `/api` and `/login` to Express on `:4001`.

## Architecture

Monorepo with two build targets:

- **`src/`** → `dist/` — Express server + CLI, compiled by tsup (CJS, Node 18+)
- **`client/`** → `dist-client/` — React 19 SPA, compiled by Vite 7

### Server (`src/server.ts`)

Single-file Express app (~2,900 lines) with 40+ API endpoints. Key sections:

- **Config loading** — Priority: config file > env vars > auto-discovery of `workspace-*` dirs
- **Path security** — `isWithinRoots(targetPath, ALLOWED_ROOTS)` validates every file operation against a whitelist. Never bypass this.
- **Skills index** — Cached inventory of all skills across all sources. Invalidated on filesystem changes or manual refresh.
- **Auth** — Cookie-based (`agent_hub_auth`). Required when `NODE_ENV=production` or `HUB_AUTH=true`.

### CLI (`src/cli.ts`)

Entry point for `agent-hub` bin. Subcommands: `hq link|list|tree|unlink`, `skills link|list|pull|unlink`. Default (no subcommand) starts the server.

### Client (`client/src/`)

- **State:** Zustand stores in `store/` — `skills.ts` (skills index), `auth.ts`, `ui.ts`, `canvas.ts`, `hq.ts`, `theme.ts`
- **API client:** `lib/api.ts` — fetch wrappers for all endpoints
- **Views:** Switched via `activeView` in App.tsx — `skills-lab`, `canvas`, `headquarters`
- **Styling:** TailwindCSS v4, shadcn/ui primitives in `components/ui/`

## Domain Concepts

- **Agents** — Workspace directories (`workspace-{name}`) with instruction files (SOUL.md, MISSION.md, MEMORY.md, etc.). Metadata from `IDENTITY.md`.
- **Skills** — Directories containing `SKILL.md` with YAML frontmatter. Can exist in multiple libraries (variants). Ecosystems: `agents`, `codex`, `cursor`, `claude`, `openclaw`, `workspace`, `repo`.
- **Skill Libraries** — Root directories containing skills: `~/.agents/skills`, `~/.openclaw/skills`, `~/.claude/skills`, `~/.codex/skills`, plus custom paths.
- **HQ (Headquarters)** — Linked context folders browsable in the UI. Config at `~/.openclaw/agent-hub/hq.config.json`.

## Adding API Endpoints

1. Add route in `src/server.ts` with `auth` middleware
2. Validate all paths with `isWithinRoots(targetPath, ALLOWED_ROOTS)`
3. Add fetch wrapper in `client/src/lib/api.ts`
4. Add Zustand action if the data needs client-side caching
5. Wire into UI component
