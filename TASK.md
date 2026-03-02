# Agent Hub v2 — TypeScript + Setup Agent

## Goal
1. Migrate server.js → TypeScript (src/server.ts)
2. Add CLI entrypoint (src/cli.ts)
3. Add setup agent: detects `claude`/`codex` CLI, spawns with premade prompt, streams SSE to browser
4. Add setup UI panel to index.html
5. Build with tsup

## File structure
```
src/
  server.ts        ← server.js migrated to TS, same logic + 2 new routes
  cli.ts           ← starts server, opens browser, --tunnel flag
  setup-agent.ts   ← spawn claude/codex, pipe stdout as SSE
  setup-prompt.ts  ← the premade prompt
  types.ts         ← shared types
dist/              ← tsup output
```

## package.json (full replacement)
```json
{
  "name": "@laniameda/agent-hub",
  "version": "0.2.0",
  "description": "Self-hosted web editor for AI agent workspaces",
  "main": "dist/server.js",
  "bin": { "agent-hub": "dist/cli.js" },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "start": "node dist/cli.js"
  },
  "dependencies": {
    "cookie-parser": "^1.4.6",
    "express": "^4.18.2",
    "open": "^10.1.0"
  },
  "devDependencies": {
    "@types/cookie-parser": "^1.4.6",
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
```

## tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

## tsup.config.ts
```ts
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/cli.ts', 'src/server.ts'],
  format: ['cjs'],
  target: 'node18',
  clean: true,
  shims: true,
  banner: { js: '#!/usr/bin/env node' },
});
```

## src/cli.ts
```ts
import { spawn, execSync } from 'child_process';
import path from 'path';

const PORT = parseInt(process.env.PORT || '4001');
const args = process.argv.slice(2);
const doTunnel = args.includes('--tunnel');
const noOpen = args.includes('--no-open') || args.includes('--vps');

// Start server subprocess
const server = spawn('node', [path.join(__dirname, 'server.js')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'inherit',
});
server.on('error', (e) => { console.error('Server error:', e); process.exit(1); });
process.on('SIGINT', () => { server.kill(); process.exit(0); });

setTimeout(async () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n⚙️  Agent Hub → ${url}\n`);
  if (doTunnel) {
    startTunnel(PORT);
  } else if (!noOpen) {
    try { const { default: open } = await import('open'); open(url); } catch {}
  }
}, 1200);

function startTunnel(port: number) {
  try { execSync('which cloudflared', { stdio: 'ignore' }); }
  catch {
    console.log('Installing cloudflared...');
    execSync('npm install -g cloudflared', { stdio: 'inherit' });
  }
  console.log('🌐 Starting Cloudflare tunnel...');
  const t = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], { stdio: 'inherit' });
  process.on('SIGINT', () => t.kill());
}
```

## src/setup-prompt.ts
```ts
export const SETUP_PROMPT = `
You are setting up Agent Hub — a self-hosted web editor for AI agent workspaces.
Your job: scan this machine, detect OpenClaw agent workspaces + skill libraries, write config.

CONFIG_PATH: {{CONFIG_PATH}}

## Instructions

1. Check if ~/.openclaw/ exists: run \`ls -la ~/.openclaw/\`

2. For each directory matching ~/.openclaw/workspace-*/:
   - Read IDENTITY.md if it exists (get Name, Emoji, Role)
   - List which exist: SOUL.md MISSION.md MEMORY.md USER.md AGENTS.md HEARTBEAT.md TOOLS.md IDENTITY.md
   - Check if skills/ subdir exists

3. Check ~/.agents/skills/ — list subdirectories
   Check ~/.openclaw/skills/ — list subdirectories

4. Look in ~/work/ for a "studio" or "HQ" dir containing vision.md or projects.md

5. Write valid JSON to {{CONFIG_PATH}} (create parent dirs if needed):
{
  "openclawRoot": "~/.openclaw absolute path",
  "agentsSkillsRoot": "~/.agents/skills absolute path",
  "agents": [
    {
      "id": "dirname minus workspace- prefix (workspace alone = main)",
      "label": "Name from IDENTITY.md or capitalized id",
      "emoji": "emoji from IDENTITY.md or 🤖",
      "role": "role from IDENTITY.md or Agent",
      "root": "/absolute/path",
      "files": ["only files that EXIST"],
      "skillsRoot": "/path/skills or null if missing"
    }
  ],
  "skillLibraries": [
    { "id": "custom", "label": "Custom Skills", "emoji": "🧩", "root": "/abs/path/.agents/skills" },
    { "id": "system", "label": "System Skills", "emoji": "🔧", "root": "/abs/path/.openclaw/skills" }
  ],
  "studio": null
}

Rules:
- Use absolute paths only
- Only include dirs/files that actually exist
- studio: if found a HQ dir, set { id, label, emoji, root, files:[] } else null

6. After writing the file print exactly:
AGENT_HUB_SETUP_COMPLETE
Then print: "Found X agents, Y skill libraries"
`;
```

## src/setup-agent.ts
```ts
import { spawn, execSync } from 'child_process';
import type { Response } from 'express';
import { SETUP_PROMPT } from './setup-prompt';

export type AgentCLI = 'claude' | 'codex' | null;

export function detectCLI(): AgentCLI {
  for (const cmd of ['claude', 'codex'] as const) {
    try { execSync(`which ${cmd}`, { stdio: 'ignore' }); return cmd; }
    catch {}
  }
  return null;
}

export function runSetupAgent(res: Response, configPath: string): void {
  const cli = detectCLI();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const send = (obj: object) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  if (!cli) {
    send({ type: 'error', text: 'No Claude Code or Codex CLI found.\nInstall: npm install -g @anthropic-ai/claude-code' });
    res.end();
    return;
  }

  send({ type: 'info', text: `Using ${cli} CLI...` });

  const prompt = SETUP_PROMPT.replace(/\{\{CONFIG_PATH\}\}/g, configPath);

  const args = cli === 'claude'
    ? ['-p', prompt, '--output-format', 'stream-json', '--allowedTools', 'Read,Write,Bash,Glob', '--dangerouslySkipPermissions']
    : ['-q', '--no-interactive', prompt];

  const proc = spawn(cli, args, { env: process.env });
  let buffer = '';

  proc.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.type === 'assistant' && msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'text' && block.text) send({ type: 'text', text: block.text });
            else if (block.type === 'tool_use') send({ type: 'tool', name: block.name, input: block.input });
          }
        } else if (msg.type === 'result') {
          send({ type: 'result', text: msg.result ?? '' });
        }
      } catch {
        send({ type: 'text', text: line });
      }
    }
  });

  proc.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString().trim();
    if (text) send({ type: 'stderr', text });
  });

  proc.on('close', (code) => {
    if (buffer.trim()) send({ type: 'text', text: buffer });
    send({ type: 'done', exitCode: code });
    res.end();
  });

  proc.on('error', (err) => { send({ type: 'error', text: err.message }); res.end(); });
  res.on('close', () => proc.kill());
}
```

## src/server.ts
Migrate server.js to TypeScript. Key additions:
1. Import detectCLI from ./setup-agent
2. Import runSetupAgent from ./setup-agent
3. Add at top (before other routes):
```ts
import os from 'os';
const CONFIG_PATH = process.env.CONFIG_PATH
  || path.join(os.homedir(), '.openclaw', 'agent-hub', 'agent-hub.config.json');

// Load config from file if exists (supplement env var discovery)
if (fs.existsSync(CONFIG_PATH)) {
  try {
    const fileConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    // merge fileConfig into AGENTS/SKILL_LIBRARIES etc if not already set by env
  } catch {}
}
```
4. Add two routes before the wildcard:
```ts
app.get('/api/setup/status', (req, res) => {
  const cli = detectCLI();
  const hasConfig = fs.existsSync(CONFIG_PATH);
  res.json({ needsSetup: !hasConfig, cli, configPath: CONFIG_PATH });
});

app.get('/api/setup/run', auth, (req, res) => {
  runSetupAgent(res, CONFIG_PATH);
});
```

## index.html changes — Setup Panel
Add BEFORE the login div:

```html
<!-- SETUP OVERLAY -->
<div id="setup-overlay" style="display:none">
  <!-- full screen overlay, same bg as app -->
  <div class="setup-card">
    <div class="setup-eye">Agent Hub · First Run</div>
    <h1 class="setup-title">Setup your <span>workspace</span></h1>
    <div id="cli-status" class="setup-cli-badge">Detecting CLI...</div>
    <div id="setup-terminal" class="setup-term"></div>
    <div class="setup-actions">
      <button id="scan-btn" class="btn-p" onclick="startSetup()" style="display:none">
        ⚡ Scan my workspace
      </button>
      <div id="setup-done" style="display:none;gap:10px;align-items:center;display:flex">
        <span style="color:#3a9a4e;font-weight:600">✓ Setup complete</span>
        <button class="btn-p" onclick="location.reload()">Launch Hub →</button>
      </div>
      <div id="setup-no-cli" style="display:none">
        <p>Install Claude Code first:</p>
        <code>npm install -g @anthropic-ai/claude-code</code>
      </div>
    </div>
  </div>
</div>
```

Add CSS for setup panel (matching laniameda design system):
```css
#setup-overlay {
  position:fixed;inset:0;z-index:500;
  background:var(--p);
  display:flex;align-items:center;justify-content:center;
}
.setup-card {
  width:640px;max-width:90vw;
  display:flex;flex-direction:column;gap:20px;
  padding:48px;
  background:var(--p);border:1px solid var(--bd);
  border-radius:24px;box-shadow:var(--sh-lg);
}
.setup-eye { font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--tg); }
.setup-title { font-size:32px;font-weight:800;letter-spacing:-.5px;line-height:1.1 }
.setup-title span { color:var(--coral) }
.setup-cli-badge { font-family:'JetBrains Mono',monospace;font-size:11px;padding:6px 12px;background:var(--s2);border-radius:20px;display:inline-flex;align-items:center;gap:6px;width:fit-content }
.setup-term { background:#0f0f0f;color:#e8e8e8;border-radius:var(--r);padding:16px;font-family:'JetBrains Mono',monospace;font-size:11px;line-height:1.7;min-height:200px;max-height:380px;overflow-y:auto;white-space:pre-wrap;word-break:break-word }
.setup-term .t-tool { color:#ff7a64 }
.setup-term .t-info { color:#888 }
.setup-term .t-err { color:#ff5555 }
```

Add JS at bottom of script (inside existing <script>):
```js
// ── SETUP AGENT ──
async function checkSetup() {
  try {
    const r = await fetch('/api/setup/status');
    const { needsSetup, cli } = await r.json();
    if (!needsSetup) return; // has config, skip
    
    // Show setup overlay
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app').style.display = 'none';
    document.getElementById('setup-overlay').style.display = 'flex';
    
    const badge = document.getElementById('cli-status');
    if (cli) {
      badge.textContent = `✓ ${cli === 'claude' ? 'Claude Code' : 'Codex'} detected`;
      badge.style.background = 'var(--cdim)';
      badge.style.color = 'var(--coral)';
      document.getElementById('scan-btn').style.display = 'flex';
    } else {
      badge.textContent = '✗ No CLI detected';
      badge.style.color = '#c44';
      document.getElementById('setup-no-cli').style.display = 'block';
    }
  } catch {}
}

function startSetup() {
  if (!logged()) { document.getElementById('login-page').style.display = 'flex'; return; }
  document.getElementById('scan-btn').style.display = 'none';
  const term = document.getElementById('setup-terminal');
  term.innerHTML = '';
  
  const source = new EventSource('/api/setup/run');
  
  source.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    let line = '';
    if (msg.type === 'tool') {
      line = `<span class="t-tool">[${msg.name}] ${JSON.stringify(msg.input).slice(0,80)}</span>\n`;
    } else if (msg.type === 'error' || msg.type === 'stderr') {
      line = `<span class="t-err">${msg.text}</span>\n`;
    } else if (msg.type === 'info') {
      line = `<span class="t-info">${msg.text}</span>\n`;
    } else if (msg.type === 'text' || msg.type === 'result') {
      const text = msg.text || '';
      line = text + '\n';
      if (text.includes('AGENT_HUB_SETUP_COMPLETE')) {
        source.close();
        document.getElementById('setup-done').style.display = 'flex';
      }
    } else if (msg.type === 'done') {
      source.close();
      if (msg.exitCode === 0) document.getElementById('setup-done').style.display = 'flex';
    }
    if (line) { term.innerHTML += line; term.scrollTop = term.scrollHeight; }
  };
  source.onerror = () => {
    term.innerHTML += '<span class="t-err">Connection lost</span>\n';
    source.close();
  };
}

// Run setup check on load (before init)
checkSetup().then(() => {
  // init() only runs if no setup needed OR if setup overlay hidden
  if (!document.getElementById('setup-overlay') || 
      document.getElementById('setup-overlay').style.display === 'none') {
    // init() is called at bottom of script anyway
  }
});
```

IMPORTANT: The existing `init()` call at the bottom should run AFTER checkSetup. Wrap existing `init()` call:
```js
checkSetup().then(setupNeeded => {
  if (!setupNeeded) init();
});
// Remove the bare `init();` call and replace with the above
```

Actually simpler: just call checkSetup() at the very bottom. If setup overlay shows, it hides login+app. If not, init() runs normally.

## Dockerfile
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4001
CMD ["node", "dist/cli.js", "--no-open"]
```

## .gitignore additions
Add: dist/

## After building, verify:
1. `npm run build` completes without errors
2. `ls dist/` shows server.js and cli.js
3. `node dist/server.js` starts on port 4001
4. `/api/setup/status` returns JSON
5. All existing endpoints still work (/api/tree, /api/file, etc.)
6. index.html still renders the editor correctly
