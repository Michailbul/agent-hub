# Agent Hub — Backlog

## In Progress
- [ ] npm publish v0.2.0

## Queued
- [ ] File creation UI (new skill/md from sidebar)
- [ ] Error states (network fail = silent white)
- [ ] GitHub Actions → GHCR Docker image
- [ ] Option A path refactor: relative paths internally (agentId + relativePath)
- [ ] Ctrl+F search across all agent files
- [ ] Settings panel UI (update paths without env vars)
- [ ] File rename in-place

## Ideas / Future

### [v0.5] Agent Collaboration Graph
Visual map of how agents interact — based on:
- Shared cron jobs (which agents are scheduled together)
- Cross-references in SOUL.md / AGENTS.md / MISSION.md files
- Delivery targets (cron jobs that ping the same Telegram channel)
- Shared skill libraries

How to build:
1. Construction prompt → spawn sub-agent to analyze all agent MD files + crons
2. Sub-agent outputs JSON graph: { nodes: [agents], edges: [relationships] }
3. Visualize with canvas/SVG force-directed graph (D3 or manual layout)
4. Clickable nodes → open agent files; edges → show what links them
5. AI-generated "what can be improved" suggestions panel

Value: see the studio as a system, not a collection of files.
Effort: ~2-3 days. Priority: post-npm publish.

---

## [HIGH PRIORITY] Visual Agent Orchestration Builder — v0.4

### The problem
Right now you can only edit existing agent files. There's no way to:
- See your team of agents as a system
- Create a new agent from scratch (have to SSH + mkdir + create files manually)
- Visually assign which skills each agent has
- Define shared context (the studio/company context that all agents should know)
- See who talks to who, what crons fire when

You have to manually tell each agent what to do — there's no org-level view.

### The vision
A 3rd view in Agent Hub (alongside Files and Crons): **Team Builder**

```
[Files] [Crons] [Team]
```

A canvas with:
- Agent nodes (one card per agent) — show emoji, name, role
- Each node has: Skills section (drag skill pills in/out), Shared Context pointer
- Add Agent button → creates workspace-xxx directory + SOUL.md + IDENTITY.md + AGENTS.md in ~/.openclaw
- Drag skills from a skills palette onto agent cards
- Click any agent card → opens their files in Editor view
- Shared context panel → point to a file all agents read (e.g. laniameda-hq/studio/identity.md)
- Edge lines between agents that share crons/channels (auto-detected)

### Under the hood
- "Add Agent" → POST /api/agents/create → mkdir ~/.openclaw/workspace-{id}/, scaffold minimal files
- "Add skill to agent" → POST /api/skill/copy → copies skill folder to agent's workspace/skills/
- "Remove skill" → DELETE /api/skill → deletes from agent's skills dir
- "Set shared context" → writes path reference into agent's AGENTS.md
- All changes → immediately visible in File view (↻ Refresh picks them up)

### Why higher priority than Claude Code integration
- Orchestration layer: lets users BUILD their agent organization, not just edit files
- No AI API calls needed — pure file operations + GUI
- Cheaper to implement (no subprocess management)
- Unlocks the "team of agents" use case that's OpenClaw's core promise
- Claude Code integration is nice-to-have; this is core to the product value prop

### v0.4 scope (MVP)
- [ ] Team view canvas with agent cards
- [ ] Add new agent from GUI (scaffolds files)
- [ ] Assign/remove skills via drag-drop
- [ ] Shared context pointer (write to AGENTS.md)
- [ ] POST /api/agents/create server endpoint
- [ ] Agent card click → switches to Files view, opens agent folder

### v0.5 additions (post-MVP)
- [ ] Agent collaboration graph (edge lines from shared crons/channels)
- [ ] AI-generated suggestions for team structure
- [ ] Export team config as agent-hub.config.json

---

## [HIGH] Cron Job Detail Panel + Skills Browser — v0.4

### Problem
Right now clicking a cron job just opens the edit modal (full-screen overlay).
There's no way to:
- See the cron job description/prompt at a glance
- Browse skills of the agent this cron is assigned to
- Reference or drag a skill directly into the cron's prompt

### Feature: Cron Detail Panel (right-side split layout)

Change the Crons view to a master-detail layout:
```
┌──────────────────┬─────────────────────────────────┐
│  Cron list       │  Detail panel (selected cron)   │
│  (left ~40%)     │  (right ~60%)                   │
│                  │  - Name, description, agent      │
│  > daily-review  │  - Schedule (cron expr / every) │
│    kb-maint  ●   │  - Full prompt (editable inline) │
│    signal-map    │  - Last run / next run / status  │
│                  │  - [Save changes] button         │
└──────────────────┴─────────────────────────────────┘
```

Click a cron card on the left → right panel shows its details.
Inline editing of the prompt (textarea, not modal).
Save without leaving the view.

### Feature: Agent Skills Browser in Detail Panel

Below the prompt in the detail panel, show a "Skills" browser for the agent
this cron is assigned to:
- Shows all skills that agent has (from their workspace/skills dir)
- Each skill is a draggable pill
- Drag a skill pill into the prompt textarea → inserts `[skill: skill-name]` reference
- Or click the pill → appends skill name to the prompt
- This makes it easy to say "use the laniameda-kb skill" in the cron prompt

### Implementation notes
- Left list: cron cards (current), click → set selectedJobId state
- Right panel: new CronDetail.tsx component, reads selectedJob from state
- Prompt textarea: plain contenteditable or textarea, auto-resize
- Skills: fetch from /api/tree, find agent by agentId, render skill pills
- Save: PATCH /api/crons/:id (already exists)

### Priority: HIGH (v0.4, after Team Builder MVP)

---

## [IDEA] Telegram Mini App — v0.6+

### Concept
Agent Hub as a Telegram Mini App — users manage their agents and skills from within Telegram, without opening a browser.

### Why it makes sense
- OpenClaw users are already in Telegram (it's the primary chat interface)
- Zero friction — tap the bot, get your agent dashboard instantly
- Mobile-first: read SOUL.md, check cron status, trigger a cron manually, edit a quick prompt
- Consistent with the distribution model: "runs where OpenClaw is, accessed from where you are"

### What it could include (MVP)
- View agents list + their files (read-only on mobile, tap to read)
- Toggle crons on/off
- Trigger a cron job manually
- Quick-edit a single file (SOUL.md, HEARTBEAT.md, etc.)
- View last run status of crons

### Implementation approach
- Telegram Mini App = React SPA embedded in Telegram WebView
- Same Vite build, separate entry point (e.g. `client/src/mini-app/`)
- Connects to same Express API (uses same auth cookie or token)
- Bot handles /start → opens mini app via InlineKeyboard + WebApp.url
- Separate from main desktop UI — optimized for small screen + touch

### Notes
- Mini Apps support full HTML/CSS/JS — can reuse component library
- Telegram provides user identity (no separate login needed if bot is trusted)
- Could replace the --tunnel flag for mobile access completely
- Worth building after npm publish + cron detail panel

### Priority: LOW-MED (v0.6+, after core features solid)

---

## [HIGH] Notion-style Rich Text Editor for .md files — v0.4

### Problem
Right now all files open in CodeMirror — a code editor that shows raw markdown
symbols (`#`, `**`, `-`, ` ``` `). This is friction when editing SOUL.md,
USER.md, AGENTS.md, PM files — these are prose, not code.

### Solution: TipTap rich text editor for .md files

Use **TipTap** (ProseMirror-based, MIT, used by Vercel/Linear/etc.):
- Type like Notion: no visible `#` or `**` — just formatting that renders in place
- Markdown shortcuts still work: type `# ` → becomes a heading, `**bold**` → bold
- Serializes back to .md on save (lossless round-trip)
- Headless: we style it with our design system

**Behavior:**
- File extension `.md` → TipTap RichEditor
- All other files → CodeMirror (unchanged)

**Features in scope:**
- Headings (H1–H3), bold, italic, code inline, code blocks
- Bullet lists, ordered lists, blockquotes
- Links
- Markdown shortcuts (type `## ` → H2, `- ` → bullet, ` ``` ` → code block)
- Placeholder text ("Start writing...")
- Same dirty/save flow as CMEditor (marks dirty on change, saves on Cmd+S)

**Implementation:**
```
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
npm install @tiptap/extension-markdown  (or remark for md serialization)
```

- New component: `client/src/components/Editor/RichEditor.tsx`
- `Pane.tsx`: if `pane.path.endsWith('.md')` → `<RichEditor>` else → `<CMEditor>`
- `RichEditor` same interface as `CMEditor`: takes `content`, `onDirty`, `onSave`

**Styling (design system):**
- `.ProseMirror h1` → 22px 700 ink, border-bottom 2px
- `.ProseMirror h2` → 17px 700 ink
- `.ProseMirror p` → 14px 1.7 line-height, text-secondary
- `.ProseMirror code` → JetBrains Mono, accent-subtle bg, 2px border
- `.ProseMirror pre` → code block with 2px border, ink shadow, mono font
- `.ProseMirror ul/ol` → indented, marker color coral
- `.ProseMirror blockquote` → 2px coral left border, indent

### Also applies to: Cron prompt textarea
The `CronDetail` prompt field could optionally use the same TipTap editor
(just don't show heading options) — but plain textarea is fine for v0.4 MVP.

### Priority: HIGH (v0.4, alongside cron detail panel)

---

## [VISION] Agent Chat + Live Edit Stream — v0.5

### The concept
An agent chat sidebar inside Agent Hub. You type a prompt → it spawns Claude CLI
or Codex CLI under the hood → streams the response to the UI → file changes appear
as a branded GitHub-style diff view in real time.

### Why it matters
Right now the options for managing agent files are:
1. **Telegram** — black box. Agent does stuff, you have no visibility. Hope it worked.
2. **Terminal** — same black box, but you also need multiple windows + a code editor open.
3. **Agent Hub (today)** — manual editing. You control everything but it's all on you.

This feature adds option 4:
**Agent Hub + Chat** — you ask, the agent executes, you see every file change live,
you approve/reject diffs, you stay in control. Not a black box. Not a terminal.

### What it looks like

```
┌──────────────────────────────┬──────────────────────────┐
│  Editor (files, panes)       │  Agent Chat              │
│                              │  ──────────────────────  │
│  [file content]              │  You: "Update my SOUL.md │
│                              │  to add voice storytelling│
│                              │  as a core skill"         │
│                              │                          │
│                              │  Agent: Analyzing...     │
│                              │  ↳ Reading SOUL.md       │
│                              │  ↳ Planning changes      │
│                              │                          │
│                              │  ┌─ SOUL.md ──────────┐  │
│                              │  │ - Sharp. Technical. │  │
│                              │  │ + Sharp. Technical. │  │
│                              │  │ + Voice storyteller.│  │
│                              │  └────────────────────┘  │
│                              │  [✓ Apply] [✗ Reject]    │
└──────────────────────────────┴──────────────────────────┘
```

### Under the hood
- Server spawns `claude --dangerously-skip-permissions -p "..."` or `codex exec`
  as a child process, piped to stdout
- SSE stream from `/api/chat/stream` → client renders tokens in real time
- Agent output parsed for file operations (create/edit/delete patterns)
- Diffs computed server-side: before/after for each changed file
- Client renders branded diff view (coral = additions, muted = deletions, 2px borders)
- User approves or rejects each file change individually

### Why this is Cursor for AI agents
- Cursor = IDE where AI edits code files + you see diffs + you approve
- Agent Hub + Chat = workspace where AI edits agent config/skills/md files + you see diffs + you approve
- The files are different (SOUL.md, cron jobs, skills) but the pattern is identical
- The user stays in control: black box → transparent execution

### The product vision
Agent Hub is becoming the **agentic team OS**:
- **Files view** = workspace browser (what exists)
- **Crons view** = automation scheduler (what runs)
- **Team view** = org chart builder (who does what) [v0.4]
- **Chat view** = collaborative execution (do this now) [v0.5]

For OpenClaw users specifically: this is the missing GUI layer.
OpenClaw gives you agents. Agent Hub gives you a cockpit.

### Priority: LOW-HIGH (v0.5 — after Team Builder)
Tied directly to the Team Builder vision. Implement after v0.4 is solid.
