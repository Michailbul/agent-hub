# Agent Hub — Product Requirements Document

> **Version:** 0.2.0 | **Last updated:** 2026-03-06 | **Owner:** Michael Bulakh (Laniameda)
> **Repository:** [github.com/Michailbul/agent-hub](https://github.com/Michailbul/agent-hub) | **License:** MIT

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision](#3-product-vision)
4. [Target Users](#4-target-users)
5. [Jobs To Be Done](#5-jobs-to-be-done)
6. [Product Architecture](#6-product-architecture)
7. [Feature Specifications](#7-feature-specifications)
8. [Information Architecture](#8-information-architecture)
9. [Design System](#9-design-system)
10. [Technical Architecture](#10-technical-architecture)
11. [API Reference](#11-api-reference)
12. [Data Model](#12-data-model)
13. [Security Model](#13-security-model)
14. [Deployment & Distribution](#14-deployment--distribution)
15. [Current State (v0.2)](#15-current-state-v02)
16. [Roadmap](#16-roadmap)
17. [Success Metrics](#17-success-metrics)
18. [Risks & Mitigations](#18-risks--mitigations)
19. [Non-Goals](#19-non-goals)
20. [Appendices](#20-appendices)

---

## 1. Executive Summary

**Agent Hub** is a self-hosted web editor and operating console for AI agent workspaces. It provides a visual control plane over the filesystem — letting users browse, edit, and orchestrate AI agent instruction files, skills, cron schedules, and team structures without leaving the browser.

The product is built for solo founders and small teams who run AI agent setups (OpenClaw, Claude Code, Codex, Cursor, or any markdown-based agent framework). It replaces the workflow of SSH + text editors + terminal commands with a purpose-built GUI that feels like the intersection of an IDE, Notion, and a visual workflow builder.

**Core thesis:** Agent Hub should feel like a stable, production-grade operating console for AI agents — users can reliably find files, compose runnable cron prompts from reusable skills/context blocks, and visually reason about agent workflows in a canvas, all within the warm paper/coral/ink Laniameda design system.

**Distribution:** Open source (MIT), installable via Docker, `npx @laniameda/agent-hub`, or git clone. Designed for local machines and private VPS deployments.

---

## 2. Problem Statement

### The current reality of managing AI agents

Today, managing a team of AI agents requires:

1. **Terminal-heavy workflows** — Creating agent workspaces, editing SOUL.md/MISSION.md/AGENTS.md, installing skills, and configuring cron jobs all happen via SSH, `mkdir`, `vim`/`nano`, and manual file operations.

2. **No org-level view** — With 5-10 agents, there's no way to see who does what, what skills each agent has, how agents relate to each other, or what automations are running. The "team" is invisible.

3. **Fragmented tools** — Users bounce between terminals (file editing), Telegram (agent interaction), cron configs (scheduling), and mental models (orchestration). No single surface provides a coherent view.

4. **Skill management friction** — Copying a skill to an agent means knowing the right directory paths, running `cp -r`, and hoping you got it right. There's no browse-preview-install flow.

5. **Black box execution** — Agents run via Telegram or terminal, but there's no visibility into what they did, what files they changed, or why something failed.

### Who feels this pain most

Solo founders and independent creators who manage teams of AI agents instead of teams of humans. These users treat agents as team members — each with identity, skills, memory, and scheduled tasks. They need a control plane, not a code editor.

---

## 3. Product Vision

### The agentic team OS

Agent Hub is becoming the operating system for AI agent teams:

| View | Paradigm | Purpose |
|---|---|---|
| **Files** | IDE / document editor | Browse and edit agent identity, memory, instructions, PM files |
| **Crons** | Prompt builder + scheduler | Create, compose, and schedule automated agent tasks |
| **Canvas** | Spatial orchestration | Visualize the team, assign skills, understand relationships |

### Three fundamental paradigms (the lego system)

```
SKILLS              AGENTS              CONTEXT & FILES
─────────           ──────              ─────────────────
Building            Team                Identity, memory,
blocks.             members.            instructions, PM.

Drag onto           Have skills.        Shape how the agent
agents.             Have context.       thinks and acts.
Reusable            Have crons.
across agents.
```

### Design philosophy

- **Control plane over the real filesystem** — The UI is a representation of the underlying directory structure. Under the hood, Agent Hub only moves/copies/creates folders + files + config files. If the user stops using Agent Hub, they can return to terminal and everything still works.

- **AI-native, not form-native** — Creation should be driven by editing + AI assistance, not rigid templates or form builders. Composable blocks and chips where possible.

- **No lock-in** — Open source, MIT licensed, reads standard file formats. Agent Hub is a lens, not a jail.

---

## 4. Target Users

### Primary persona: Solo AI operator

- Runs 3-15 AI agents via OpenClaw, Claude Code, or Codex
- Manages agents on a local machine or VPS
- Uses markdown files for agent instructions (SOUL.md, MISSION.md, AGENTS.md)
- Schedules agent tasks via cron jobs
- Communicates with agents via Telegram or terminal
- Technically capable but wants to spend time on strategy, not file management

### Secondary persona: Small operator team

- 2-4 people sharing an OpenClaw workspace
- Need shared visibility into agent configurations
- Password-protected access on a private VPS
- Want to standardize skill libraries across agents

### What they're switching from

- Terminal + SSH + text editors (vim/nano)
- Manual `cp -r` for skill installation
- JSON editing for cron configurations
- Mental models for agent orchestration (no visual tool)

---

## 5. Jobs To Be Done

| JTBD | Current solution | Agent Hub solution |
|---|---|---|
| **Edit and maintain agent instruction files** without markdown syntax overhead | vim/nano with raw markdown | Multi-pane editor with WYSIWYG mode for .md files |
| **Build and schedule cron jobs** by assembling skills, files, and prompt text | Edit JSON files manually, craft prompts in a text editor | Visual cron editor with prompt composer, `/skill` autocomplete, drag-and-drop skills |
| **Understand relationships** between agents, skills, and context at a glance | Mental model, maybe a notes document | Canvas view with agent cards, skill pills, edge connections |
| **Safely copy/move/delete skills** across agents with clear intent and feedback | `cp -r`, `rm -rf` in terminal | Right-click context menu, drag-and-drop in Canvas, confirmation dialogs |
| **Create a new agent** with proper directory structure | `mkdir`, create files manually | (Future) New Agent button scaffolds workspace + identity files |
| **Monitor what's running and when** | Check crontab, grep logs | Crons view with status badges, schedule display, active/paused toggle |

---

## 6. Product Architecture

### System overview

```
                    ┌──────────────────────────────────┐
                    │          Browser (SPA)            │
                    │  React 19 + Vite 7 + Zustand 5   │
                    │                                    │
                    │  ┌────────┬────────┬────────┐     │
                    │  │ Files  │ Crons  │ Canvas │     │
                    │  │ Editor │ Editor │ Board  │     │
                    │  └────────┴────────┴────────┘     │
                    └───────────────┬───────────────────┘
                                    │ HTTP/SSE
                    ┌───────────────┴───────────────────┐
                    │     Express 4 API Server           │
                    │     Node.js + TypeScript            │
                    │                                    │
                    │  ┌──────┐ ┌──────┐ ┌───────────┐  │
                    │  │ Auth │ │ File │ │ Discovery │  │
                    │  │      │ │ Ops  │ │ Engine    │  │
                    │  └──────┘ └──────┘ └───────────┘  │
                    │  ┌──────┐ ┌──────┐ ┌───────────┐  │
                    │  │ Cron │ │Skill │ │ Setup     │  │
                    │  │ CRUD │ │Index │ │ Agent     │  │
                    │  └──────┘ └──────┘ └───────────┘  │
                    └───────────────┬───────────────────┘
                                    │ Filesystem
                    ┌───────────────┴───────────────────┐
                    │         Agent Workspaces            │
                    │  ~/.openclaw/workspace-*/           │
                    │  ~/.agents/skills/                  │
                    │  ~/.openclaw/cron/jobs.json         │
                    └────────────────────────────────────┘
```

### Key architectural decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | React 19 + Vite 7 | Modern, fast DX, TypeScript-first |
| State management | Zustand 5 | Lightweight, no boilerplate, perfect for medium-complexity app |
| Code editor | CodeMirror 6 | Best-in-class for code editing, extensible |
| Rich text editor | TipTap 3 (ProseMirror) | Notion-style WYSIWYG, headless (we style it), markdown roundtrip |
| Backend | Express 4 (Node.js) | Simple, no framework bloat, single-file server |
| Canvas | Positioned divs + CSS transforms | No heavy library needed for MVP; add xyflow later if needed |
| Storage | Filesystem (no database) | Zero setup, no lock-in, compatible with terminal workflows |
| Auth | Cookie-based password | Simple, sufficient for private/VPS deployments |
| Build | tsup (server) + Vite (client) | Fast compilation, CJS for Node 18+ |
| Distribution | Docker + npm + git | Multiple install paths for different user segments |

---

## 7. Feature Specifications

### 7.1 Files View — Multi-Pane Editor

The Files view is an IDE-style workspace browser and document editor.

**Sidebar (left panel):**
- Auto-discovered agent workspaces from filesystem
- Each agent shows expandable sections:
  - Instructions (SOUL.md, MISSION.md, AGENTS.md, USER.md, IDENTITY.md)
  - Memory (MEMORY.md)
  - PM (vision.md, backlog.md, etc.)
  - Skills (installed skill folders)
- Skill library sections (Studio, Community, System)
- Source filter pills: All | Studio | Community | System
- File items are clickable (open in active pane), draggable (open in new pane), right-clickable (context menu)

**Editor area (center):**
- Up to 4 simultaneous panes with resizable dividers
- Each pane supports two modes:
  - **Rich mode** (TipTap WYSIWYG) — default for .md files. Notion-style editing with headings, lists, bold/italic, code, links, task lists
  - **Markdown mode** (CodeMirror) — raw markdown with syntax highlighting, line numbers, bracket matching
- Mode toggle per pane (Rich/Markdown button in header)
- Pane headers with draggable tabs for reorder
- Dirty indicator (animated coral pulse) per unsaved file
- Ctrl/Cmd+S saves active file
- Drag files from sidebar to pane body (replace) or header (create adjacent pane)
- Drag .md/.txt files from OS filesystem into editor
- `beforeunload` warning on unsaved changes

**Context menu (right-click on skill):**
- Open in active pane / new pane
- Copy to agent (submenu with all agents)
- Move to agent (submenu)
- Delete skill (with confirmation)

### 7.2 Crons View — Scheduled Job Manager

The Crons view is a prompt builder and automation scheduler.

**Job picker (top):**
- Horizontal chip-style tabs for all cron jobs
- New Job (+) button creates blank job with default template
- Active job visually highlighted

**Job editor (center, document-first layout):**
- Floating action bar: Save, Delete buttons
- Title input field
- Status badge (Active/Paused) with toggle
- Property table:
  - Agent assignment (dropdown of discovered agents)
  - Schedule: Cron expression or interval, with preset picker (Every day 9am, 5pm, Every Monday, Every hour, Every 6h)
  - Timezone selector (Europe/Minsk, UTC, America/New_York, etc.)
  - Model selection
  - Timeout (seconds)
  - Delivery mode: Announce / Silent / None
  - Wake mode toggle
- Prompt section with PromptComposer

**Prompt Composer:**
- Large textarea (18 rows default) for writing the agent's prompt
- Skill tag detection: typing `[skill: name]` auto-detects and shows as chips below
- `/skill` autocomplete command: type `/skill` then search, select to insert `[skill: name]` at cursor
- Drag-and-drop skill insertion from external sources
- Detected skills shown as removable chips below the textarea

**Keyboard shortcuts:**
- Ctrl/Cmd+S saves the active cron job
- Dirty state detection (JSON comparison against last saved state)

### 7.3 Canvas View — Visual Agent Orchestration

The Canvas view is a spatial, drag-and-drop orchestration board.

**Canvas board (center):**
- Pannable (middle-click or Ctrl+click drag) and zoomable (scroll wheel, 0.25x-2x range)
- Agent cards positioned on an infinite canvas
- Background department zones (auto-classified: Marketing, Engineering, Design, Operations, Research)
- SVG curved edges between agents showing subagent relationships
- Click empty area to deselect

**Agent nodes (cards):**
- Header: emoji, agent name, role
- Meta pills: model name, subagent count, skill count
- Skill pills with remove (x) button
- Expandable skill list (max 5 visible, then "+N more")
- Drag-and-drop skill assignment (drop skills from palette onto card)
- Double-click navigates to Files view for that agent
- Telegram badge showing integration status (account, group count, DM policy)
- Draggable to reposition

**Skills palette (right panel):**
- Searchable list grouped by department
- Collapsible department sections
- Each skill shows: name, department, summary, installation count
- Skills are draggable onto agent nodes (`application/x-canvas-skill` MIME type)

**Department zones:**
- Heuristic classification based on agent name, role, and skill names
- Renders as labeled background rectangles behind agent cards
- Departments: Marketing, Engineering, Design, Operations, Research

**Edge visualization:**
- Quadratic bezier SVG curves between connected agents
- Arrow markers at edge endpoints
- Semi-transparent coral colored
- Computed from subagent relationships in openclaw.json

**Canvas data persistence:**
- Agent positions stored in localStorage
- Auto-layout: 3-column grid (340px x 280px spacing) when no saved positions
- Zoom and pan state persisted

### 7.4 First-Run Setup

Guided setup experience for new installations.

**Detection flow:**
1. Server checks for existing config file
2. If no config found, `/api/setup/status` returns `{ needsSetup: true }`
3. Frontend shows `SetupOverlay` component

**Setup overlay:**
- Detects Claude Code or Codex CLI on PATH
- Shows CLI detection status
- "Scan my workspace" button triggers AI-assisted setup

**AI-assisted scanning (SSE):**
1. Server spawns Claude CLI with a pre-made prompt
2. The AI agent scans `~/.openclaw/` for workspace directories
3. Reads IDENTITY.md from each workspace
4. Discovers skill libraries across ecosystem paths
5. Generates `agent-hub.config.json`
6. Progress streamed via SSE to browser in terminal-style UI
7. On completion, user clicks "Launch Hub" to reload

### 7.5 Authentication

- Password-based login (configured via `HUB_PASSWORD` env var)
- Cookie-based session (`agent_hub_auth`, 7-day expiry)
- Login form with password input
- All API endpoints (except `/api/login`, `/api/setup/status`) require auth
- Logout clears cookie

### 7.6 CLI (npx entrypoint)

- **Command:** `npx @laniameda/agent-hub` or `agent-hub`
- **Flags:**
  - `--tunnel` — Starts a Cloudflare tunnel for instant remote access without port forwarding. Auto-installs `cloudflared` if needed.
  - `--no-open` / `--vps` — Suppresses auto-opening browser (for server/VPS deployments)
- Auto-opens browser after server startup
- Graceful shutdown on SIGINT/SIGTERM

---

## 8. Information Architecture

### Navigation model

```
┌─────────────────────────────────────────────────┐
│  TopBar: [Files] [Crons] [Canvas]    [Refresh]  │
├───────────────┬─────────────────────────────────┤
│               │                                 │
│   Sidebar     │    Active View Content          │
│   (Files      │                                 │
│    view only) │    Files:  Multi-pane editor     │
│               │    Crons:  Job editor + composer │
│   - Agents    │    Canvas: Board + skills panel  │
│   - Skills    │                                 │
│   - Libraries │                                 │
│               │                                 │
└───────────────┴─────────────────────────────────┘
```

### Top-level views

| View | Route | Sidebar | Description |
|---|---|---|---|
| Files | `#/files` | Visible | Workspace tree + multi-pane editor |
| Crons | `#/crons` | Hidden | Job picker + detail editor + composer |
| Canvas | `#/canvas` | Hidden | Agent board + skills palette |

### Cross-area object model

These objects are shared across views with consistent IDs and labels:

| Object | Representation |
|---|---|
| **Agent** | Sidebar section, Canvas card, Cron dropdown |
| **File** | Sidebar item, Editor pane, Canvas skill pill source |
| **Skill** | Sidebar item, Canvas pill, Cron composer chip, Library row |
| **Cron Job** | Crons tab, Canvas edge source (future) |

### Transition rules

- Opening a file from any view routes to Files and focuses the pane
- Agent card double-click in Canvas navigates to Files with that agent's files
- Skills can be dragged from Canvas palette onto agent cards (install)
- Skills can be referenced in Crons via `/skill` autocomplete or drag-and-drop

---

## 9. Design System

### Visual identity

Agent Hub uses the Laniameda design system — a warm, brutalist aesthetic that feels premium without being cold.

### Color palette

**Surfaces (Paper Stack):**
| Token | Value | Usage |
|---|---|---|
| `--paper` | `#fffaf5` | Primary background |
| `--surface-1` | `#fff4ea` | Elevated cards |
| `--surface-2` | `#f5e6d6` | Secondary surfaces |
| `--surface-3` | `#ecdac8` | Tertiary surfaces |
| `--surface-4` | `#e4d4c4` | Deepest surface |

**Text hierarchy (Ink Scale):**
| Token | Value | Usage |
|---|---|---|
| `--ink` | `#201710` | Primary text, headings |
| `--text-primary` | `#201710` | Body text |
| `--text-secondary` | `#4c3a2d` | Labels, descriptions |
| `--text-tertiary` | `#7d6755` | Subtle text |
| `--text-ghost` | `#ab9381` | Placeholders |

**Accent:**
| Token | Value | Usage |
|---|---|---|
| `--coral` | `#ff7a64` | Primary accent, CTAs, active states |
| `--warm-accent` | `#e8614f` | Darker coral variant |

**Semantic colors:**
| Usage | Value |
|---|---|
| Status: running | Coral |
| Status: success | `#16a34a` |
| Status: error | `#dc2626` |
| Status: queued | Text tertiary |

### Typography

| Role | Font | Details |
|---|---|---|
| UI / Body | `Inter` | System-ui fallback |
| Code / Paths / Tokens | `JetBrains Mono` | Monospace |

**Scale:** 10px (micro) → 11px (xs) → 13px (sm) → 15px (base) → 18px (lg) → 24px (xl) → 32px (2xl)

### Shadows & depth

| Token | Value | Usage |
|---|---|---|
| Soft sm | `0 1px 2px rgba(...)` | Subtle elevation |
| Soft md | `0 4px 6px rgba(...)` | Cards |
| Soft lg | `0 10px 15px rgba(...)` | Modals |
| **Brutalist** | `4px 4px 0 0 var(--ink)` | Signature element: card borders |
| Brutal accent | `4px 4px 0 0 rgba(255,122,100,.5)` | Accent cards |

### Interactive states

| State | Behavior |
|---|---|
| Hover | Subtle lift: `translate(-2px, -2px)` + shadow grows |
| Active/Press | `translate(0,0)` + shadow disappears |
| Focus | Clear outline with coral inset or border accent |
| Disabled | Lower contrast, no hover transform |
| Selected | Persistent background accent + label contrast |

### Spacing

4 / 8 / 12 / 16 / 24 scale only. Dense data regions (lists, rows): 8-12px vertical rhythm. Editing surfaces: 16-24px spacing.

### Borders

- Subtle: `rgba(32,23,16,.08)`
- Default: `rgba(32,23,16,.16)`
- Strong: `rgba(32,23,16,.24)`
- Accent: `rgba(255,122,100,.35)`

### Signature elements

- Brutalist corner radius: `--r: 0` (square corners)
- 2px borders on interactive elements
- 3px scrollbars with coral hover
- Glass surfaces: `backdrop-filter: blur(20px) saturate(120%)`
- Selection highlight: `rgba(255,122,100,.18)`

---

## 10. Technical Architecture

### Stack

| Layer | Technology | Version |
|---|---|---|
| **Server** | Node.js + Express | Express 4.18, Node 18+ |
| **Server language** | TypeScript | 5.9 |
| **Server build** | tsup | 8.5 (CJS output) |
| **Client framework** | React | 19.2 |
| **Client build** | Vite | 7.3 |
| **State management** | Zustand | 5.0 |
| **Code editor** | CodeMirror | 6.0 |
| **Rich text editor** | TipTap | 3.20 |
| **Containerization** | Docker | Multi-stage, Node 22 Alpine |

### Project structure

```
agent-hub/
  src/
    server.ts           Express API server (~987 lines)
    cli.ts              npx entrypoint, --tunnel, --no-open flags
    setup-agent.ts      Spawns Claude/Codex CLI for auto-setup
    setup-prompt.ts     Pre-made prompt for workspace scanning
  dist/                 tsup compiled output (CJS, node18)
  client/
    src/
      App.tsx           Root: routing, view switching, global keybindings
      main.tsx          React entry point
      components/
        Auth/           LoginForm
        Setup/          SetupOverlay
        Layout/         TopBar, ActivityBar, BreadcrumbPath
        Sidebar/        Sidebar, AgentSection, FileItem, FilterBar, ContextMenu
        Editor/         PaneManager, Pane, PaneHeader, PaneStatus,
                        CMEditor, RichMarkdownEditor
        Crons/          CronsPanel, CronDetail, CronCard, PromptComposer
        Canvas/         CanvasView, CanvasBoard, AgentNode, CanvasToolbar,
                        SkillsPanel, SkillPaletteRow, SubagentEdgeSVG,
                        DepartmentZone, TelegramBadge
      store/
        auth.ts         Authentication state
        ui.ts           UI state (filters, toasts, saved flash)
        panes.ts        Multi-pane editor state (up to 4 panes)
        crons.ts        Cron jobs CRUD, tab state, active job
        canvas.ts       Canvas visualization, zoom, pan, positions
      hooks/
        useFile.ts      File fetching hook
        useSetup.ts     Setup detection hook
        useTree.ts      Workspace tree hook
      lib/
        api.ts          Thin fetch wrappers for all API endpoints
        cmTheme.ts      CodeMirror brand theme (colors, fonts)
      types/
        index.ts        Core TypeScript interfaces
        canvas.ts       Canvas-specific types
        cron.ts         Cron job types
      index.css         Full design system (~1200+ lines CSS variables)
  pm/                   Product management docs
  Dockerfile            Multi-stage Node 22 Alpine
  docker-compose.example.yml
  agent-hub.config.example.json
  AGENTS.md             Agent/LLM instructions
```

### State stores (Zustand)

| Store | Responsibility |
|---|---|
| `auth.ts` | Login/logout, auth checking via `/api/tree` |
| `ui.ts` | Skill source filter, toast notifications, saved indicator |
| `panes.ts` | Multi-pane state: add/close/reorder/resize, content tracking, dirty flags, rich/markdown mode |
| `crons.ts` | Jobs array, CRUD operations, open/close tabs, active job, enabled toggle |
| `canvas.ts` | Agent data, zoom/pan, positions (localStorage-persisted), skill assign/unassign, palette |

### Auto-discovery engine

The server has a sophisticated workspace discovery system:

1. **`resolveOpenclawRoot()`** — Scans multiple candidate paths for the OpenClaw root directory
2. **`resolveAgentsSkillsRoot()`** — Finds skill libraries across ecosystem paths
3. **`discoverAgents()`** — Scans for `workspace-*` directories, reads IDENTITY.md for metadata
4. **`buildSkillSourceDescriptors()`** — Builds a deduplicated, priority-sorted list of skill sources across 8 ecosystem paths (`~/.agents/skills`, `~/.codex/skills`, `~/.cursor/skills`, `~/.claude/skills`, etc.)
5. **`buildSkillsIndex()`** — Full indexing: reads SKILL.md, parses YAML frontmatter, extracts summary, classifies by department, tracks installation status per agent
6. **`classifySkillGrouping()`** — Heuristic classification into Engineering, Research, Content, Design, Growth, Ops, Data, Utility

### Configuration loading priority

1. Config file (`CONFIG_PATH` env or `~/.openclaw/agent-hub/agent-hub.config.json`)
2. Environment variables (`OPENCLAW_ROOT`, `AGENTS_SKILLS_ROOT`)
3. Auto-discovery (scan for `workspace-*` directories)

---

## 11. API Reference

### Authentication

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/login` | No | `{ password }` → sets `agent_hub_auth` cookie (7-day) |
| `POST` | `/api/logout` | No | Clears auth cookie |

### Workspace

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/refresh` | Yes | Re-scan agents and skills without server restart |
| `GET` | `/api/tree` | Yes | Full workspace tree: agents (instructions, memory, PM, skills), libraries, studio |
| `GET` | `/api/skills/index` | Yes | Complete skill index with variants, grouping, installed/missing per agent |
| `GET` | `/api/canvas/data` | Yes | Canvas data: agents with models, subagents, telegram bindings, skill sources, edges |
| `GET` | `/api/assign-targets` | Yes | Agent workspace targets for local file assignment |

### File operations

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/file?path=` | Yes | Read file content (whitelist-validated) |
| `POST` | `/api/file` | Yes | Write file `{ path, content }` (whitelist-validated) |

### Skill management

| Method | Route | Auth | Description |
|---|---|---|---|
| `POST` | `/api/skill/copy` | Yes | Copy skill directory `{ src, destDir }` |
| `POST` | `/api/skill/move` | Yes | Move skill directory `{ src, destDir }` |
| `POST` | `/api/skill/delete` | Yes | Delete skill directory `{ src }` |
| `POST` | `/api/skills/assign` | Yes | Install skill variant to agent `{ agentId, variantPath }` |
| `POST` | `/api/skills/unassign` | Yes | Remove skill from agent `{ agentId, skillId }` |

### Cron jobs

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/crons` | Yes | List all cron jobs |
| `POST` | `/api/crons` | Yes | Create cron job (auto-generates UUID) |
| `PATCH` | `/api/crons/:id` | Yes | Update cron job fields |
| `DELETE` | `/api/crons/:id` | Yes | Delete cron job |

### Setup

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/api/setup/status` | No | `{ needsSetup, cli, configPath }` |
| `GET` | `/api/setup/run` | No | SSE stream: spawns Claude/Codex CLI for workspace scanning |

---

## 12. Data Model

### Agent (discovered from filesystem)

```typescript
interface Agent {
  id: string              // workspace directory name
  label: string           // from IDENTITY.md
  emoji: string           // from IDENTITY.md
  role: string            // from IDENTITY.md
  root: string            // absolute path to workspace directory
  files: string[]         // instruction file names
  memoryFiles: string[]   // MEMORY.md etc.
  pmFiles: string[]       // pm/*.md files
  skillsRoot: string      // path to agent's skills directory
}
```

### Skill (indexed from SKILL.md)

```typescript
interface Skill {
  id: string              // skill directory name
  name: string            // from SKILL.md frontmatter
  author: string          // from frontmatter
  source: string          // from frontmatter
  description: string     // from frontmatter
  license: string         // from frontmatter
  body: string            // summary extracted from SKILL.md
  department: string      // heuristic classification
  purpose: string         // classified purpose
  variants: SkillVariant[] // different versions/sources
  installedBy: string[]   // agent IDs that have this skill
  missingFrom: string[]   // agent IDs that don't have this skill
}
```

### Cron Job (stored in jobs.json)

```typescript
interface CronJob {
  id: string              // UUID
  name: string
  enabled: boolean
  schedule: {
    type: 'cron' | 'interval'
    expression: string    // cron expression or interval duration
  }
  timezone: string
  payload: {
    agentId: string
    message: string       // the prompt
    model: string
    timeoutSeconds: number
  }
  delivery: {
    mode: 'announce' | 'silent' | 'none'
  }
  wakeMode: boolean
  createdAt: string       // ISO timestamp
  updatedAt: string       // ISO timestamp
}
```

### Canvas Agent (enriched for canvas view)

```typescript
interface CanvasAgent {
  id: string
  label: string
  emoji: string
  role: string
  model: { primary: string; fallbacks: string[] }
  subagents: string[]     // other agent IDs
  telegram: {
    account: string
    enabled: boolean
    groupCount: number
    dmPolicy: string
  }
  skills: CanvasSkill[]
  skillSources: SkillSourceDescriptor[]
}
```

### Storage locations

| Data | Location | Format |
|---|---|---|
| Agent workspaces | `~/.openclaw/workspace-*/` | Directories with markdown files |
| Skill libraries | `~/.agents/skills/`, `~/.openclaw/skills/`, etc. | Directories with SKILL.md |
| Cron jobs | `~/.openclaw/cron/jobs.json` | JSON (with .bak backup) |
| App config | `~/.openclaw/agent-hub/agent-hub.config.json` | JSON |
| OpenClaw config | `~/.openclaw/openclaw.json` | JSON |
| Canvas positions | Browser localStorage | JSON |
| Layout preferences | Browser localStorage | JSON |

---

## 13. Security Model

### Filesystem access control

All file operations pass through `isAllowed(filePath)`:
- Validates against `ALLOWED_ROOTS` — a computed whitelist of all agent roots, skill roots, library roots, config roots
- Deduplication via `uniqPaths()` to prevent redundant checks
- Prevents path traversal — every read/write/delete checks the whitelist
- No arbitrary filesystem access

### Authentication

- Password from `HUB_PASSWORD` environment variable (default: "changeme")
- Cookie-based: `agent_hub_auth` cookie with 7-day maxAge
- `httpOnly: false` to allow JS detection of auth state
- All API endpoints except `/api/login` and `/api/setup/status` require auth

### Deployment security

- Designed for local network / VPN / private VPS use
- Not recommended for public internet without additional auth layer
- Docker runs as non-root user
- `--dangerously-skip-permissions` cannot run as root
- Cloudflare tunnel (`--tunnel` flag) provides encrypted access

### Non-goals

- Multi-user access control (single password for now)
- Role-based permissions
- Audit logging
- End-to-end encryption

---

## 14. Deployment & Distribution

### Installation methods

**1. Docker (recommended for VPS)**
```bash
docker run -d \
  -p 4001:4001 \
  -e HUB_PASSWORD=your-password \
  -e OPENCLAW_ROOT=/data/openclaw \
  -v ~/.openclaw:/data/openclaw \
  -v ~/.agents:/data/agents \
  --name agent-hub \
  ghcr.io/laniameda/agent-hub:latest
```

**2. npx (recommended for local)**
```bash
npx @laniameda/agent-hub
```

**3. Git clone (for development/contribution)**
```bash
git clone https://github.com/laniameda/agent-hub
cd agent-hub && npm install
HUB_PASSWORD=mypass node server.js
```

### Build pipeline

```bash
# Server: TypeScript → CJS via tsup
tsup src/cli.ts src/server.ts --format cjs --target node18 --clean

# Client: TypeScript check + Vite build → dist-client/
cd client && tsc -b && vite build
```

### Docker image

- Multi-stage build: Node 22 Alpine
- Builder stage: install deps, build server + client
- Production stage: production deps only, copies `dist/` + `dist-client/`
- CMD: `node dist/cli.js --no-open`
- Image: `ghcr.io/laniameda/agent-hub:latest`

### Docker Compose (production)

- Maps `~/.openclaw` to `/data/openclaw` and `~/.agents` to `/data/agents`
- Environment variables: `HUB_PASSWORD`, `OPENCLAW_ROOT`, `AGENTS_SKILLS_ROOT`
- Designed for Traefik reverse proxy with Let's Encrypt SSL
- Live at: `https://agent-hub.srv1439489.hstgr.cloud`

### Development workflow

```bash
npm run dev  # Runs concurrently: server (tsup watch + node) + client (vite dev on :5173)
```

Vite dev server proxies `/api` and `/login` to `localhost:4001`.

---

## 15. Current State (v0.2)

### What's shipped and working

| Feature | Status | Notes |
|---|---|---|
| Files view: multi-pane CodeMirror editor | Complete | Up to 4 panes, resize dividers, drag-and-drop |
| Files view: Rich markdown editor (TipTap) | Complete | Mode toggle per pane, markdown shortcuts, task lists |
| Sidebar: agent tree + skill libraries | Complete | Auto-discovery, expandable sections, source badges |
| Sidebar: context menu (copy/move/delete) | Complete | Full skill management operations |
| Sidebar: source filter (Studio/Community/System) | Complete | Filter pills |
| Crons view: job list + detail editor | Complete | CRUD, schedule presets, property table |
| Crons view: prompt composer with skill autocomplete | Complete | `/skill` command, regex detection, drag-and-drop |
| Canvas view: agent cards on spatial board | Complete | Drag, zoom, pan, department zones |
| Canvas view: skill palette + drag-to-assign | Complete | Install/uninstall skills via drag-and-drop |
| Canvas view: subagent edge visualization | Complete | SVG bezier curves, auto-detected from config |
| Canvas view: Telegram badge on agents | Complete | Shows account, group count, DM policy |
| Auto-discovery of workspaces | Complete | Multi-path scanning, IDENTITY.md parsing |
| Skill indexing across 8 ecosystem paths | Complete | YAML frontmatter, department classification |
| First-run setup via Claude/Codex CLI | Complete | SSE streaming, auto-config generation |
| Password authentication | Complete | Cookie-based, 7-day sessions |
| CLI with --tunnel and --no-open | Complete | Cloudflare tunnel support |
| Docker deployment | Complete | Multi-stage build, Traefik support |
| Live refresh (rescan without restart) | Complete | POST /api/refresh |

### Known gaps

| Gap | Impact | Priority |
|---|---|---|
| No file creation UI | Users must use terminal to create new files | High |
| No search across files | Can't find content without reading individual files | High |
| No settings panel | Config changes require env vars / JSON editing | Medium |
| No file rename in-place | Must use terminal for renames | Medium |
| Error states (network fail) are silent | Users don't know when operations fail | Medium |
| No deep linking (URL routing) | Refresh loses active view | Medium |
| No agent creation from GUI | Must manually `mkdir` + create files | Medium |
| Chip-based prompt composer not built | Composer is textarea with regex detection | Low (works, not elegant) |
| No cron expression validation | Invalid schedules can be saved | Low |
| README is outdated | Still references vanilla JS / CodeMirror 5 | Low |

---

## 16. Roadmap

### v0.3 — Foundation + Interaction Contract

**Goal:** Stability, persistence, consistent interaction rules.

| Task | Description |
|---|---|
| Hash-based routing | `#/files`, `#/crons`, `#/canvas` — preserve view on refresh |
| Pane width persistence | Store ratios in localStorage via Zustand |
| Standardized drag/drop | Drop preview ghost, Enter/Escape contract |
| Interaction tooltips | First-use hints for pane drag, skill insert |

### v0.4 — Chip Composer + Canvas Enhancement

**Goal:** Upgrade prompt composition and agent creation.

| Task | Description |
|---|---|
| Block-model composer | Replace textarea with `ComposerBlock[]` (text, skill-chip, file-chip, var-chip) |
| `/file`, `/var`, `@` autocomplete | Beyond just `/skill` |
| Chip drag reorder | With insertion line indicator |
| Skill preview: rendered markdown | Replace raw `<pre>` with proper markdown rendering + metadata |
| Cron validation | Inline cron expression check, required fields, disabled save until valid |
| Agent creation endpoint | `POST /api/agents/create` scaffolds workspace directory + identity files |
| New Agent button (Canvas) | Creates agent card + workspace |

### v0.5 — Agent Chat + Live Edit

**Goal:** Transparent AI execution inside the hub.

| Task | Description |
|---|---|
| Agent chat sidebar | Spawn Claude/Codex CLI, stream response to UI |
| File change diffs | Branded GitHub-style diff view (coral additions, muted deletions) |
| Approve/reject per file | User controls every change |
| Cron chat assistant | AI edits cron jobs via natural language |

### v0.6 — Canvas Links + Integrations

**Goal:** Deeper visualization and channel management.

| Task | Description |
|---|---|
| Link semantics | "uses", "feeds", "scheduled by" between canvas nodes |
| Node inspector panel | Side panel with file links, cron associations, quick actions |
| Auto-detect edges | From cron targets + shared skills |
| Telegram Mini App | Agent Hub as embedded Telegram WebView (read-only MVP) |
| Channel config UI | Guided Telegram/Slack integration setup |

### Future vision

- Multi-user collaboration
- Agent departments (UI-only grouping metadata)
- Cron runtime observability dashboard
- Plugin ecosystem
- Export team config as portable JSON

---

## 17. Success Metrics

### Core metrics

| Metric | Target | How measured |
|---|---|---|
| Time to create first valid cron job | < 3 minutes | Session timing from cron tab open to first save |
| Save success rate | > 99% (no accidental overwrite) | Save error rate tracking |
| Skill insertion frequency | > 2 skills per cron job on average | Composer chip count at save time |
| Weekly active editing sessions | > 5 per workspace | Session count per week |
| Layout surprise events | 0 unexpected pane replacements | User-reported incidents |

### Adoption metrics

| Metric | Description |
|---|---|
| npm downloads | Weekly installs of `@laniameda/agent-hub` |
| Docker pulls | `ghcr.io/laniameda/agent-hub` pull count |
| GitHub stars | Community interest signal |
| GitHub issues | Active user engagement |
| VPS deployments | Self-hosted instances (estimated from tunnel usage) |

---

## 18. Risks & Mitigations

| Risk | Threat | Mitigation |
|---|---|---|
| **TipTap markdown roundtrip** | Saving a TipTap-edited file loses formatting or custom syntax agents depend on | Roundtrip test suite on 20+ real files; raw mode always one click away; fallback to CodeMirror |
| **Composer complexity** | Chips + autocomplete + raw toggle overwhelm users | Progressive disclosure (starts as plain textarea); text-first default; placeholder help text |
| **Canvas novelty** | Pretty cards that users look at once then ignore | Every node has concrete actions (open files, install skills, navigate); canvas is the only place to create agents (future) |
| **Large skill libraries** | `/api/tree` payload grows with 50+ skills x 10 agents | Virtualize lists (content-visibility: auto); cache responses; limit autocomplete to 12 items |
| **Filesystem coupling** | Changes to OpenClaw directory structure break Agent Hub | Auto-discovery with fallbacks; auto-heal path scanning; graceful degradation |
| **Single-user auth** | Password is insufficient for team deployments | Accept for v0.2-0.4; plan proper auth for v0.5+; recommend VPN/tunnel for now |

---

## 19. Non-Goals

These are explicitly out of scope for the current and near-term roadmap:

- **Multi-user real-time collaboration** — Single-user control plane for now
- **Full cron runtime observability** — No execution logs, no run history dashboard
- **Rich plugin ecosystem** — No extensibility API
- **Mobile-responsive layout** — Desktop-first (Telegram Mini App covers mobile later)
- **Automated testing suite** — Manual testing for MVP velocity
- **Agent-to-agent communication protocol** — Agent Hub is a control plane, not a runtime
- **Billing / monetization** — MIT open source, no paid tier planned
- **Custom theming** — Laniameda design system only
- **i18n / localization** — English only

---

## 20. Appendices

### A. Environment variables

| Variable | Default | Description |
|---|---|---|
| `HUB_PASSWORD` | `changeme` | Login password |
| `PORT` | `4001` | HTTP port |
| `OPENCLAW_ROOT` | `/data/openclaw` | OpenClaw root directory |
| `AGENTS_SKILLS_ROOT` | `/data/agents/skills` | Custom skills directory |
| `CONFIG_PATH` | `./agent-hub.config.json` | Path to config file |

### B. Skill source descriptor priorities

Agent Hub scans for skills across these paths (in priority order):

1. `~/.agents/skills/` — User's personal skill library
2. `~/.agent/skills/` — Alternative personal path
3. `~/.codex/skills/` — Codex ecosystem
4. `~/.cursor/skills/` — Cursor ecosystem
5. `~/.cursor/skills-cursor/` — Cursor alternative
6. `~/.claude/skills/` — Claude ecosystem
7. `OPENCLAW_ROOT/skills/` — OpenClaw global skills
8. Each agent's `workspace-*/skills/` — Per-agent installed skills

### C. Skill classification buckets

| Department | Keywords |
|---|---|
| Engineering | code, dev, build, deploy, git, api, test, debug |
| Research | research, analyze, data, scrape, crawl, market |
| Content | write, copy, blog, social, content, email, seo |
| Design | design, ui, ux, brand, visual, layout |
| Growth | growth, ads, campaign, funnel, conversion, outreach |
| Operations | ops, monitor, alert, backup, infra, ci/cd |
| Data | database, sql, etl, pipeline, warehouse |
| Utility | (default bucket for unclassified skills) |

### D. Keyboard shortcuts

| Shortcut | Context | Action |
|---|---|---|
| Ctrl/Cmd+S | Files editor | Save active pane |
| Ctrl/Cmd+S | Crons editor | Save active cron job |
| Tab/Shift+Tab | Crons view | Cycle open cron tabs |
| Scroll wheel | Canvas | Zoom in/out |
| Middle-click drag | Canvas | Pan canvas |
| Ctrl+click drag | Canvas | Pan canvas (alternative) |

### E. Related repositories

| Repo | Purpose |
|---|---|
| `Michailbul/agent-hub` | This repo — the open source product |
| `Michailbul/laniameda-agent-hub` | Marketing landing page (Next.js, private) |
| OpenClaw | Agent runtime that Agent Hub manages |

---

*This PRD is a living document. Last generated from codebase analysis on 2026-03-06.*
