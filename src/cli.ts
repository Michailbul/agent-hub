import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const args = process.argv.slice(2);
const subcommand = args[0];

// ── HQ CLI COMMANDS ─────────────────────────────────────────
// These run standalone (no server needed) — for AI agents & terminal use.
//   agent-hub hq link <path> [--name <name>] [--description <desc>]
//   agent-hub hq unlink <id>
//   agent-hub hq list
//   agent-hub hq tree <id>

if (subcommand === 'hq') {
  runHQCommand(args.slice(1));
} else if (subcommand === 'skills') {
  runSkillsCommand(args.slice(1));
} else {
  startServer();
}

function getHQConfigPath(): string {
  const configPath = process.env.CONFIG_PATH
    || path.join(os.homedir(), '.openclaw', 'agent-hub', 'agent-hub.config.json');
  return path.join(path.dirname(configPath), 'hq.config.json');
}

function readHQConfig(): { sources: { id: string; name: string; icon: string; path: string; description: string; color: string }[] } {
  const p = getHQConfigPath();
  if (fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch { /* fall through */ }
  }
  return { sources: [] };
}

function writeHQConfig(config: ReturnType<typeof readHQConfig>) {
  const p = getHQConfigPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf8');
}

function expandPath(p: string): string {
  return p.replace(/^~/, process.env.HOME || '/root');
}

function runHQCommand(hqArgs: string[]) {
  const action = hqArgs[0];

  if (action === 'link') {
    const folderPath = hqArgs[1];
    if (!folderPath) { console.error('Usage: agent-hub hq link <path> [--name <name>] [--description <desc>]'); process.exit(1); }
    const resolved = expandPath(folderPath);
    if (!fs.existsSync(resolved)) { console.error(`Error: folder does not exist: ${resolved}`); process.exit(1); }

    const nameIdx = hqArgs.indexOf('--name');
    const descIdx = hqArgs.indexOf('--description');
    const name = nameIdx >= 0 ? hqArgs[nameIdx + 1] : path.basename(resolved);
    const description = descIdx >= 0 ? hqArgs[descIdx + 1] : '';
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const config = readHQConfig();
    const existing = config.sources.findIndex(s => s.id === id);
    const source = { id, name, icon: '📁', path: folderPath, description, color: '#7a5c2e' };
    if (existing >= 0) config.sources[existing] = source;
    else config.sources.push(source);
    writeHQConfig(config);

    console.log(`Linked: ${name} → ${folderPath}`);
    console.log(`Config: ${getHQConfigPath()}`);

  } else if (action === 'unlink') {
    const id = hqArgs[1];
    if (!id) { console.error('Usage: agent-hub hq unlink <id>'); process.exit(1); }
    const config = readHQConfig();
    const before = config.sources.length;
    config.sources = config.sources.filter(s => s.id !== id);
    if (config.sources.length === before) { console.error(`No source found with id: ${id}`); process.exit(1); }
    writeHQConfig(config);
    console.log(`Unlinked: ${id}`);

  } else if (action === 'list') {
    const config = readHQConfig();
    if (!config.sources.length) { console.log('No HQ folders linked yet.\nUse: agent-hub hq link <path> --name "My HQ"'); process.exit(0); }
    console.log('HQ Sources:\n');
    for (const s of config.sources) {
      const resolved = expandPath(s.path);
      const exists = fs.existsSync(resolved);
      let count = 0;
      try { count = fs.readdirSync(resolved, { withFileTypes: true }).filter(e => !e.name.startsWith('.')).length; } catch {}
      console.log(`  ${s.icon} ${s.name} (${s.id})`);
      console.log(`    Path: ${s.path}${exists ? '' : ' [NOT FOUND]'}`);
      if (s.description) console.log(`    Desc: ${s.description}`);
      console.log(`    Files: ${count}`);
      console.log('');
    }

  } else if (action === 'tree') {
    const id = hqArgs[1];
    if (!id) { console.error('Usage: agent-hub hq tree <id>'); process.exit(1); }
    const config = readHQConfig();
    const source = config.sources.find(s => s.id === id);
    if (!source) { console.error(`No source found with id: ${id}`); process.exit(1); }
    const resolved = expandPath(source.path);
    if (!fs.existsSync(resolved)) { console.error(`Folder not found: ${resolved}`); process.exit(1); }

    function printTree(dir: string, prefix: string, depth: number) {
      if (depth > 3) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => !e.name.startsWith('.'))
        .sort((a, b) => {
          if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
          return a.name.localeCompare(b.name);
        });
      entries.forEach((e, i) => {
        const isLast = i === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const icon = e.isDirectory() ? '📁' : '  ';
        console.log(`${prefix}${connector}${icon} ${e.name}`);
        if (e.isDirectory()) {
          const nextPrefix = prefix + (isLast ? '    ' : '│   ');
          printTree(path.join(dir, e.name), nextPrefix, depth + 1);
        }
      });
    }

    console.log(`${source.icon} ${source.name} — ${source.path}\n`);
    printTree(resolved, '', 0);

  } else {
    console.log(`agent-hub hq — Manage Headquarters folders

Commands:
  agent-hub hq link <path> [--name <name>] [--description <desc>]
      Link a folder to HQ. Name defaults to folder basename.

  agent-hub hq unlink <id>
      Remove a linked folder.

  agent-hub hq list
      Show all linked folders with file counts.

  agent-hub hq tree <id>
      Print the directory tree for a source.

Examples:
  agent-hub hq link ~/company/ops --name "Operations"
  agent-hub hq link ~/docs --name "Cloud Docs" --description "Synced cloud files"
  agent-hub hq list
  agent-hub hq tree operations
  agent-hub hq unlink operations
`);
  }
  process.exit(0);
}

// ── SKILLS CLI COMMANDS ─────────────────────────────────────────
// Manage linked skill repos.
//   agent-hub skills link <path> [--name <name>] [--description <desc>]
//   agent-hub skills unlink <id>
//   agent-hub skills list
//   agent-hub skills pull [id]

function getSkillsReposConfigPath(): string {
  const configPath = process.env.CONFIG_PATH
    || path.join(os.homedir(), '.openclaw', 'agent-hub', 'agent-hub.config.json');
  return path.join(path.dirname(configPath), 'skills-repos.config.json');
}

interface SkillsRepoEntry {
  id: string; name: string; path: string; skillsRoot: string;
  description: string; isGitRepo: boolean; linkedAt: string;
}

function readSkillsReposConfig(): { repos: SkillsRepoEntry[] } {
  const p = getSkillsReposConfigPath();
  if (fs.existsSync(p)) {
    try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch { /* fall through */ }
  }
  return { repos: [] };
}

function writeSkillsReposConfig(config: ReturnType<typeof readSkillsReposConfig>) {
  const p = getSkillsReposConfigPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(config, null, 2), 'utf8');
}

function runSkillsCommand(skillsArgs: string[]) {
  const action = skillsArgs[0];

  if (action === 'link') {
    const folderPath = skillsArgs[1];
    if (!folderPath) { console.error('Usage: agent-hub skills link <path> [--name <name>] [--description <desc>]'); process.exit(1); }
    const resolved = expandPath(folderPath);
    if (!fs.existsSync(resolved)) { console.error(`Error: path does not exist: ${resolved}`); process.exit(1); }

    const nameIdx = skillsArgs.indexOf('--name');
    const descIdx = skillsArgs.indexOf('--description');
    const name = nameIdx >= 0 ? skillsArgs[nameIdx + 1] : path.basename(resolved);
    const description = descIdx >= 0 ? skillsArgs[descIdx + 1] : '';
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Auto-detect skillsRoot
    let skillsRoot = folderPath;
    const hasSkillsAtRoot = fs.readdirSync(resolved, { withFileTypes: true })
      .some(e => e.isDirectory() && fs.existsSync(path.join(resolved, e.name, 'SKILL.md')));
    if (!hasSkillsAtRoot) {
      const skillsSubdir = path.join(resolved, 'skills');
      if (fs.existsSync(skillsSubdir)) {
        const hasSkillsInSubdir = fs.readdirSync(skillsSubdir, { withFileTypes: true })
          .some(e => e.isDirectory() && fs.existsSync(path.join(skillsSubdir, e.name, 'SKILL.md')));
        if (hasSkillsInSubdir) skillsRoot = path.join(folderPath, 'skills');
      }
    }

    let isGitRepo = false;
    try { isGitRepo = fs.existsSync(path.join(resolved, '.git')); } catch {}

    const config = readSkillsReposConfig();
    const entry: SkillsRepoEntry = { id, name, path: folderPath, skillsRoot, description, isGitRepo, linkedAt: new Date().toISOString() };
    const existing = config.repos.findIndex(r => r.id === id);
    if (existing >= 0) config.repos[existing] = entry;
    else config.repos.push(entry);
    writeSkillsReposConfig(config);

    console.log(`Linked: ${name} → ${folderPath}`);
    console.log(`Skills root: ${skillsRoot}`);
    if (isGitRepo) console.log('Git repo detected — use "agent-hub skills pull" to update');
    console.log(`Config: ${getSkillsReposConfigPath()}`);

  } else if (action === 'unlink') {
    const id = skillsArgs[1];
    if (!id) { console.error('Usage: agent-hub skills unlink <id>'); process.exit(1); }
    const config = readSkillsReposConfig();
    const before = config.repos.length;
    config.repos = config.repos.filter(r => r.id !== id);
    if (config.repos.length === before) { console.error(`No repo found with id: ${id}`); process.exit(1); }
    writeSkillsReposConfig(config);
    console.log(`Unlinked: ${id}`);

  } else if (action === 'list') {
    const config = readSkillsReposConfig();
    if (!config.repos.length) { console.log('No skill repos linked yet.\nUse: agent-hub skills link <path> --name "My Skills"'); process.exit(0); }
    console.log('Linked Skill Repos:\n');
    for (const repo of config.repos) {
      const resolvedRoot = expandPath(repo.skillsRoot);
      const exists = fs.existsSync(resolvedRoot);
      let skillCount = 0;
      try {
        skillCount = fs.readdirSync(resolvedRoot, { withFileTypes: true })
          .filter(e => e.isDirectory() && fs.existsSync(path.join(resolvedRoot, e.name, 'SKILL.md'))).length;
      } catch {}
      console.log(`  ${repo.isGitRepo ? '📦' : '📁'} ${repo.name} (${repo.id})`);
      console.log(`    Path: ${repo.path}${exists ? '' : ' [NOT FOUND]'}`);
      console.log(`    Skills root: ${repo.skillsRoot}`);
      if (repo.description) console.log(`    Desc: ${repo.description}`);
      console.log(`    Skills: ${skillCount}`);
      console.log('');
    }

  } else if (action === 'pull') {
    const id = skillsArgs[1];
    const config = readSkillsReposConfig();
    const repos = id ? config.repos.filter(r => r.id === id) : config.repos.filter(r => r.isGitRepo);
    if (!repos.length) { console.error(id ? `No repo found with id: ${id}` : 'No git-backed repos linked'); process.exit(1); }

    for (const repo of repos) {
      if (!repo.isGitRepo) { console.log(`  Skipping ${repo.name} (not a git repo)`); continue; }
      const resolved = expandPath(repo.path);
      console.log(`  Pulling ${repo.name}...`);
      try {
        const output = execSync(`git -C "${resolved}" pull`, { encoding: 'utf8', timeout: 30000 });
        console.log(`  ${output.trim()}`);
      } catch (e: any) {
        console.error(`  Error: ${e.message}`);
      }
    }

  } else {
    console.log(`agent-hub skills — Manage linked skill repos

Commands:
  agent-hub skills link <path> [--name <name>] [--description <desc>]
      Link a skills repo. Auto-detects skills/ subdir and git repo.

  agent-hub skills unlink <id>
      Remove a linked repo.

  agent-hub skills list
      Show all linked repos with skill counts.

  agent-hub skills pull [id]
      Git pull in one or all linked repos.

Examples:
  agent-hub skills link ~/work/laniameda/skills --name "Laniameda Skills"
  agent-hub skills list
  agent-hub skills pull
  agent-hub skills pull laniameda-skills
  agent-hub skills unlink laniameda-skills
`);
  }
  process.exit(0);
}

// ── SERVER START ─────────────────────────────────────────────

function startServer() {
  const PORT = parseInt(process.env.PORT ?? '4001');
  const doTunnel = args.includes('--tunnel');
  const noOpen = args.includes('--no-open') || args.includes('--vps');

  const server = spawn('node', [path.join(__dirname, 'server.js')], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'inherit',
  });

  server.on('error', (e: Error) => { console.error('Server error:', e); process.exit(1); });
  process.on('SIGINT', () => { server.kill(); process.exit(0); });
  process.on('SIGTERM', () => { server.kill(); process.exit(0); });

  setTimeout(async () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n  Agent Hub → ${url}\n`);
    if (doTunnel) {
      startTunnel(PORT);
    } else if (!noOpen) {
      try { const { default: open } = await import('open'); await open(url); } catch {}
    }
  }, 1200);

  function startTunnel(port: number): void {
    try { execSync('which cloudflared', { stdio: 'ignore' }); }
    catch {
      console.log('Installing cloudflared...');
      execSync('npm install -g cloudflared', { stdio: 'inherit' });
    }
    console.log('Starting Cloudflare tunnel...');
    const t = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], { stdio: 'inherit' });
    process.on('SIGINT', () => { try { t.kill(); } catch {} });
  }
}
