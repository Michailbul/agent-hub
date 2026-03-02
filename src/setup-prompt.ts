export const SETUP_PROMPT = `
You are setting up Agent Hub — a self-hosted web editor for AI agent workspaces.
Your job: scan this machine, detect OpenClaw agent workspaces and skill libraries, then write a valid configuration file.

CONFIG FILE PATH: {{CONFIG_PATH}}

## Steps — follow in order

### 1. Check OpenClaw root
Run: ls -la ~/.openclaw/

### 2. Scan agent workspaces
For each directory matching ~/.openclaw/workspace-*/:
- Read IDENTITY.md if it exists (extract Name, Emoji, Role fields using grep or cat)
- Check which files exist from: SOUL.md MISSION.md MEMORY.md USER.md AGENTS.md HEARTBEAT.md TOOLS.md IDENTITY.md
- Check if skills/ subdirectory exists

### 3. Scan skill libraries
Run: ls ~/.agents/skills/ 2>/dev/null
Run: ls ~/.openclaw/skills/ 2>/dev/null

### 4. Detect studio/HQ (optional)
Look in ~/work/ for a directory containing vision.md, projects.md, or identity.md

### 5. Write config file
Create parent directories if needed. Write valid JSON to {{CONFIG_PATH}}:
{
  "openclawRoot": "/absolute/expanded/path/.openclaw",
  "agentsSkillsRoot": "/absolute/expanded/path/.agents/skills",
  "agents": [
    {
      "id": "dirname-without-workspace-prefix (workspace alone becomes main)",
      "label": "Name from IDENTITY.md or capitalized dirname",
      "emoji": "emoji from IDENTITY.md or 🤖",
      "role": "Role from IDENTITY.md or Agent",
      "root": "/absolute/path/to/workspace-xxx",
      "files": ["only files that EXIST from standard list"],
      "skillsRoot": "/path/skills if exists, else omit this field"
    }
  ],
  "skillLibraries": [
    { "id": "custom", "label": "Custom Skills", "emoji": "🧩", "root": "/abs/.agents/skills" },
    { "id": "system", "label": "System Skills",  "emoji": "🔧", "root": "/abs/.openclaw/skills" }
  ],
  "studio": null
}

Rules:
- Expand ~ to actual home directory in all paths
- Only include directories/files that actually exist
- skillLibraries: only include entries if the directory exists
- studio: if HQ dir found set { "id":"studio","label":"Studio HQ","emoji":"🏢","root":"/path","files":[] }, else null

### 6. Confirm success
After writing, print exactly:
AGENT_HUB_SETUP_COMPLETE
Then one line: "Found X agents, Y skill libraries"
`;
