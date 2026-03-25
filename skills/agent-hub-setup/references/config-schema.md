# Agent Hub Configuration Schema

## When Config Is Needed

Agent Hub works **zero-config** for standard setups. Only create `agent-hub.config.json` when:
- You have non-standard paths for workspaces or skills
- You want to explicitly name skill libraries differently
- You're linking directories outside the standard roots

If workspaces live under `~/.openclaw/workspace-*` and skills under `~/.agents/skills/`, `~/.openclaw/skills/`, `~/.claude/skills/`, or `~/.codex/skills/`, you don't need a config file. HQ folders are linked via the UI, not the config file.

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

Paths support `~` expansion (resolved to `$HOME` at runtime).

---

## Additional Config Files

These are managed via the UI or API, not manually:

| File | Location | Purpose |
|---|---|---|
| HQ config | `~/.openclaw/agent-hub/hq.config.json` | Linked HQ folders (managed via Headquarters UI) |
| Starred skills | `~/.openclaw/agent-hub/starred-skills.config.json` | Starred/favorited skills |
| Skill pillars | `~/.openclaw/agent-hub/skill-pillars.config.json` | Custom pillar definitions (optional, falls back to defaults) |
| Skill classifications | `~/.openclaw/agent-hub/skill-classifications.json` | Agent-generated skill metadata |
| Skills repos | `~/.openclaw/agent-hub/skills-repos.config.json` | Linked skill git repos |

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
  ]
}
```

Matching `docker-compose.yml` volumes:
```yaml
volumes:
  - /root/.openclaw:/data/openclaw
  - /root/.agents:/data/agents
```

---

## Example: Bare Metal (Local Dev)

No Docker — paths are native filesystem paths:

```json
{
  "openclawRoot": "/Users/michael/.openclaw",
  "agentsSkillsRoot": "/Users/michael/.agents/skills"
}
```

When `agents` array is omitted, auto-discovery runs and finds all `workspace-*` dirs under the openclawRoot. HQ folders are linked via the Headquarters UI.

---

## Example: Minimal (Zero Config)

No config file needed if:
- `~/.openclaw/` exists with `workspace-*` directories
- Skill directories exist at standard paths (`~/.agents/skills/`, `~/.openclaw/skills/`, `~/.claude/skills/`, `~/.codex/skills/`)

Agent Hub will auto-discover everything. Just set the env vars:
```bash
export HUB_PASSWORD="your-password"
# OPENCLAW_ROOT and AGENTS_SKILLS_ROOT are auto-discovered
npm start
```
