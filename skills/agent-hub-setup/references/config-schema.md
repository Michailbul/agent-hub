# Agent Hub Configuration Schema

## When Config Is Needed

Agent Hub works **zero-config** for standard OpenClaw setups. Only create `agent-hub.config.json` when:
- You want to add a Studio/HQ directory (not auto-discoverable)
- You have non-standard paths for workspaces or skills
- You want to explicitly name skill libraries differently
- You're linking directories outside the standard OpenClaw root

If all workspaces live under `~/.openclaw/workspace-*` and skills under `~/.agents/skills/`, you don't need a config file.

---

## Config File Location

Default: `~/.openclaw/agent-hub/agent-hub.config.json`

Override: `CONFIG_PATH` environment variable

The parent directory `~/.openclaw/agent-hub/` must exist. Create it if needed:
```bash
mkdir -p ~/.openclaw/agent-hub
```

---

## Full Schema

```json
{
  "openclawRoot": "/path/to/openclaw",
  "agentsSkillsRoot": "/path/to/shared/skills",
  "agents": [
    {
      "id": "string (required)",
      "label": "string (required)",
      "emoji": "string (max 4 chars, default: 🤖)",
      "role": "string (default: Agent)",
      "root": "string (required, absolute path to workspace dir)",
      "files": ["SOUL.md", "MISSION.md", "..."],
      "skillsRoot": "string (path to this agent's skills dir)"
    }
  ],
  "skillLibraries": [
    {
      "id": "string (required)",
      "label": "string (required)",
      "emoji": "string",
      "root": "string (required, absolute path)"
    }
  ],
  "studio": {
    "id": "string (required)",
    "label": "string (required)",
    "emoji": "string",
    "root": "string (required, absolute path)",
    "files": ["file1.md", "file2.md"]
  }
}
```

### Field Details

#### Top-level

| Field | Type | Required | Description |
|---|---|---|---|
| `openclawRoot` | string | No | Overrides OPENCLAW_ROOT env var / auto-discovery |
| `agentsSkillsRoot` | string | No | Overrides AGENTS_SKILLS_ROOT env var / auto-discovery |
| `agents` | array | No | If present, disables auto-discovery entirely |
| `skillLibraries` | array | No | Custom skill library definitions |
| `studio` | object | No | HQ/studio directory (only way to add one) |

#### Agent Object

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique identifier (e.g., `main`, `meda`, `persey`) |
| `label` | string | Yes | Display name in the UI |
| `emoji` | string | No | Max 4 chars. Default: `🤖` |
| `role` | string | No | Role description. Default: `Agent` |
| `root` | string | Yes | Absolute path to workspace directory |
| `files` | string[] | No | Instruction files to display. Default: `[SOUL.md, MISSION.md, IDENTITY.md, USER.md, AGENTS.md, HEARTBEAT.md, TOOLS.md]` |
| `skillsRoot` | string | No | Path to agent's local skills. Default: `${root}/skills` |

#### Skill Library Object

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique identifier |
| `label` | string | Yes | Display name |
| `emoji` | string | No | Icon emoji |
| `root` | string | Yes | Absolute path to skills directory |

#### Studio Object

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique identifier (typically `studio`) |
| `label` | string | Yes | Display name (e.g., `Studio HQ`, `Headquarters`) |
| `emoji` | string | No | Icon emoji |
| `root` | string | Yes | Absolute path to studio directory |
| `files` | string[] | No | Files to display in the studio panel |

Paths support `~` expansion (resolved to `$HOME` at runtime).

---

## Example: Docker VPS Setup

Volumes map host paths into `/data/` inside the container:

```json
{
  "openclawRoot": "/data/openclaw",
  "agentsSkillsRoot": "/data/agents/skills",
  "agents": [
    {
      "id": "main",
      "label": "Lani",
      "emoji": "🦊",
      "role": "Chief of Staff",
      "root": "/data/openclaw/workspace",
      "files": ["SOUL.md", "MISSION.md", "IDENTITY.md", "USER.md", "AGENTS.md", "MEMORY.md"],
      "skillsRoot": "/data/openclaw/workspace/skills"
    },
    {
      "id": "meda",
      "label": "Meda",
      "emoji": "📣",
      "role": "Marketing CMO",
      "root": "/data/openclaw/workspace-meda",
      "files": ["SOUL.md", "MISSION.md", "IDENTITY.md", "AGENTS.md", "MEMORY.md"],
      "skillsRoot": "/data/openclaw/workspace-meda/skills"
    }
  ],
  "skillLibraries": [
    { "id": "shared", "label": "Shared Skills", "emoji": "🧩", "root": "/data/agents/skills" },
    { "id": "openclaw", "label": "OpenClaw Skills", "emoji": "🔧", "root": "/data/openclaw/skills" }
  ],
  "studio": {
    "id": "studio",
    "label": "Headquarters",
    "emoji": "🏢",
    "root": "/data/studio",
    "files": ["vision.md", "projects.md", "roadmap.md"]
  }
}
```

Matching `docker-compose.yml` volumes:
```yaml
volumes:
  - /root/.openclaw:/data/openclaw
  - /root/.agents:/data/agents
  - /root/work/laniameda/laniameda-hq:/data/studio
```

---

## Example: Bare Metal (Local Dev)

No Docker — paths are native filesystem paths:

```json
{
  "openclawRoot": "/Users/michael/.openclaw",
  "agentsSkillsRoot": "/Users/michael/.agents/skills",
  "studio": {
    "id": "studio",
    "label": "Laniameda HQ",
    "emoji": "🏢",
    "root": "/Users/michael/work/laniameda/laniameda-hq",
    "files": ["vision.md", "roadmap.md"]
  }
}
```

When `agents` array is omitted, auto-discovery runs and finds all `workspace-*` dirs under the openclawRoot. This is the recommended approach for local dev — only add studio since it can't be auto-discovered.

---

## Example: Minimal (Zero Config)

No config file needed if:
- `~/.openclaw/` exists with `workspace-*` directories
- `~/.agents/skills/` exists with skill directories
- No studio/HQ directory needed

Agent Hub will auto-discover everything. Just set the env vars:
```bash
export HUB_PASSWORD="your-password"
# OPENCLAW_ROOT and AGENTS_SKILLS_ROOT are auto-discovered
npm start
```
