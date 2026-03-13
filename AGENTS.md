# AGENTS.md — Agent Hub (the app)

This is the **open source product** — not the marketing site. The landing page lives at [Michailbul/laniameda-agent-hub](https://github.com/Michailbul/laniameda-agent-hub).

---

## First-time setup? Read this skill

**If you're setting up Agent Hub on this machine for the first time**, read the setup skill at:

```
skills/agent-hub-setup/SKILL.md
```

It walks you through the full setup — detecting the environment, discovering OpenClaw workspaces, generating config, setting up Docker or Node.js, and verifying the server runs. References inside the skill cover the full project overview, config schema, and path resolution logic.

---

## Repo identity

- **What:** Self-hosted web editor for AI agent instruction files and skills
- **License:** MIT — free forever, open to contributions
- **Stack:** Node.js 18+ / Express / TypeScript (server), React 19 / Vite / Zustand (client)
- **Audience:** People who run OpenClaw, Claude Code, Codex, or any markdown-based AI agent setup

---

## Working on this repo

### Before making changes
```bash
cd ~/work/agent-hub && git pull
npm install
cd client && npm install && cd ..
```

### Development
```bash
npm run dev    # runs server (tsup watch) + client (Vite dev) concurrently
# Server: http://localhost:4001
# Client dev: http://localhost:5173 (Vite proxy)
```

### Production build
```bash
npm run build  # compiles server (tsup → dist/) + client (Vite → dist-client/)
npm start      # runs dist/cli.js
```

### After changes (MANDATORY for VPS deploy)
```bash
npm run build
git add -A && git commit -m "feat/fix: description"
git push
# On VPS:
cd /root/work/agent-hub && git pull && docker compose up -d --build
# Live at: https://agent-hub.srv1439489.hstgr.cloud
```

Do NOT skip `docker compose up -d --build` — the Docker image caches compiled files; pushing code without rebuilding the container means VPS won't see your changes.

---

## Project structure

```
agent-hub/
  src/
    server.ts              ← Express API server (routes, config, path resolution)
    cli.ts                 ← CLI entrypoint (--no-open, --vps, --tunnel flags)
    setup-agent.ts         ← Initial setup wizard (detects CLI, spawns subprocess)
    setup-prompt.ts        ← Premade prompt for workspace scanning
  client/
    src/
      App.tsx              ← React app with routing
      components/          ← Canvas, Crons, HQ, Layout, Sidebar, SkillsLab
      store/               ← Zustand stores (crons, canvas, hq, skills)
      lib/                 ← API client, CodeMirror themes
  dist/                    ← Compiled server (git-ignored)
  dist-client/             ← Compiled React client
  skills/
    agent-hub-setup/       ← Setup skill (read this for full project context)
      SKILL.md             ← 6-phase setup workflow
      references/
        project-overview.md  ← Full project context, tech stack, all API endpoints
        config-schema.md     ← Config format with Docker + bare-metal examples
        path-resolution.md   ← Exact auto-discovery logic from server.ts
  Dockerfile               ← Multi-stage build (Node 22 Alpine)
  docker-compose.example.yml  ← User template for Docker deployment
  agent-hub.config.example.json  ← Config template
  package.json             ← Root package (server deps + build scripts)
```

---

## Agent rules for this repo

### Before coding anything
- Read `src/server.ts` to understand current API endpoints
- Check `client/src/` for existing React component patterns
- Run a build to confirm current state: `npm run build`

### API endpoints (current)
```
# Core
POST /api/login             ← { password } → sets cookie
POST /api/logout
GET  /api/setup/status      ← { needsSetup, cli, configPath }
GET  /api/setup/run         ← SSE stream: runs claude/codex setup agent
POST /api/refresh           ← rescan agents/skills without restart

# Files
GET  /api/file?path=        ← read file content
POST /api/file              ← write file { path, content }
GET  /api/dir?path=         ← list directory entries

# Agents & Tree
GET  /api/tree              ← agents with instructions/memory/pm/skills, libraries, studio
GET  /api/canvas/data       ← agent relationships, models, telegram, subagent edges
GET  /api/assign-targets    ← agent workspace targets for file assignment

# Skills
GET  /api/skills/index      ← full skills index with variants, sources, grouping
POST /api/skill/copy        ← copy skill dir { src, destDir }
POST /api/skill/move        ← move skill dir { src, destDir }
POST /api/skill/delete      ← delete skill dir { src }
POST /api/skill/rename      ← rename skill { src, newName }
POST /api/skills/folder/create ← create skill folder { root, name }
POST /api/skills/assign     ← install skill to agent { agentId, variantPath }
POST /api/skills/unassign   ← remove skill from agent { agentId, skillId }

# Cron Jobs
GET    /api/crons           ← all cron jobs (from OPENCLAW_ROOT/cron/jobs.json)
POST   /api/crons           ← create cron job
PATCH  /api/crons/:id       ← update cron job
DELETE /api/crons/:id       ← delete cron job
```

### Security rules (never break these)
- All file ops go through `isAllowed()` — check against ALLOWED_ROOTS
- Never expose paths outside allowed roots
- `--dangerously-skip-permissions` cannot run as root — do NOT add to Docker CMD

### Frontend (client/)
- React 19 + TypeScript + Vite
- State management: Zustand stores in `client/src/store/`
- Editor: CodeMirror 6 for markdown, Tiptap for rich text
- Diagrams: XYFlow (React Flow) for agent canvas
- Styling: CSS variables, Inter + JetBrains Mono fonts

### Design system
- V11 "Kiln" theme with teal + ink palette
- Warm paper bg: `--p: #fffaf5`
- Coral accent: `--coral: #ff7a64`
- Brutalist card shadow: `var(--sh-b): 3px 3px 0 0 var(--ink)`
- Hover lift: `transform: translate(-2px,-2px)` + shadow grows

---

## Adjacent repo: the marketing site

**`Michailbul/laniameda-agent-hub`** — `/root/work/agent-hub-web/`

Next.js landing page marketing the app. Three design variants (/v1, /v2, /v3).
Internal Laniameda project — not open source.

If you ship a new feature to this repo, update `lib/content.ts` in the landing page repo to keep features accurate.

---

## Product principles (Michael, 2026-03-04)

### Agent Hub = control plane over the real filesystem (no lock-in)
- The UI is just a representation of the underlying OpenClaw directory structure.
- Under the hood we only move/copy/create folders + files + config files.
- If the user stops using Agent Hub, they can return to terminal/OpenClaw and everything still works.

### Organize the workspace explicitly
We need a structured workspace view with clear separation:
- **Agent fundamentals** (identity + instruction files)
- **Skill fundamentals** (libraries + installed skills)
- Clear operations to connect them (install/copy/move/remove skills per agent)

### Avoid "forms are the past" UX
- Do NOT build a templated "form builder" experience for skill creation.
- We are AI-native: creation should be driven by editing + AI assistance (chat-driven creation later), not rigid forms.
- Crons have some structure, but even there we should avoid over-forming the UX; use composable blocks/chips where possible.

### Future (not immediate) but aligned
- Chat-driven skill creation/editing via Claude CLI / Codex CLI (nice, but not priority right now).
- UI-only grouping of agents into **departments** (org structure) even if it doesn't change runtime behavior yet.
