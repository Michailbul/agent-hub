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
