---
name: agent-hub-setup
description: >
  Set up Agent Hub from scratch on any machine — local dev (macOS/Linux) or VPS with Docker.
  Use when the user wants to install, configure, or deploy Agent Hub, the self-hosted web
  editor for AI agent instruction files and skills. Handles: cloning the repo, detecting
  existing OpenClaw workspaces, generating agent-hub.config.json, setting up Docker or
  bare Node.js, linking a Studio/HQ directory, and verifying the server runs correctly.
  Also use when the user wants to reconfigure Agent Hub, add new workspaces, link new
  directories, or troubleshoot Agent Hub not finding their agents/skills.
---

# Agent Hub Setup

Before starting, read [references/project-overview.md](references/project-overview.md) for full context on what Agent Hub is, the repo structure, tech stack, API endpoints, and workspace file structure.

Set up Agent Hub from zero to running server. Follow the six phases in order. Skip phases that are already complete (e.g., if the repo is already cloned, skip Phase 2).

## Phase 1: Detect Environment

Gather facts before making any changes.

```bash
# OS and user
uname -s          # Darwin = macOS, Linux = Linux
whoami            # root on VPS, username on local
echo $HOME

# Runtime
node --version    # need 18+
docker --version  # optional, needed for Docker mode
git --version

# Existing OpenClaw installation
ls -d ~/.openclaw 2>/dev/null
ls -d ~/.openclaw/workspace* 2>/dev/null
ls -d ~/.agents/skills 2>/dev/null

# Existing Agent Hub
ls -d ~/work/agent-hub 2>/dev/null || ls -d /root/work/agent-hub 2>/dev/null
```

Determine **deployment mode** based on findings:
- **Docker mode**: VPS/server, Docker available, headless — use Docker Compose
- **Node.js mode**: Local dev, macOS, want hot-reload — run `npm run dev` directly

## Phase 2: Clone & Build

Skip if repo already exists.

```bash
# Choose install location
# VPS: /root/work/agent-hub
# Local: ~/work/agent-hub (or wherever user prefers)
git clone https://github.com/Michailbul/agent-hub.git <install-path>
cd <install-path>
npm install
cd client && npm install && cd ..
npm run build
```

Verify build succeeded:
```bash
ls dist/server.js dist/cli.js    # server compiled
ls dist-client/index.html         # client compiled
```

## Phase 3: Discover Workspaces & Skills

Scan the filesystem to understand what Agent Hub will manage.

### 3a: Find OPENCLAW_ROOT

Check these paths in order — first one containing `workspace*` directories wins:

1. `$HOME/.openclaw` (standard)
2. `/root/.openclaw` (root user)
3. `/data/openclaw` (Docker)

```bash
# Find the openclaw root
for dir in "$HOME/.openclaw" "/root/.openclaw" "/data/openclaw"; do
  if [ -d "$dir" ] && ls -d "$dir"/workspace* >/dev/null 2>&1; then
    echo "OPENCLAW_ROOT=$dir"
    break
  fi
done
```

### 3b: Discover agents

List workspace directories and read their identities:
```bash
ls -d ${OPENCLAW_ROOT}/workspace* 2>/dev/null
# For each workspace, check for IDENTITY.md:
cat ${OPENCLAW_ROOT}/workspace-*/IDENTITY.md 2>/dev/null
```

Agent Hub reads these fields from IDENTITY.md:
```markdown
**Name:** Agent Name
**Emoji:** 🤖
**Role:** Role Description
```

### 3c: Find skill directories

```bash
ls ~/.agents/skills/ 2>/dev/null | head -20     # Shared skills (.agents ecosystem)
ls ~/.openclaw/skills/ 2>/dev/null | head -20   # OpenClaw skills
ls ~/.claude/skills/ 2>/dev/null | head -20     # Claude Code skills
ls ~/.codex/skills/ 2>/dev/null | head -20      # Codex skills
```

### 3d: Check for HQ directories

Ask the user if they have headquarters or context directories they want Agent Hub to display. HQ folders are linked via the UI (Headquarters view → Link Folder) or via API — they're not auto-discovered.

## Phase 4: Generate Configuration

Decide whether a config file is needed. See [references/config-schema.md](references/config-schema.md) for the full schema.

### When NO config file is needed

If all these are true, skip config — auto-discovery handles everything:
- Workspaces live under `~/.openclaw/workspace-*`
- Skills live under `~/.agents/skills/`, `~/.openclaw/skills/`, `~/.claude/skills/`, and/or `~/.codex/skills/`
- HQ folders will be linked via the UI (no config needed)

Just set env vars:
```bash
export HUB_PASSWORD="<ask-user-for-password>"
export OPENCLAW_ROOT="<discovered-path>"  # only if non-standard
```

### When config IS needed

Create the config file if the user has non-standard paths:

```bash
mkdir -p ~/.openclaw/agent-hub
```

Then write `~/.openclaw/agent-hub/agent-hub.config.json`. See [references/config-schema.md](references/config-schema.md) for examples. Key rules:

- Only include `agents` array if you need to override auto-discovery
- For Docker: use `/data/` paths (matching volume mounts), not host paths
- For bare metal: use absolute filesystem paths
- HQ folders are managed via the UI, not the config file

### Docker config note

When running in Docker, the config file paths must match the **container paths** (the right side of volume mounts), not the host paths. Example:

Host: `/root/.openclaw` → Container: `/data/openclaw`

So the config says `"/data/openclaw"`, not `"/root/.openclaw"`.

## Phase 5: Set Up Server

### Option A: Docker Compose (VPS / production)

Create `docker-compose.yml` in the repo directory:

```yaml
services:
  agent-hub:
    build: .
    ports:
      - "4001:4001"
    restart: unless-stopped
    environment:
      HUB_PASSWORD: "<user-chosen-password>"
      OPENCLAW_ROOT: "/data/openclaw"
      AGENTS_SKILLS_ROOT: "/data/agents/skills"
      NODE_ENV: "production"
      # GEMINI_API_KEY: "<optional-for-semantic-search>"
    volumes:
      - <host-openclaw-root>:/data/openclaw
      - <host-agents-dir>:/data/agents
```

Replace `<placeholders>` with actual paths discovered in Phase 3.

If the user has a reverse proxy (Traefik, nginx), add appropriate labels/config. Agent Hub listens on a single port (4001).

Start the container:
```bash
docker compose up -d --build
```

### Option B: Bare Node.js (local dev)

```bash
cd <repo-path>
export HUB_PASSWORD="<password>"
# Only set these if non-standard paths:
# export OPENCLAW_ROOT="<path>"
# export AGENTS_SKILLS_ROOT="<path>"
npm run dev    # development with hot-reload
# or
npm start      # production (serves compiled build)
```

`npm run dev` runs both the TypeScript server (with watch) and the Vite client dev server concurrently.

## Phase 6: Verify

### 6a: Check server is running

```bash
# For Docker:
docker compose logs --tail=20
# Look for: "Agents: <list>" and "Allowed roots: <count>"

# For Node.js: check terminal output
```

### 6b: Hit the API

```bash
# Setup status (should show needsSetup: false)
curl -s http://localhost:4001/api/setup/status

# Agent tree (should list discovered agents and skills)
curl -s -b "agent_hub_auth=<password>" http://localhost:4001/api/tree | head -100
```

### 6c: Open in browser

- Local: `http://localhost:4001`
- VPS: `http://<server-ip>:4001` or the reverse proxy URL

Log in with the password set in HUB_PASSWORD.

### 6d: Verify agents appear

In the UI, confirm:
- **Canvas view:** All agents appear as nodes with correct names and emojis
- **Skills Lab:** Skills are listed with pillar classifications (Build, Design, Write, etc.)
- **Skills Lab tabs:** .openclaw and .claude tabs show ecosystem-scoped skills
- **Headquarters:** HQ folders can be linked via the Link Folder dialog (supports native file picker on macOS)
- Clicking an agent opens the inspector showing its instruction files

Report the results to the user.

## Troubleshooting

### No agents appear
- Check OPENCLAW_ROOT points to a directory with `workspace-*` subdirectories
- In Docker: verify volume mounts map correctly
- Check server logs for `[auto-heal]` messages

### Skills not found
- Verify skill directories contain `SKILL.md` files (not just loose files)
- Check `~/.agents/skills/` exists and has subdirectories
- In Docker: verify the `~/.agents` volume mount

### HQ folders not showing
- HQ folders are linked via the UI (Headquarters → Link Folder), not via config
- Config is stored at `~/.openclaw/agent-hub/hq.config.json`
- Use the native file picker (Choose button) or the in-app browser (Browse button)

### Auth issues
- Default password is `changeme` — always override with HUB_PASSWORD
- Cookie name: `agent_hub_auth`, max-age 7 days
- Clear browser cookies if login stops working after password change

### Server won't start
- Check Node.js 18+ (`node --version`)
- Check port 4001 isn't in use (`lsof -i :4001`)
- Check `dist/server.js` exists (run `npm run build` if not)
- In Docker: check `docker compose logs` for error details

## References

- **Project overview**: See [references/project-overview.md](references/project-overview.md) for what Agent Hub is, repo structure, tech stack, full API endpoint list, workspace file structure, security model, and deployment workflow
- **Config format**: See [references/config-schema.md](references/config-schema.md) for full schema with Docker and bare-metal examples
- **Path resolution**: See [references/path-resolution.md](references/path-resolution.md) for exact auto-discovery logic from the server source code
