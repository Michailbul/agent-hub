# Agent Hub

> A self-hosted web editor for AI agent instruction files, skills, and context docs.

Built for [OpenClaw](https://openclaw.ai) users — but works with any AI agent setup that uses markdown files for instructions.

![Agent Hub Screenshot](https://agent-hub.srv1439489.hstgr.cloud)

## What it does

- Browse all your agents and their instruction files (SOUL.md, MISSION.md, MEMORY.md, etc.)
- Edit files directly in a multi-pane CodeMirror editor (VSCode-style)
- Browse, filter, copy, move, and delete skills across agents
- Drag files between panes to compare/edit side-by-side
- Right-click context menu: copy/move/delete skills between agent workspaces
- Filter skills by source: **Studio** (yours) / **Community** (downloaded) / **System** (built-in)
- Focus timer (Pomodoro-style, 25/45/60/90m)
- Password protected, runs locally or on a VPS

## Quick start — Docker

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

Open http://localhost:4001

## Docker Compose

```bash
cp docker-compose.example.yml docker-compose.yml
# edit docker-compose.yml with your paths and password
docker compose up -d
```

## Auto-discovery (zero config for OpenClaw users)

Point `OPENCLAW_ROOT` at your OpenClaw directory and Agent Hub will:
- Scan for `workspace-*/` directories automatically
- Read `IDENTITY.md` from each workspace for name, emoji, and role
- Discover skill libraries in `~/.openclaw/skills/` and `~/.agents/skills/`

No config file needed.

## Manual config

For custom setups, create `agent-hub.config.json` (see `agent-hub.config.example.json`):

```json
{
  "agents": [
    {
      "id": "myagent",
      "label": "My Agent",
      "emoji": "🤖",
      "role": "Assistant",
      "root": "/data/openclaw/workspace-myagent",
      "files": ["SOUL.md", "MISSION.md", "MEMORY.md"],
      "skillsRoot": "/data/openclaw/workspace-myagent/skills"
    }
  ],
  "skillLibraries": [
    { "id": "custom", "label": "Custom Skills", "emoji": "🧩", "root": "/data/agents/skills" }
  ]
}
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `HUB_PASSWORD` | `changeme` | Login password |
| `PORT` | `4001` | HTTP port |
| `OPENCLAW_ROOT` | `/data/openclaw` | OpenClaw root dir |
| `AGENTS_SKILLS_ROOT` | `/data/agents/skills` | Custom skills dir |
| `CONFIG_PATH` | `./agent-hub.config.json` | Path to config file |

## Running without Docker

```bash
git clone https://github.com/laniameda/agent-hub
cd agent-hub
npm install
HUB_PASSWORD=mypass OPENCLAW_ROOT=~/.openclaw node server.js
```

## VPS + Traefik (SSL)

See `docker-compose.example.yml`. Agent Hub is designed to run behind Traefik with Let's Encrypt. The server serves everything on a single port — no build step needed.

## Tech stack

- **Server:** Node.js + Express (no framework bloat)
- **Editor:** CodeMirror 5 (markdown mode)
- **UI:** Vanilla JS + CSS — no bundler, no React, ships as two files
- **Auth:** Cookie-based session (httpOnly:false for JS detection)

## Security

- All file operations validate against a whitelist of allowed roots
- No path traversal possible — every read/write checks `isAllowed()`
- Designed for local network / VPN / private VPS use
- Not recommended to expose to the public internet without additional auth

## License

MIT
