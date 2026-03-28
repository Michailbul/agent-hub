# Agent Hub

> A self-hosted web editor for AI agent instruction files, skills, and context docs.

Built for [OpenClaw](https://openclaw.ai) users — but works with any AI agent setup that uses markdown files for instructions.

## What it does

- Browse all your agents and their instruction files (SOUL.md, MISSION.md, MEMORY.md, etc.)
- Edit files in a multi-pane CodeMirror 6 editor (VSCode-style tabs, split view)
- Skills Lab — browse, filter, copy, move, and delete skills across agents
- Right-click context menu: copy/move/delete skills between agent workspaces
- Filter skills by source: **Studio** (yours) / **Community** (downloaded) / **System** (built-in)
- Focus timer (Pomodoro-style, 25/45/60/90m)
- Password protected, runs locally or on a VPS

## Install

```bash
npm install -g @laniameda/agent-hub
agent-hub
```

Open http://localhost:4001

## Quick start — Docker

```bash
docker run -d \
  -p 4001:4001 \
  -e HUB_PASSWORD=your-password \
  -e OPENCLAW_ROOT=/data/openclaw \
  -v ~/.openclaw:/data/openclaw \
  -v ~/.agents:/data/agents \
  --name agent-hub \
  ghcr.io/michailbul/agent-hub:latest
```

## Docker Compose

```bash
cp docker-compose.example.yml docker-compose.yml
# edit docker-compose.yml with your paths and password
docker compose up -d
```

## Running from source

```bash
git clone https://github.com/Michailbul/agent-hub
cd agent-hub
npm install
cd client && npm install && cd ..
npm run build
npm start
```

For development with hot reload:

```bash
npm run dev
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
| `HUB_AUTH` | *(unset)* | Set to `true` to force auth in dev mode |
| `GEMINI_API_KEY` | *(unset)* | Google Gemini key for semantic skill search |

See `.env.example` for a copy-paste template.

## VPS + Traefik (SSL)

See `docker-compose.example.yml`. Agent Hub is designed to run behind Traefik with Let's Encrypt.

## Tech stack

- **Client:** React 19, Vite 7, TailwindCSS v4, Zustand
- **Editor:** CodeMirror 6 (markdown mode) + Tiptap (rich text)
- **Server:** Node.js + Express, TypeScript
- **Auth:** Cookie-based session (httpOnly)

## Security

- All file operations validate against a whitelist of allowed roots
- No path traversal possible — every read/write checks `isAllowed()`
- Designed for local network / VPN / private VPS use
- Not recommended to expose to the public internet without additional auth

## License

MIT
