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
