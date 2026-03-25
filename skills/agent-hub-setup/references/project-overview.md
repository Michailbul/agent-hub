# Agent Hub — Project Overview

## What Is Agent Hub

Agent Hub is a self-hosted web editor for AI agent instruction files and skills. It provides a visual UI to manage the OpenClaw agent ecosystem — editing SOUL.md, MISSION.md, IDENTITY.md, managing skill libraries across ecosystems (.openclaw, .claude, .agents, .codex), configuring skill pillars, and visualizing agent relationships on a canvas.

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
| Client | React 19, Vite 7, TypeScript |
| Editor | CodeMirror 6 (markdown) |
| State | Zustand |
| Canvas | XYFlow (React Flow) for agent canvas |
| Styling | TailwindCSS v4, shadcn/ui primitives, CSS variables |
| Container | Docker, Node 22 Alpine, multi-stage build |
| Auth | Cookie-based (`agent_hub_auth`), simple password |
| Search | Gemini embeddings for semantic skill search (optional) |

---

## Repository Structure

```
agent-hub/
├── src/
│   ├── server.ts          # Express API server (~3000 lines — all routes, path resolution, config, skill pillars)
│   ├── cli.ts             # CLI entrypoint (--no-open, --vps, --tunnel flags)
│   ├── setup-agent.ts     # Initial setup wizard (detects CLI, spawns subprocess)
│   └── setup-prompt.ts    # Premade prompt for workspace scanning
├── client/
│   ├── src/
│   │   ├── App.tsx        # Main React app — views: skills-lab, canvas, headquarters
│   │   ├── index.css      # Global styles
│   │   ├── components/
│   │   │   ├── Canvas/        # Original canvas view (skill browser, inspector, agent nodes)
│   │   │   ├── Canvas2/       # Redesigned canvas with shadcn/ui (skill graph, inspector tree)
│   │   │   ├── SkillsLab/     # Skills Lab — browse/filter/manage skills with pillar nav
│   │   │   ├── Headquarters/  # HQ — linked context folders, native file picker
│   │   │   ├── Layout/        # TopBar
│   │   │   └── ui/            # shadcn/ui primitives
│   │   ├── store/         # Zustand stores (canvas.ts, skillsLab.ts, hq.ts, auth.ts, ui.ts, theme.ts)
│   │   ├── types/         # TypeScript type definitions (canvas.ts, hq.ts, index.ts)
│   │   └── lib/           # Utilities (api.ts, CodeMirror themes, hooks)
│   ├── package.json       # React/Vite deps
│   └── vite.config.ts
├── dist/                  # Compiled server (cli.js, server.js) — git-ignored
├── dist-client/           # Compiled React app (index.html + assets) — git-ignored
├── skills/                # Bundled skills (agent-hub-setup, skill-classifier)
├── CLAUDE.md              # Agent coding instructions for this repo
├── Dockerfile             # Multi-stage: builder + production
├── docker-compose.example.yml  # User template for Docker deployment
├── agent-hub.config.example.json  # Config template
└── package.json           # Root package (Express server deps + build scripts)
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
| `GET` | `/api/setup/status` | Check if initial setup needed |
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
| `GET` | `/api/tree` | Full tree: agents with instructions/memory/pm/skills, libraries |
| `GET` | `/api/canvas/data` | Agent relationships, models, skills, subagent edges |
| `DELETE` | `/api/agents/:id` | Delete an agent workspace |

### Skills

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/skills/index` | Full skills index with variants, sources, grouping, pillar, pillars metadata |
| `POST` | `/api/skills/assign` | Install skill to agent workspace |
| `POST` | `/api/skills/unassign` | Remove skill from agent |
| `POST` | `/api/skills/install/zip` | Install skill from ZIP upload |
| `POST` | `/api/skills/install/command` | Install skill via npx command |
| `POST` | `/api/skills/delete` | Delete skill variant |
| `POST` | `/api/skills/star` | Star a skill |
| `POST` | `/api/skills/unstar` | Unstar a skill |
| `POST` | `/api/skill/tag` | Override skill department classification |

### Skill Pillars

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/skill-pillars/config` | Get pillar configuration (with keyword rules) |
| `POST` | `/api/skill-pillars/config` | Write pillar config, invalidate cache |

### Embeddings / Semantic Search

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/embeddings/status` | Check if Gemini embeddings are available |
| `POST` | `/api/embeddings/build` | Build delta embeddings index |
| `POST` | `/api/embeddings/rebuild` | Full rebuild of embeddings |
| `POST` | `/api/embeddings/query` | Semantic search (body: `{text}`) |

### HQ (Headquarters)

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/hq/config` | Get linked HQ folders |
| `POST` | `/api/hq/link` | Link a new HQ folder |
| `DELETE` | `/api/hq/unlink/:id` | Unlink an HQ folder |
| `GET` | `/api/hq/browse` | Browse server directories |
| `GET` | `/api/hq/pick-folder` | Open native OS file picker (macOS Finder / Linux zenity) |

### Skills Repos

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/skills-repos/config` | List linked skill repos |
| `POST` | `/api/skills-repos/link` | Link a skill repo |
| `POST` | `/api/skills-repos/pull/:id` | Git pull a skill repo |

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
├── memory/              # Session logs (YYYY-MM-DD.md)
└── tmp/                 # Agent scratch space
```

### IDENTITY.md format (parsed by Agent Hub)
```markdown
**Name:** Agent Name
**Emoji:** 🤖
**Role:** Role Description
```

### Workspace naming convention
- `workspace` → agent ID `main` (the default/primary agent)
- `workspace-meda` → agent ID `meda`
- Pattern: `workspace-{id}` where `{id}` is the agent identifier

---

## Skill Structure

Each skill is a directory containing at minimum a `SKILL.md`:

```
{skill-name}/
├── SKILL.md             # Required — YAML frontmatter + markdown instructions
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

---

## Skill Pillars

Skills are classified into action-oriented pillars (replaces old department buckets). Default pillars:

| Pillar | Color | Key signals |
|--------|-------|-------------|
| Build | `#3b82f6` | typescript, react, deploy, api, frontend, backend, mcp |
| Design | `#a855f7` | figma, ui design, ux, brand, design system, typography |
| Write | `#f59e0b` | copywriting, social media, carousel, seo, blog, editorial |
| Research | `#10b981` | research, scrape, analyze, audit, summarize |
| Automate | `#6366f1` | workflow, cron, automation, ops, ci/cd |
| Grow | `#ef4444` | marketing, ads, growth, campaign, funnel, conversion |
| AI Creative | `#ec4899` | image generation, video generation, midjourney, prompt |
| Data | `#14b8a6` | database, embedding, rag, knowledge base, enrichment |
| Sell | `#f97316` | sales, cold email, outreach, founder sales |
| Utility | `#94a3b8` | fallback bucket |

Configurable via `~/.openclaw/agent-hub/skill-pillars.config.json`. Falls back to defaults when no config file exists.

---

## Security Model

- **ALLOWED_ROOTS:** Every file operation is validated against a whitelist of allowed root paths.
- **isWithinRoots(filePath, roots):** Checks that the resolved path starts with an allowed root.
- **Auth:** Simple password via `HUB_PASSWORD` env var. Cookie `agent_hub_auth` set for 7 days. Only active when `NODE_ENV=production` or `HUB_AUTH=true`.
- **No path traversal:** All paths are resolved with `path.resolve()` before checking.

---

## CLI Flags

```bash
agent-hub                # Start server, open browser at localhost:4001
agent-hub --no-open      # Start server, don't open browser (VPS/headless)
agent-hub --vps          # Alias for --no-open
agent-hub --tunnel       # Start Cloudflare tunnel for public access
```

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
