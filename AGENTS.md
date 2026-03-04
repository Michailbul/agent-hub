# AGENTS.md — Agent Hub (the app)

This is the **open source product** — not the marketing site. The landing page lives at [Michailbul/laniameda-agent-hub](https://github.com/Michailbul/laniameda-agent-hub).

---

## Repo identity

- **What:** Self-hosted web editor for AI agent instruction files and skills
- **License:** MIT — free forever, open to contributions
- **Stack:** Node.js + Express + vanilla JS (no build step for the server), TypeScript source in `src/`
- **Audience:** People who run OpenClaw, Claude Code, Codex, or any markdown-based AI agent setup

---

## Working on this repo

### Before making changes
```bash
cd ~/work/agent-hub && git pull
npm install
```

### Development (plain server, no TS compile needed for UI changes)
```bash
node server.js  # runs existing plain JS server
# or
npm run build && node dist/server.js  # runs TypeScript compiled version
```

### After changes
```bash
npm run build  # compile src/ → dist/
git add -A && git commit -m "feat/fix: description" && git push
```

### Deploy to VPS
```bash
cd ~/work/agent-hub && docker compose up -d --build
# Live at: https://agent-hub.srv1439489.hstgr.cloud
```

---

## Project structure

```
agent-hub/
  src/
    server.ts         ← Express server (TypeScript source)
    cli.ts            ← npx entrypoint, --tunnel, --no-open flags
    setup-agent.ts    ← detects claude/codex CLI, spawns subprocess, streams SSE
    setup-prompt.ts   ← premade prompt for workspace scanning
  dist/               ← tsup compiled output (CJS, node18)
  server.js           ← legacy plain JS server (used by Docker currently)
  index.html          ← entire frontend — sidebar, editor, login, setup UI
  Dockerfile
  docker-compose.yml  ← VPS production config (Traefik labels, host network)
  docker-compose.example.yml  ← template for end users
  agent-hub.config.example.json  ← manual config template
  TASK.md             ← build task spec (delete eventually)
```

---

## Agent rules for this repo

### Before coding anything
- Read `src/server.ts` to understand current API endpoints
- Check `index.html` for existing JS/CSS patterns before adding new ones
- Run a build to confirm current state: `npm run build`

### API endpoints (current)
```
GET  /api/tree              ← agents, skill libraries, studio tree
GET  /api/file?path=        ← read file content
POST /api/file              ← write file content { path, content }
GET  /api/assign-targets    ← agent workspace targets for local file assign
GET  /api/setup/status      ← { needsSetup, cli, configPath }
GET  /api/setup/run         ← SSE stream: runs claude/codex setup agent
POST /api/skill/copy        ← copy skill dir { src, destDir }
POST /api/skill/move        ← move skill dir { src, destDir }
POST /api/skill/delete      ← delete skill dir { src }
POST /api/login             ← { password } → sets cookie
POST /api/logout
```

### Security rules (never break these)
- All file ops go through `isAllowed()` — check against ALLOWED_ROOTS
- Never expose paths outside allowed roots
- `--dangerously-skip-permissions` cannot run as root — do NOT add to Docker CMD

### Frontend (index.html)
- All CSS is in `<style>` tag — use existing CSS variables (`--coral`, `--ink`, `--p`, etc.)
- All JS is in `<script>` tag — vanilla only, no libraries beyond CodeMirror (CDN)
- Use `mkEl()` helper for DOM creation
- Use `toast(msg, type)` for user feedback
- Pane state: `panes[]` array, `activePaneId` string, `renderPanes()` to re-render

### Design system
- Warm paper bg: `--p: #fffaf5`
- Coral accent: `--coral: #ff7a64`
- Brutalist card shadow: `var(--sh-b): 3px 3px 0 0 var(--ink)`
- Hover lift: `transform: translate(-2px,-2px)` + shadow grows
- Inter for UI, JetBrains Mono for labels/code/paths

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

### Avoid “forms are the past” UX
- Do NOT build a templated “form builder” experience for skill creation.
- We are AI-native: creation should be driven by editing + AI assistance (chat-driven creation later), not rigid forms.
- Crons have some structure, but even there we should avoid over-forming the UX; use composable blocks/chips where possible.

### Future (not immediate) but aligned
- Chat-driven skill creation/editing via Claude CLI / Codex CLI (nice, but not priority right now).
- UI-only grouping of agents into **departments** (org structure) even if it doesn’t change runtime behavior yet.

