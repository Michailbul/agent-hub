# Agent Hub — Project Overview

## What Is Agent Hub

Agent Hub is a self-hosted web editor for AI agent instruction files and skills. It provides a visual UI to manage the OpenClaw agent ecosystem — editing SOUL.md, MISSION.md, IDENTITY.md, managing skill libraries, configuring cron jobs, and visualizing agent relationships.

- **License:** MIT, open source
- **Repo:** `https://github.com/Michailbul/agent-hub`
- **Audience:** Users running OpenClaw, Claude Code, Codex, or any markdown-based AI agent setup
- **Philosophy:** Control plane over the real filesystem. No lock-in — Agent Hub only reads/writes files on disk. If you stop using it, everything still works from the terminal.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Server | Node.js 18+, Express 4, TypeScript |
| Build (server) | tsup → CommonJS, target node18 |
| Client | React 19, Vite, TypeScript |
| Editor | CodeMirror 6 (markdown), Tiptap (rich text) |
| State | Zustand |
| Diagrams | XYFlow (React Flow) for agent canvas |
| Styling | CSS variables, Inter + JetBrains Mono fonts |
| Container | Docker, Node 22 Alpine, multi-stage build |
| Auth | Cookie-based (`agent_hub_auth`), simple password |

---

## Repository Structure

```
agent-hub/
├── src/
│   ├── server.ts          # Express API server (all routes, path resolution, config)
│   ├── cli.ts             # CLI entrypoint (--no-open, --vps, --tunnel flags)
│   ├── setup-agent.ts     # Initial setup wizard (detects CLI, spawns subprocess)
│   └── setup-prompt.ts    # Premade prompt for workspace scanning
├── client/
│   ├── src/
│   │   ├── App.tsx        # Main React app with routing
│   │   ├── index.css      # Global styles
│   │   ├── components/    # React components (Crons, Canvas, Sidebar, Layout, etc.)
│   │   ├── store/         # Zustand stores (crons.ts, canvas.ts, hq.ts, skills.ts)
│   │   ├── types/         # TypeScript type definitions
│   │   └── lib/           # Utilities (API client, CodeMirror theme)
│   ├── package.json       # React/Vite deps
│   └── vite.config.ts
├── dist/                  # Compiled server (cli.js, server.js) — git-ignored
├── dist-client/           # Compiled React app (index.html + assets) — checked in
├── skills/                # Bundled skills (including this setup skill)
├── Dockerfile             # Multi-stage: builder + production
├── docker-compose.example.yml  # User template for Docker deployment
├── agent-hub.config.example.json  # Config template
├── package.json           # Root package (Express server deps + build scripts)
├── AGENTS.md              # Agent coding instructions for this repo
└── index.html             # Legacy single-file frontend (fallback)
```

---

## Build System

### Scripts (package.json)

| Script | What It Does |
|---|---|
| `npm run dev` | Runs server (tsup watch) + client (Vite dev) concurrently |
| `npm run build` | Compiles server with tsup + builds React client with Vite |
| `npm start` | Runs `node dist/cli.js` (production) |
| `npm run server:dev` | Server-only dev mode with watch |
| `npm run client:dev` | Client-only Vite dev server |

### Build outputs
- **Server:** `dist/cli.js`, `dist/server.js` (CJS, node18 target)
- **Client:** `dist-client/index.html` + `dist-client/assets/` (Vite build)

### Docker build (Dockerfile)
- **Builder stage:** Node 22 Alpine, installs all deps, runs `npm run build` for both server and client
- **Production stage:** Node 22 Alpine, `--omit=dev` deps only, copies `dist/` and `dist-client/`
- **CMD:** `node dist/cli.js --no-open`
- **Exposes:** port 4001

---

## API Endpoints

All routes except `/api/login` and `/api/setup/status` require auth (cookie `agent_hub_auth`).

### Core

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/login` | Set auth cookie (body: `{password}`) |
| `POST` | `/api/logout` | Clear auth cookie |
| `GET` | `/api/setup/status` | Check if initial setup needed: `{needsSetup, cli, configPath}` |
| `GET` | `/api/setup/run` | SSE stream: runs Claude/Codex setup wizard |
| `POST` | `/api/refresh` | Rescan agents and skills without restart |

### Files

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/file?path=` | Read file content (must be in ALLOWED_ROOTS) |
| `POST` | `/api/file` | Write file content (body: `{path, content}`) |
| `GET` | `/api/dir?path=` | List directory entries |

### Agents & Tree

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/tree` | Full tree: agents with instructions/memory/pm/skills, libraries, studio |
| `GET` | `/api/canvas/data` | Agent relationships, models, skills, telegram bindings, subagent edges |
| `GET` | `/api/assign-targets` | Agent workspace targets for file assignment |

### Skills

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/skills/index` | Full skills index with variants, sources, grouping |
| `POST` | `/api/skill/copy` | Copy skill dir (body: `{src, destDir}`) |
| `POST` | `/api/skill/move` | Move skill dir (body: `{src, destDir}`) |
| `POST` | `/api/skill/delete` | Delete skill dir (body: `{src}`) |
| `POST` | `/api/skill/rename` | Rename skill (body: `{src, newName}`) |
| `POST` | `/api/skills/folder/create` | Create skill folder (body: `{root, name}`) |
| `POST` | `/api/skills/assign` | Install skill to agent workspace (body: `{agentId, variantPath}`) |
| `POST` | `/api/skills/unassign` | Remove skill from agent (body: `{agentId, skillId}`) |

### Cron Jobs

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/crons` | Get all cron jobs (from `{OPENCLAW_ROOT}/cron/jobs.json`) |
| `POST` | `/api/crons` | Create cron job (body: job object) |
| `PATCH` | `/api/crons/:id` | Update cron job fields |
| `DELETE` | `/api/crons/:id` | Delete cron job |

---

## OpenClaw Workspace Structure

Each agent workspace follows this layout:

```
workspace-{agentId}/
├── IDENTITY.md          # Who: name, emoji, role, personality
├── SOUL.md              # How: behavioral guidelines, boundaries
├── MISSION.md           # Why: purpose, goals, responsibilities
├── USER.md              # Context about the human user
├── AGENTS.md            # Context about sibling/coordinated agents
├── MEMORY.md            # Persistent memory across sessions
├── HEARTBEAT.md         # Periodic check-in template
├── TOOLS.md             # Available tools and how to use them
├── skills/              # Agent-local installed skills
│   └── {skill-name}/
│       └── SKILL.md
├── pm/                  # Project management
│   ├── vision.md
│   ├── backlog.md
│   └── problems.md
├── kb/                  # Knowledge base
│   ├── _inbox/
│   ├── resources/
│   ├── prompts/
│   └── tutorials/
├── memory/              # Session logs (YYYY-MM-DD.md)
├── todos/               # Task lists
└── tmp/                 # Agent scratch space
```

### IDENTITY.md format (parsed by Agent Hub)
```markdown
**Name:** Agent Name
**Emoji:** 🤖
**Role:** Role Description
```

Agent Hub reads these three fields to populate the sidebar. All other content in IDENTITY.md is free-form.

### Workspace naming convention
- `workspace` → agent ID `main` (the default/primary agent)
- `workspace-meda` → agent ID `meda`
- `workspace-persey` → agent ID `persey`
- Pattern: `workspace-{id}` where `{id}` is the agent identifier

---

## Skill Structure

Each skill is a directory containing at minimum a `SKILL.md`:

```
{skill-name}/
├── SKILL.md             # Required — YAML frontmatter + markdown instructions
├── _meta.json           # Optional — metadata (ownerId, slug, version, publishedAt)
├── references/          # Optional — reference docs loaded on demand
├── scripts/             # Optional — executable automation
└── assets/              # Optional — templates, images, fonts
```

### SKILL.md frontmatter
```yaml
---
name: Skill Name
description: What the skill does and when to use it
---
```

Agent Hub parses `name` and `description` from frontmatter. All other frontmatter fields are passed through but not used by the server.

---

## Security Model

- **ALLOWED_ROOTS:** Every file operation is validated against a whitelist of allowed root paths. See [path-resolution.md](path-resolution.md) for how it's built.
- **isAllowed(filePath):** Checks that the resolved path starts with (or equals) an allowed root.
- **Auth:** Simple password via `HUB_PASSWORD` env var. Cookie `agent_hub_auth` set for 7 days.
- **No path traversal:** All paths are resolved with `path.resolve()` before checking.
- **Docker:** Container runs with `--no-open` flag. Never runs with `--dangerously-skip-permissions`.

---

## Cron Jobs

Stored at `{OPENCLAW_ROOT}/cron/jobs.json`. Auto-backed up to `.bak` before every write.

```json
{
  "version": 1,
  "jobs": [
    {
      "id": "uuid",
      "name": "job-name",
      "description": "Human-readable description",
      "enabled": true,
      "schedule": { "kind": "cron", "expr": "0 17 * * *", "tz": "Europe/Minsk" },
      "sessionTarget": "isolated",
      "payload": {
        "kind": "agentTurn",
        "message": "Instructions to the agent",
        "model": "sonnet",
        "timeoutSeconds": 600
      },
      "delivery": {
        "mode": "announce",
        "channel": "telegram",
        "to": "-1003718448183:topic:10"
      }
    }
  ]
}
```

---

## CLI Flags

```bash
agent-hub                # Start server, open browser at localhost:4001
agent-hub --no-open      # Start server, don't open browser (VPS/headless)
agent-hub --vps          # Alias for --no-open
agent-hub --tunnel       # Start Cloudflare tunnel for public access
```

`--tunnel` auto-installs `cloudflared` if not found, then spawns a tunnel to expose localhost:4001 publicly.

---

## Deployment Workflow

### Docker (VPS / production)
```bash
cd /path/to/agent-hub
# Edit docker-compose.yml with volume mounts and env vars
docker compose up -d --build
```

### After code changes
```bash
npm run build                  # Compile server + client
git add -A && git commit       # Commit
git push                       # Push to GitHub
# On VPS:
cd /path/to/agent-hub && git pull && docker compose up -d --build
```

### Verifying deployment
```bash
curl http://localhost:4001/api/setup/status    # Should show needsSetup: false
docker compose logs --tail=20                  # Should show "Agents: ..." and port
```
