import express from 'express';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { detectCLI, runSetupAgent } from './setup-agent';

const app = express();
const PORT = process.env.PORT || 4001;
const PASSWORD = process.env.HUB_PASSWORD || 'changeme';
const CONFIG_PATH = process.env.CONFIG_PATH
  || path.join(os.homedir(), '.openclaw', 'agent-hub', 'agent-hub.config.json');

// ── CONFIG LOADING ─────────────────────────────────────────
// Priority: agent-hub.config.json > env vars > auto-discovery

let CONFIG = null;
if (fs.existsSync(CONFIG_PATH)) {
  try { CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); console.log('Config loaded from', CONFIG_PATH); }
  catch(e) { console.error('Invalid config file:', e.message); }
}

// ── AUTO-DISCOVERY ─────────────────────────────────────────
// Scan OPENCLAW_ROOT (default: /data/openclaw or ~/.openclaw) for workspace dirs

function discoverAgents(openclawRoot) {
  const agents = [];
  if (!fs.existsSync(openclawRoot)) return agents;
  const entries = fs.readdirSync(openclawRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name.startsWith('workspace'));
  for (const entry of entries) {
    const wsRoot = path.join(openclawRoot, entry.name);
    const agentId = entry.name.replace('workspace-', '') || 'main';
    // Read IDENTITY.md for name/emoji/role
    let label = agentId.charAt(0).toUpperCase() + agentId.slice(1);
    let emoji = '🤖'; let role = 'Agent';
    const identityPath = path.join(wsRoot, 'IDENTITY.md');
    if (fs.existsSync(identityPath)) {
      const content = fs.readFileSync(identityPath, 'utf8');
      const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
      const emojiMatch = content.match(/\*\*Emoji:\*\*\s*(.+)/);
      const roleMatch = content.match(/\*\*Role:\*\*\s*(.+)/);
      if (nameMatch) label = nameMatch[1].trim();
      if (emojiMatch) { const e = emojiMatch[1].trim(); emoji = e.length <= 4 ? e : '🤖'; }
      if (roleMatch) role = roleMatch[1].trim();
    }
    // Default instruction files (whichever exist)
    const defaultFiles = ['SOUL.md','MISSION.md','MEMORY.md','USER.md','AGENTS.md',
      'IDENTITY.md','HEARTBEAT.md','TOOLS.md','pm/vision.md','pm/backlog.md','pm/problems.md'];
    agents.push({ id: agentId, label, emoji, role, root: wsRoot,
      files: defaultFiles, skillsRoot: path.join(wsRoot, 'skills') });
  }
  return agents;
}

// ── RESOLVE CONFIG ─────────────────────────────────────────

const OPENCLAW_ROOT = process.env.OPENCLAW_ROOT
  || (CONFIG && CONFIG.openclawRoot)
  || '/data/openclaw';

const AGENTS_SKILLS_ROOT = process.env.AGENTS_SKILLS_ROOT
  || (CONFIG && CONFIG.agentsSkillsRoot)
  || '/data/agents/skills';

const OPENCLAW_SKILLS_ROOT = path.join(OPENCLAW_ROOT, 'skills');

let AGENTS, SKILL_LIBRARIES, STUDIO, ALLOWED_ROOTS;

function expandPath(p) {
  if (!p) return p;
  return p.replace(/^~/, process.env.HOME || '/root');
}

function initAgents() {
  if (CONFIG && CONFIG.agents) {
    AGENTS = CONFIG.agents.map(a => ({ ...a, root: expandPath(a.root), skillsRoot: a.skillsRoot ? expandPath(a.skillsRoot) : null }));
    SKILL_LIBRARIES = (CONFIG.skillLibraries || []).map(l => ({ ...l, root: expandPath(l.root) }));
    STUDIO = CONFIG.studio ? { ...CONFIG.studio, root: expandPath(CONFIG.studio.root) } : null;
  } else {
    AGENTS = discoverAgents(OPENCLAW_ROOT);
    SKILL_LIBRARIES = [
      { id:'skills-agents',   label:'Custom Skills',  emoji:'🧩', root: AGENTS_SKILLS_ROOT },
      { id:'skills-openclaw', label:'System Skills',  emoji:'🔧', root: OPENCLAW_SKILLS_ROOT },
    ].filter(l => fs.existsSync(l.root));
    STUDIO = null;
  }

  ALLOWED_ROOTS = [
    ...AGENTS.map(a => a.root),
    ...AGENTS.filter(a => a.skillsRoot).map(a => a.skillsRoot),
    ...SKILL_LIBRARIES.map(s => s.root),
    ...(STUDIO ? [STUDIO.root] : []),
    AGENTS_SKILLS_ROOT,
    OPENCLAW_SKILLS_ROOT,
  ].filter(Boolean);

  console.log('Agents:', AGENTS.map(a => a.label).join(', '));
  console.log('Skill libs:', SKILL_LIBRARIES.map(l => l.label).join(', '));
  console.log('Allowed roots:', ALLOWED_ROOTS.length);
}

initAgents();

// ── HELPERS ────────────────────────────────────────────────

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

function isAllowed(filePath) {
  const resolved = path.resolve(filePath);
  return ALLOWED_ROOTS.some(r => {
    const rr = path.resolve(r);
    return resolved.startsWith(rr + path.sep) || resolved === rr;
  });
}

function parseSkillFrontmatter(filePath) {
  const result = { name: null, author: null, source: null };
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const nameMatch   = content.match(/^---[\s\S]*?^name:\s*(.+)$/m);
    const authorMatch = content.match(/^---[\s\S]*?^author:\s*(.+)$/m);
    const sourceMatch = content.match(/^---[\s\S]*?^source:\s*(.+)$/m);
    if (nameMatch)   result.name   = nameMatch[1].trim();
    if (authorMatch) result.author = authorMatch[1].trim();
    if (sourceMatch) result.source = sourceMatch[1].trim();
  } catch(e) {}
  return result;
}

function parseSkillName(filePath) { return parseSkillFrontmatter(filePath).name; }

const STUDIO_SKILLS_LIST = new Set(['laniameda-kb','andromeda-messages','enhance-prompt','design-md','stitch-loop']);

function getSkillSource(dirName, filePath, frontmatter) {
  if (filePath.includes(AGENTS_SKILLS_ROOT)) return 'studio';
  if (dirName && STUDIO_SKILLS_LIST.has(dirName)) return 'studio';
  if (frontmatter.author || (frontmatter.source && frontmatter.source !== 'openclaw')) return 'community';
  return 'openclaw';
}

function scanSkillsDir(skillsRoot) {
  if (!skillsRoot) return [];
  const skills = [];
  try {
    const rootSkill = path.join(skillsRoot, 'SKILL.md');
    if (fs.existsSync(rootSkill)) {
      const fm = parseSkillFrontmatter(rootSkill);
      const dirName = path.basename(path.dirname(skillsRoot));
      skills.push({ label: fm.name || dirName, path: rootSkill, dirName, source: getSkillSource(dirName, rootSkill, fm) });
    }
    const entries = fs.readdirSync(skillsRoot, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name).sort();
    for (const dir of entries) {
      if (dir.includes('.bak.')) continue;
      const sp = path.join(skillsRoot, dir, 'SKILL.md');
      if (fs.existsSync(sp)) {
        const fm = parseSkillFrontmatter(sp);
        skills.push({ label: fm.name || dir, path: sp, dirName: dir, source: getSkillSource(dir, sp, fm) });
      }
    }
  } catch(e) {}
  return skills;
}

function resolveFiles(root, files) {
  return files.map(f => ({ label: f, path: path.join(root, f) })).filter(f => fs.existsSync(f.path));
}

function auth(req, res, next) {
  const cookie = req.cookies.agent_hub_auth;
  const header = req.headers.authorization;
  if (cookie === PASSWORD || header === `Bearer ${PASSWORD}`) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
  return res.redirect('/login');
}

// ── ROUTES ─────────────────────────────────────────────────

// Serve React SPA static files
const CLIENT_DIST = path.join(__dirname, '..', 'dist-client');
const CLIENT_INDEX = path.join(CLIENT_DIST, 'index.html');
const hasClientBuild = fs.existsSync(CLIENT_INDEX);

if (hasClientBuild) {
  app.use(express.static(CLIENT_DIST));
  app.get('/login', (_req, res) => res.sendFile(CLIENT_INDEX));
} else {
  // Fallback to legacy index.html for development
  const LEGACY_HTML = path.join(__dirname, '..', 'index.html');
  app.get('/login', (_req, res) => res.sendFile(LEGACY_HTML));
}

app.post('/api/login', (req, res) => {
  if (req.body.password === PASSWORD) {
    res.cookie('agent_hub_auth', PASSWORD, { httpOnly: false, maxAge: 7*24*3600*1000 });
    return res.json({ ok: true });
  }
  res.status(401).json({ error: 'Wrong password' });
});

app.post('/api/logout', (req, res) => { res.clearCookie('agent_hub_auth'); res.json({ ok: true }); });

// Rescan agents and skills without restarting
app.post('/api/refresh', auth, (_req, res) => {
  try {
    initAgents();
    res.json({ ok: true, agents: AGENTS.length, libs: SKILL_LIBRARIES.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/tree', auth, (req, res) => {
  const agents = AGENTS.map(agent => ({
    id: agent.id, label: agent.label, emoji: agent.emoji, role: agent.role, type: 'agent',
    instructions: resolveFiles(agent.root, agent.files),
    skills: scanSkillsDir(agent.skillsRoot),
  }));
  const libraries = SKILL_LIBRARIES.map(lib => ({
    id: lib.id, label: lib.label, emoji: lib.emoji, type: 'library',
    files: scanSkillsDir(lib.root),
  }));
  const studio = STUDIO
    ? { ...STUDIO, type: 'studio', files: resolveFiles(STUDIO.root, STUDIO.files || []) }
    : { id:'studio', label:'Studio', emoji:'🏢', type:'studio', files:[] };
  res.json({ agents, libraries, studio });
});

app.get('/api/file', auth, (req, res) => {
  const { path: filePath } = req.query;
  if (!filePath || !isAllowed(filePath)) return res.status(403).send('Forbidden');
  try { res.send(fs.readFileSync(filePath, 'utf8')); } catch(e) { res.status(404).send('Not found'); }
});

app.post('/api/file', auth, (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath || !isAllowed(filePath)) return res.status(403).json({ error: 'Forbidden' });
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/assign-targets', auth, (req, res) => {
  const targets = AGENTS.map(a => ({
    id: a.id, label: a.label, emoji: a.emoji,
    files: resolveFiles(a.root, a.files).map(f => ({ label: f.label, path: f.path })),
  }));
  res.json(targets);
});

// Skill operations
app.post('/api/skill/copy', auth, (req, res) => {
  const { src, destDir } = req.body;
  if (!src || !destDir) return res.status(400).json({ error: 'src and destDir required' });
  if (!isAllowed(src) || !isAllowed(destDir)) return res.status(403).json({ error: 'Not allowed' });
  try {
    const srcDir = path.dirname(src);
    const skillDirName = path.basename(srcDir);
    const targetDir = path.join(destDir, skillDirName);
    if (fs.existsSync(targetDir)) return res.status(409).json({ error: 'Skill already exists at destination' });
    const copyDir = (from, to) => {
      fs.mkdirSync(to, { recursive: true });
      fs.readdirSync(from).forEach(f => {
        const s = path.join(from, f), d = path.join(to, f);
        fs.statSync(s).isDirectory() ? copyDir(s, d) : fs.copyFileSync(s, d);
      });
    };
    copyDir(srcDir, targetDir);
    res.json({ ok: true, dest: path.join(targetDir, 'SKILL.md') });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/skill/move', auth, (req, res) => {
  const { src, destDir } = req.body;
  if (!src || !destDir) return res.status(400).json({ error: 'src and destDir required' });
  if (!isAllowed(src) || !isAllowed(destDir)) return res.status(403).json({ error: 'Not allowed' });
  try {
    const srcDir = path.dirname(src);
    const targetDir = path.join(destDir, path.basename(srcDir));
    if (fs.existsSync(targetDir)) return res.status(409).json({ error: 'Skill already exists at destination' });
    fs.mkdirSync(path.dirname(targetDir), { recursive: true });
    fs.renameSync(srcDir, targetDir);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/skill/delete', auth, (req, res) => {
  const { src } = req.body;
  if (!src) return res.status(400).json({ error: 'src required' });
  if (!isAllowed(src)) return res.status(403).json({ error: 'Not allowed' });
  try {
    const rmrf = (p) => {
      if (!fs.existsSync(p)) return;
      fs.readdirSync(p).forEach(f => {
        const fp = path.join(p, f);
        fs.statSync(fp).isDirectory() ? rmrf(fp) : fs.unlinkSync(fp);
      });
      fs.rmdirSync(p);
    };
    rmrf(path.dirname(src));
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/setup/status', (req, res) => {
  const cli = detectCLI();
  // needsSetup = false if: config file exists, OR env vars are set (VPS mode), OR agents were auto-discovered
  const hasConfig = fs.existsSync(CONFIG_PATH);
  const hasEnvConfig = !!(process.env.OPENCLAW_ROOT || process.env.AGENTS_SKILLS_ROOT);
  const hasAgents = AGENTS.length > 0;
  const needsSetup = !hasConfig && !hasEnvConfig && !hasAgents;
  res.json({ needsSetup, cli, configPath: CONFIG_PATH });
});

app.get('/api/setup/run', (req, res) => {
  runSetupAgent(res, CONFIG_PATH);
});

// Catch-all: serve React SPA or legacy HTML
app.get('*', auth, (_req, res) => {
  if (hasClientBuild) {
    res.sendFile(CLIENT_INDEX);
  } else {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});
app.listen(PORT, () => console.log(`Agent Hub :${PORT}`));
