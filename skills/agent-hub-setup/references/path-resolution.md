# Agent Hub Path Resolution & Auto-Discovery

Exact logic extracted from `src/server.ts`. Use this to understand what the server will do automatically, so you only need to configure what auto-discovery can't find.

---

## Config Loading Priority

```
1. Config file (if exists at CONFIG_PATH)
   └─ Default: ~/.openclaw/agent-hub/agent-hub.config.json
   └─ Override: CONFIG_PATH env var

2. Environment variables (OPENCLAW_ROOT, AGENTS_SKILLS_ROOT)

3. Auto-discovery (scan filesystem for standard paths)
```

If a config file exists and has an `agents` array, auto-discovery is skipped entirely. The config becomes the sole source of truth.

---

## OPENCLAW_ROOT Resolution

Function: `resolveOpenclawRoot()`

### Step 1 — Check explicit config
```
process.env.OPENCLAW_ROOT  OR  config.openclawRoot
→ If path exists on disk → use it immediately
```

### Step 2 — Scan candidates in order
```
1. ${explicit}              (configured path, even if wrong)
2. ${HOME}/.openclaw        (standard user install)
3. /root/.openclaw          (root user on Linux)
4. /data/openclaw           (Docker default)
5. /home/user/.openclaw     (Linux non-root user)
6. ${HOME}/openclaw         (alternative layout)
```

For each candidate:
- Check if directory exists
- Check if it contains any entry starting with `workspace`
- First match with workspaces wins

### Step 3 — Fallbacks
- If no candidate has workspaces: return first candidate that exists
- If nothing exists: return explicit path or `/data/openclaw`

---

## AGENTS_SKILLS_ROOT Resolution

Function: `resolveAgentsSkillsRoot(openclawRoot)`

### Step 1 — Check explicit config
```
process.env.AGENTS_SKILLS_ROOT  OR  config.agentsSkillsRoot
→ If path exists on disk → use it immediately
```

### Step 2 — Scan candidates in order
```
1. ${explicit}
2. ${HOME}/.agents/skills
3. /root/.agents/skills
4. /data/agents/skills
5. ${OPENCLAW_ROOT}/agent-skills
```

First existing directory wins. Fallback: explicit path or `/data/agents/skills`.

---

## Agent Discovery

Function: `discoverAgents(openclawRoot)`

Only runs when config file has no `agents` array.

### Process
1. List all directories in OPENCLAW_ROOT that start with `workspace`
2. For each directory:
   - Extract agent ID: `workspace-meda` → `meda`, `workspace` → `main`
   - Read `IDENTITY.md` if it exists, parsing:
     - `**Name:** <value>` → agent label
     - `**Emoji:** <value>` → emoji (max 4 chars, default `🤖`)
     - `**Role:** <value>` → role description
   - Fallback label: capitalize the agent ID
3. Each agent gets:
   - `root`: the workspace directory path
   - `skillsRoot`: `${workspace}/skills`
   - `files`: `[SOUL.md, MISSION.md, IDENTITY.md, USER.md, AGENTS.md, HEARTBEAT.md, TOOLS.md]`
   - `memoryFiles`: `[MEMORY.md]`
   - `pmFiles`: `[pm/vision.md, pm/backlog.md, pm/problems.md]`

---

## Skill Source Discovery

Function: `buildSkillSourceDescriptors()`

Scans these locations in priority order (lower number = higher priority):

| Priority | ID | Label | Path |
|---|---|---|---|
| 0 | `agents` | Shared Skills | `${HOME}/.agents/skills` |
| 1 | `agent-cli` | Agent Skills | `${HOME}/.agent/skills` |
| 0 | `agents-config` | Shared Skills | `${AGENTS_SKILLS_ROOT}` (from config/env) |
| 2 | `codex` | Codex Skills | `${HOME}/.codex/skills` |
| 3 | `cursor` | Cursor Skills | `${HOME}/.cursor/skills` |
| 4 | `cursor-bootstrap` | Cursor Bootstrap | `${HOME}/.cursor/skills-cursor` |
| 5 | `claude` | Claude Skills | `${HOME}/.claude/skills` |
| 6 | `openclaw-library` | OpenClaw Skills | `${OPENCLAW_ROOT}/skills` |
| 10+ | `workspace-{id}` | {Agent} Workspace | `${workspace}/skills` |

Only paths that exist on disk are included. Duplicate resolved paths are deduplicated.

### Skill directory structure
Each skill source is scanned for directories containing `SKILL.md`:
- Direct: `${source}/skill-name/SKILL.md`
- Nested (one level): `${source}/folder/skill-name/SKILL.md`
- Directories starting with `.` or containing `.bak.` are skipped

---

## ALLOWED_ROOTS (Security Whitelist)

Built from the union of:
- All agent `root` paths
- All agent `skillsRoot` paths
- All skill library roots
- Studio root (if configured)
- `AGENTS_SKILLS_ROOT`
- `OPENCLAW_SKILLS_ROOT` (`${OPENCLAW_ROOT}/skills`)
- All roots from `buildSkillSourceDescriptors()`

Every file read/write operation is validated against this whitelist via `isAllowed(filePath)`. A path is allowed if it equals or is a child of any allowed root.

---

## initAgents() — Full Initialization Flow

```
If CONFIG has agents array:
  → Use config agents (expand ~ in paths)
  → Use config skillLibraries
  → Use config studio
Else:
  → Run discoverAgents(OPENCLAW_ROOT)
  → Create default skill libraries:
      - Custom Skills → AGENTS_SKILLS_ROOT
      - System Skills → OPENCLAW_SKILLS_ROOT
  → Studio = null (only available via config)

Then: Build ALLOWED_ROOTS from all discovered paths
```

---

## Environment Variables Summary

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `4001` | HTTP port |
| `HUB_PASSWORD` | `changeme` | Login password (MUST change in production) |
| `OPENCLAW_ROOT` | auto-discovered | Root containing `workspace-*` dirs |
| `AGENTS_SKILLS_ROOT` | auto-discovered | Shared skills directory |
| `CONFIG_PATH` | `~/.openclaw/agent-hub/agent-hub.config.json` | Config file location |
| `HOME` | system default | Used for `~` expansion |
