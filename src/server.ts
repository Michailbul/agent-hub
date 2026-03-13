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
    // Categorized files
    const instructionFiles = ['SOUL.md','MISSION.md','IDENTITY.md','USER.md',
      'AGENTS.md','HEARTBEAT.md','TOOLS.md'];
    const memoryFiles = ['MEMORY.md'];
    const pmFiles = ['pm/vision.md','pm/backlog.md','pm/problems.md'];
    agents.push({ id: agentId, label, emoji, role, root: wsRoot,
      files: instructionFiles, memoryFiles, pmFiles,
      skillsRoot: path.join(wsRoot, 'skills') });
  }
  return agents;
}

// ── RESOLVE CONFIG — with auto-heal path scanning ──────────

function resolveOpenclawRoot(): string {
  // 1. Explicit env var / config always wins
  const explicit = process.env.OPENCLAW_ROOT || (CONFIG && CONFIG.openclawRoot);
  if (explicit && fs.existsSync(explicit)) return explicit;

  // 2. Scan common locations in order
  const home = process.env.HOME || '/root';
  const candidates = [
    explicit,                              // configured but might be wrong
    `${home}/.openclaw`,                   // standard user install
    '/root/.openclaw',                     // root install
    '/data/openclaw',                      // Docker default
    '/home/user/.openclaw',                // linux user
    `${home}/openclaw`,                    // alternative
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      const hasWorkspace = fs.readdirSync(candidate)
        .some(d => d.startsWith('workspace'));
      if (hasWorkspace) {
        if (candidate !== explicit) {
          console.log(`[auto-heal] OPENCLAW_ROOT not found at "${explicit}", using "${candidate}"`);
        }
        return candidate;
      }
    }
  }

  // 3. Last resort: return first candidate that exists even without workspaces
  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }

  console.warn('[auto-heal] Could not find ~/.openclaw — agents will be empty');
  return explicit || '/data/openclaw';
}

function resolveAgentsSkillsRoot(openclawRoot: string): string {
  const explicit = process.env.AGENTS_SKILLS_ROOT || (CONFIG && CONFIG.agentsSkillsRoot);
  if (explicit && fs.existsSync(explicit)) return explicit;

  const home = process.env.HOME || '/root';
  const candidates = [
    explicit,
    `${home}/.agents/skills`,
    '/root/.agents/skills',
    '/data/agents/skills',
    `${openclawRoot}/agent-skills`,
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      if (candidate !== explicit) {
        console.log(`[auto-heal] AGENTS_SKILLS_ROOT not found at "${explicit}", using "${candidate}"`);
      }
      return candidate;
    }
  }
  return explicit || '/data/agents/skills';
}

const OPENCLAW_ROOT = resolveOpenclawRoot();
const AGENTS_SKILLS_ROOT = resolveAgentsSkillsRoot(OPENCLAW_ROOT);
const HOME_DIR = os.homedir();

const OPENCLAW_SKILLS_ROOT = path.join(OPENCLAW_ROOT, 'skills');

let AGENTS, SKILL_LIBRARIES, STUDIO, ALLOWED_ROOTS;

type SkillEcosystem = 'agents' | 'agent' | 'codex' | 'cursor' | 'claude' | 'openclaw' | 'workspace' | 'repo';
type SkillSourceKind = 'library' | 'workspace' | 'linked';

interface SkillFrontmatter {
  name: string | null;
  author: string | null;
  source: string | null;
  description: string | null;
  license: string | null;
  department: string | null;
}

interface ParsedSkillDoc {
  frontmatter: SkillFrontmatter;
  body: string;
}

interface SkillSourceDescriptor {
  id: string;
  label: string;
  ecosystem: SkillEcosystem;
  kind: SkillSourceKind;
  root: string;
  priority: number;
  agentId?: string;
}

interface SkillsIndexVariant {
  sourceId: string;
  sourceLabel: string;
  ecosystem: SkillEcosystem;
  kind: SkillSourceKind;
  path: string;
  previewPath: string;
  label: string;
  directoryName: string;
  frontmatter: SkillFrontmatter;
  summary: string;
  sourceRank: number;
  folder: string | null;
  isSymlink: boolean;
}

interface SkillsIndexSkill {
  id: string;
  name: string;
  summary: string;
  variants: SkillsIndexVariant[];
  installedAgentIds: string[];
  missingAgentIds: string[];
  isInMaster: boolean;
  grouping: {
    purpose: string;
    department: string;
    confidence: number;
    source: 'heuristic';
  };
}

interface SkillsRepoEntry {
  id: string;
  name: string;
  path: string;
  skillsRoot: string;
  description: string;
  isGitRepo: boolean;
  linkedAt: string;
}

function expandPath(p) {
  if (!p) return p;
  return p.replace(/^~/, process.env.HOME || '/root');
}

function uniqPaths(paths: string[]): string[] {
  return [...new Set(paths.map(item => path.resolve(item)))];
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isSkippableSkillDir(dirName: string): boolean {
  return dirName.startsWith('.') || dirName.includes('.bak.');
}

function parseSkillDocument(content: string): ParsedSkillDoc {
  const emptyFrontmatter: SkillFrontmatter = {
    name: null,
    author: null,
    source: null,
    description: null,
    license: null,
    department: null,
  };

  if (!content.startsWith('---')) {
    return { frontmatter: emptyFrontmatter, body: content.trim() };
  }

  const lines = content.split('\n');
  let endIndex = -1;
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index].trim() === '---') {
      endIndex = index;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: emptyFrontmatter, body: content.trim() };
  }

  const frontmatterLines = lines.slice(1, endIndex);
  const frontmatter: SkillFrontmatter = { ...emptyFrontmatter };

  for (const line of frontmatterLines) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.+)\s*$/);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim().replace(/^['"]|['"]$/g, '');
    if (key === 'name') frontmatter.name = value;
    if (key === 'author') frontmatter.author = value;
    if (key === 'source') frontmatter.source = value;
    if (key === 'description') frontmatter.description = value;
    if (key === 'license') frontmatter.license = value;
    if (key === 'department') frontmatter.department = value;
  }

  return {
    frontmatter,
    body: lines.slice(endIndex + 1).join('\n').trim(),
  };
}

function parseSkillFrontmatter(filePath: string): SkillFrontmatter {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return parseSkillDocument(content).frontmatter;
  } catch {
    return { name: null, author: null, source: null, description: null, license: null, department: null };
  }
}

function summarizeSkillBody(body: string, fallback = ''): string {
  const lines = body
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  for (const rawLine of lines) {
    const line = rawLine.replace(/^[#>*\-+\d.\s]+/, '').trim();
    if (!line || /^```/.test(line)) continue;
    return line.length > 180 ? `${line.slice(0, 177)}...` : line;
  }

  return fallback;
}

function copyDirectory(fromDir: string, toDir: string) {
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const sourcePath = path.join(fromDir, entry.name);
    const targetPath = path.join(toDir, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function removeDirectoryRecursive(targetDir: string) {
  if (!fs.existsSync(targetDir)) return;
  for (const entry of fs.readdirSync(targetDir, { withFileTypes: true })) {
    const entryPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) removeDirectoryRecursive(entryPath);
    else fs.unlinkSync(entryPath);
  }
  fs.rmdirSync(targetDir);
}

function buildSkillSourceDescriptors(): SkillSourceDescriptor[] {
  const sources: SkillSourceDescriptor[] = [];
  const seenRoots = new Set<string>();

  const pushSource = (source: Omit<SkillSourceDescriptor, 'root'> & { root: string | null | undefined }) => {
    if (!source.root || !fs.existsSync(source.root)) return;
    const resolvedRoot = path.resolve(source.root);
    if (seenRoots.has(resolvedRoot)) return;
    seenRoots.add(resolvedRoot);
    sources.push({ ...source, root: resolvedRoot });
  };

  pushSource({
    id: 'agents',
    label: 'Shared Skills',
    ecosystem: 'agents',
    kind: 'library',
    root: path.join(HOME_DIR, '.agents', 'skills'),
    priority: 0,
  });
  pushSource({
    id: 'agent-cli',
    label: 'Agent Skills',
    ecosystem: 'agent',
    kind: 'library',
    root: path.join(HOME_DIR, '.agent', 'skills'),
    priority: 1,
  });
  pushSource({
    id: 'agents-config',
    label: 'Shared Skills',
    ecosystem: 'agents',
    kind: 'library',
    root: AGENTS_SKILLS_ROOT,
    priority: 0,
  });
  pushSource({
    id: 'codex',
    label: 'Codex Skills',
    ecosystem: 'codex',
    kind: 'library',
    root: path.join(HOME_DIR, '.codex', 'skills'),
    priority: 2,
  });
  pushSource({
    id: 'cursor',
    label: 'Cursor Skills',
    ecosystem: 'cursor',
    kind: 'library',
    root: path.join(HOME_DIR, '.cursor', 'skills'),
    priority: 3,
  });
  pushSource({
    id: 'cursor-bootstrap',
    label: 'Cursor Bootstrap Skills',
    ecosystem: 'cursor',
    kind: 'library',
    root: path.join(HOME_DIR, '.cursor', 'skills-cursor'),
    priority: 4,
  });
  pushSource({
    id: 'claude',
    label: 'Claude Skills',
    ecosystem: 'claude',
    kind: 'library',
    root: path.join(HOME_DIR, '.claude', 'skills'),
    priority: 5,
  });
  pushSource({
    id: 'openclaw-library',
    label: 'OpenClaw Skills',
    ecosystem: 'openclaw',
    kind: 'library',
    root: OPENCLAW_SKILLS_ROOT,
    priority: 6,
  });

  // Linked skill repos
  const reposConfig = readSkillsReposConfig();
  reposConfig.repos.forEach((repo, index) => {
    pushSource({
      id: `repo-${repo.id}`,
      label: repo.name,
      ecosystem: 'repo',
      kind: 'linked',
      root: expandPath(repo.skillsRoot),
      priority: 7 + index,
    });
  });

  AGENTS.forEach((agent, index) => {
    pushSource({
      id: `workspace-${agent.id}`,
      label: `${agent.label} Workspace`,
      ecosystem: 'workspace',
      kind: 'workspace',
      root: agent.skillsRoot,
      priority: 10 + index,
      agentId: agent.id,
    });
  });

  return sources.sort((left, right) => left.priority - right.priority);
}

function classifySkillGrouping(text: string) {
  const normalized = text.toLowerCase();

  const purposeRules = [
    { bucket: 'Engineering', keywords: ['code', 'typescript', 'javascript', 'react', 'deploy', 'build', 'api', 'plugin', 'agent', 'hook', 'mcp', 'convex', 'frontend', 'backend'] },
    { bucket: 'Research', keywords: ['research', 'search', 'extract', 'scrape', 'summarize', 'analyze', 'audit', 'watcher', 'monitor'] },
    { bucket: 'Content', keywords: ['copy', 'writing', 'headline', 'email', 'social', 'carousel', 'content', 'seo', 'blog'] },
    { bucket: 'Design', keywords: ['design', 'figma', 'ui', 'ux', 'brand', 'visual', 'layout'] },
    { bucket: 'Growth', keywords: ['marketing', 'ads', 'pricing', 'growth', 'cro', 'launch', 'sales', 'campaign'] },
    { bucket: 'Ops', keywords: ['ops', 'automation', 'cron', 'workflow', 'project', 'process', 'kanban', 'pm'] },
    { bucket: 'Data', keywords: ['data', 'kb', 'knowledge', 'storage', 'schema', 'spreadsheet', 'enrichment'] },
    { bucket: 'Utility', keywords: ['tool', 'utils', 'helper', 'productivity', 'general'] },
  ];

  const departmentRules = [
    { bucket: 'Engineering', keywords: ['code', 'typescript', 'javascript', 'deploy', 'plugin', 'mcp', 'react', 'convex', 'frontend', 'backend'] },
    { bucket: 'Marketing', keywords: ['marketing', 'ads', 'seo', 'launch', 'content', 'copy', 'social', 'pricing', 'growth'] },
    { bucket: 'Product/Design', keywords: ['design', 'figma', 'ui', 'ux', 'product', 'research', 'prototype'] },
    { bucket: 'Sales', keywords: ['sales', 'cold-email', 'pricing', 'founder-sales', 'referral', 'pipeline'] },
    { bucket: 'Operations', keywords: ['ops', 'automation', 'workflow', 'cron', 'project', 'process', 'kanban'] },
    { bucket: 'Knowledge', keywords: ['knowledge', 'kb', 'summarize', 'search', 'extract', 'storage', 'research'] },
  ];

  const pickBucket = (
    rules: Array<{ bucket: string; keywords: string[] }>,
    fallback: string,
  ): { bucket: string; score: number } => {
    let best = { bucket: fallback, score: 0 };
    for (const rule of rules) {
      const score = rule.keywords.reduce((count, keyword) => (
        normalized.includes(keyword) ? count + 1 : count
      ), 0);
      if (score > best.score) best = { bucket: rule.bucket, score };
    }
    return best;
  };

  const purpose = pickBucket(purposeRules, 'Utility');
  const department = pickBucket(departmentRules, 'Operations');
  const confidence = Math.max(0.42, Math.min(0.94, 0.42 + Math.max(purpose.score, department.score) * 0.13));

  return {
    purpose: purpose.bucket,
    department: department.bucket,
    confidence: Number(confidence.toFixed(2)),
    source: 'heuristic' as const,
  };
}

function buildSkillsIndex() {
  const sources = buildSkillSourceDescriptors();
  const skillsMap = new Map<string, SkillsIndexSkill & { _installed: Set<string>; _groupingText: string[] }>();
  const foldersSet = new Map<string, { name: string; root: string; sourceId: string }>();

  const addSkillEntry = (
    source: SkillSourceDescriptor,
    dirName: string,
    skillPath: string,
    folder: string | null,
  ) => {
    const content = fs.readFileSync(skillPath, 'utf8');
    const parsed = parseSkillDocument(content);
    const skillId = slugify(dirName);
    const label = parsed.frontmatter.name || dirName;
    const summary = parsed.frontmatter.description || summarizeSkillBody(parsed.body, `${label} skill`);
    const groupingText = [dirName, label, parsed.frontmatter.description || '', summary, parsed.body.slice(0, 400)].join('\n');

    let isSymlink = false;
    try { isSymlink = fs.lstatSync(path.dirname(skillPath)).isSymbolicLink(); } catch {}

    const variant: SkillsIndexVariant = {
      sourceId: source.id,
      sourceLabel: source.label,
      ecosystem: source.ecosystem,
      kind: source.kind,
      path: skillPath,
      previewPath: skillPath,
      label,
      directoryName: dirName,
      frontmatter: parsed.frontmatter,
      summary,
      sourceRank: source.priority,
      folder,
      isSymlink,
    };

    const existing = skillsMap.get(skillId);
    if (!existing) {
      skillsMap.set(skillId, {
        id: skillId,
        name: label,
        summary,
        variants: [variant],
        installedAgentIds: [],
        missingAgentIds: [],
        grouping: classifySkillGrouping(groupingText),
        _installed: new Set(source.agentId ? [source.agentId] : []),
        _groupingText: [groupingText],
      });
    } else {
      existing.variants.push(variant);
      existing._groupingText.push(groupingText);
      if (source.agentId) existing._installed.add(source.agentId);
    }
  };

  for (const source of sources) {
    const entries = fs.readdirSync(source.root, { withFileTypes: true })
      .filter(entry => entry.isDirectory() && !isSkippableSkillDir(entry.name))
      .map(entry => entry.name)
      .sort((left, right) => left.localeCompare(right));

    for (const dirName of entries) {
      const skillPath = path.join(source.root, dirName, 'SKILL.md');

      if (fs.existsSync(skillPath)) {
        // Direct skill at root level
        addSkillEntry(source, dirName, skillPath, null);
        continue;
      }

      // Check if this is a folder containing skills (one level deep)
      const subDir = path.join(source.root, dirName);
      let hasChildSkills = false;
      try {
        const subEntries = fs.readdirSync(subDir, { withFileTypes: true })
          .filter(entry => entry.isDirectory() && !isSkippableSkillDir(entry.name));
        for (const subEntry of subEntries) {
          const subSkillPath = path.join(subDir, subEntry.name, 'SKILL.md');
          if (fs.existsSync(subSkillPath)) {
            hasChildSkills = true;
            addSkillEntry(source, subEntry.name, subSkillPath, dirName);
          }
        }
      } catch { /* skip unreadable dirs */ }

      if (hasChildSkills) {
        const folderKey = `${source.id}:${dirName}`;
        if (!foldersSet.has(folderKey)) {
          foldersSet.set(folderKey, { name: dirName, root: subDir, sourceId: source.id });
        }
      }
    }
  }

  const resolvedMasterRoot = path.resolve(AGENTS_SKILLS_ROOT);
  const agentIds = AGENTS.filter(agent => agent.skillsRoot).map(agent => agent.id);
  const skills = [...skillsMap.values()]
    .map(skill => {
      skill.variants.sort((left, right) => left.sourceRank - right.sourceRank || left.label.localeCompare(right.label));
      const preferred = skill.variants[0];
      const grouping = classifySkillGrouping(skill._groupingText.join('\n'));
      // Frontmatter department overrides heuristic
      if (preferred?.frontmatter.department) {
        grouping.department = preferred.frontmatter.department;
        grouping.confidence = 1.0;
        grouping.source = 'frontmatter' as any;
      }
      const installedAgentIds = agentIds.filter(agentId => skill._installed.has(agentId));
      const missingAgentIds = agentIds.filter(agentId => !skill._installed.has(agentId));
      const isInMaster = skill.variants.some(v => path.resolve(v.path).startsWith(resolvedMasterRoot + path.sep));

      return {
        id: skill.id,
        name: preferred?.frontmatter.name || preferred?.label || skill.name,
        summary: preferred?.frontmatter.description || preferred?.summary || skill.summary,
        variants: skill.variants,
        installedAgentIds,
        missingAgentIds,
        isInMaster,
        grouping,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));

  const folders = [...foldersSet.values()].sort((a, b) => a.name.localeCompare(b.name));

  return {
    sources: sources.map(source => ({
      id: source.id,
      label: source.label,
      ecosystem: source.ecosystem,
      root: source.root,
      kind: source.kind,
    })),
    agents: AGENTS
      .filter(agent => agent.skillsRoot)
      .map(agent => ({
        id: agent.id,
        label: agent.label,
        emoji: agent.emoji,
        role: agent.role,
        skillsRoot: agent.skillsRoot,
      })),
    skills,
    folders,
    starredSkillIds: (() => {
      const config = readStarredSkillsConfig();
      const liveIds = new Set(skills.map(s => s.id));
      const valid = config.starred.filter(id => liveIds.has(id));
      if (valid.length < config.starred.length) {
        // Prune orphaned starred IDs (deleted/renamed skills)
        const pruned = config.starred.filter(id => !liveIds.has(id));
        for (const id of pruned) delete config.starredAt[id];
        config.starred = valid;
        writeStarredSkillsConfig(config);
      }
      return valid;
    })(),
  };
}

function getAgentById(agentId: string) {
  return AGENTS.find(agent => agent.id === agentId && agent.skillsRoot);
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
    ...buildSkillSourceDescriptors().map(source => source.root),
  ].filter(Boolean);

  ALLOWED_ROOTS = uniqPaths(ALLOWED_ROOTS);

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

function auth(_req, _res, next) {
  return next();
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

app.post('/api/login', (_req, res) => {
  res.cookie('agent_hub_auth', 'open', { httpOnly: false, maxAge: 7*24*3600*1000 });
  return res.json({ ok: true });
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
    instructions: resolveFiles(agent.root, agent.files || []),
    memory: resolveFiles(agent.root, agent.memoryFiles || []),
    pm: resolveFiles(agent.root, agent.pmFiles || []),
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

app.get('/api/skills/index', auth, (_req, res) => {
  try {
    res.json(buildSkillsIndex());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Canvas data: agents + openclaw config enrichment
app.get('/api/canvas/data', auth, (_req, res) => {
  try {
    const ocPath = path.join(OPENCLAW_ROOT, 'openclaw.json');
    let ocConfig: any = {};
    try { ocConfig = JSON.parse(fs.readFileSync(ocPath, 'utf8')); } catch {}

    const ocAgentsList: any[] = ocConfig.agents?.list || [];
    const ocDefaults: any = ocConfig.agents?.defaults || {};
    const bindings: any[] = ocConfig.bindings || [];
    const telegramAccounts: any = ocConfig.channels?.telegram?.accounts || {};

    const agents = AGENTS.map((agent: any) => {
      const ocAgent: any = ocAgentsList.find((a: any) => a.id === agent.id) || {};
      const model = ocAgent.model || ocDefaults.model || {};
      const agentBindings = bindings.filter((b: any) => b.agentId === agent.id);
      const telegramBinding = agentBindings.find((b: any) => b.match?.channel === 'telegram');
      const telegramAccountId = telegramBinding?.match?.accountId || null;
      const telegramAccount = telegramAccountId ? telegramAccounts[telegramAccountId] : null;

      return {
        id: agent.id,
        label: agent.label,
        emoji: agent.emoji,
        role: agent.role,
        model: { primary: model.primary || null, fallbacks: model.fallbacks || [] },
        skills: (ocAgent.skills || []) as string[],
        skillCount: scanSkillsDir(agent.skillsRoot).length,
        subagents: ocAgent.subagents?.allowAgents || [],
        telegram: telegramAccountId ? {
          accountId: telegramAccountId,
          name: telegramAccount?.name || telegramAccountId,
          enabled: telegramAccount?.enabled !== false,
          groupCount: Object.keys(telegramAccount?.groups || {}).length,
          dmPolicy: telegramAccount?.dmPolicy || null,
        } : null,
      };
    });

    const sources = buildSkillSourceDescriptors();
    const skillSources = sources.map((s: any) => ({
      id: s.id,
      label: s.label,
      ecosystem: s.ecosystem,
      kind: s.kind,
      root: s.root,
      count: (() => {
        try {
          return fs.readdirSync(s.root, { withFileTypes: true })
            .filter((e: any) => e.isDirectory() && !isSkippableSkillDir(e.name)
              && fs.existsSync(path.join(s.root, e.name, 'SKILL.md'))).length;
        } catch { return 0; }
      })(),
    }));

    const edges = agents.flatMap((a: any) =>
      a.subagents.map((targetId: string) => ({ from: a.id, to: targetId }))
    );

    res.json({ agents, skillSources, edges, defaults: { model: ocDefaults.model } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
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

app.get('/api/dir', auth, (req, res) => {
  const { path: dirPath } = req.query;
  if (!dirPath || !isAllowed(dirPath)) return res.status(403).send('Forbidden');
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = entries
      .filter(e => !e.name.startsWith('.'))
      .map(e => ({ name: e.name, path: path.join(dirPath, e.name), isDir: e.isDirectory() }))
      .sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    res.json({ files });
  } catch { res.status(404).json({ error: 'Not found' }); }
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

app.post('/api/skill/rename', auth, (req, res) => {
  const { src, newName } = req.body;
  if (!src || !newName) return res.status(400).json({ error: 'src and newName required' });
  if (!isAllowed(src)) return res.status(403).json({ error: 'Not allowed' });
  if (!fs.existsSync(src)) return res.status(404).json({ error: 'File not found' });
  try {
    const srcDir = path.dirname(src);
    const parentDir = path.dirname(srcDir);
    const newDirName = slugify(newName);
    if (!newDirName) return res.status(400).json({ error: 'Invalid name' });
    const targetDir = path.join(parentDir, newDirName);
    if (targetDir !== srcDir && fs.existsSync(targetDir)) {
      return res.status(409).json({ error: 'A skill with that name already exists' });
    }
    // Update name in SKILL.md frontmatter
    const content = fs.readFileSync(src, 'utf8');
    let updated: string;
    if (content.startsWith('---')) {
      const lines = content.split('\n');
      let endIndex = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') { endIndex = i; break; }
      }
      if (endIndex > 0) {
        let nameFound = false;
        for (let i = 1; i < endIndex; i++) {
          if (lines[i].match(/^name:\s*/i)) {
            lines[i] = `name: "${newName}"`;
            nameFound = true;
            break;
          }
        }
        if (!nameFound) lines.splice(1, 0, `name: "${newName}"`);
        updated = lines.join('\n');
      } else {
        updated = `---\nname: "${newName}"\n---\n${content}`;
      }
    } else {
      updated = `---\nname: "${newName}"\n---\n${content}`;
    }
    fs.writeFileSync(src, updated, 'utf8');
    // Rename directory if slug changed
    if (targetDir !== srcDir) {
      fs.renameSync(srcDir, targetDir);
    }
    const newPath = path.join(targetDir, 'SKILL.md');
    res.json({ ok: true, newPath });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/skills/folder/create', auth, (req, res) => {
  const { root, name } = req.body;
  if (!root || !name) return res.status(400).json({ error: 'root and name required' });
  if (!isAllowed(root)) return res.status(403).json({ error: 'Not allowed' });
  const folderName = slugify(name);
  if (!folderName) return res.status(400).json({ error: 'Invalid folder name' });
  const folderPath = path.join(root, folderName);
  if (fs.existsSync(folderPath)) return res.status(409).json({ error: 'Folder already exists' });
  try {
    fs.mkdirSync(folderPath, { recursive: true });
    res.json({ ok: true, path: folderPath });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/skills/assign', auth, (req, res) => {
  const { agentId, variantPath } = req.body;
  if (!agentId || !variantPath) return res.status(400).json({ error: 'agentId and variantPath required' });
  const agent = getAgentById(agentId);
  if (!agent?.skillsRoot) return res.status(404).json({ error: 'Agent not found' });
  if (!isAllowed(variantPath) || !isAllowed(agent.skillsRoot)) return res.status(403).json({ error: 'Not allowed' });

  const index = buildSkillsIndex();
  const variant = index.skills.flatMap(skill => skill.variants).find(item => item.path === variantPath);
  if (!variant) return res.status(404).json({ error: 'Skill variant not found' });

  try {
    const srcDir = path.dirname(variant.path);
    const targetDir = path.join(agent.skillsRoot, variant.directoryName);
    if (fs.existsSync(targetDir)) return res.status(409).json({ error: 'Skill already installed for this agent' });

    // Symlink for master and linked-repo skills; copy for tool-managed skills
    const useSymlink = variant.ecosystem === 'agents' || variant.ecosystem === 'repo';
    if (useSymlink) {
      fs.mkdirSync(path.dirname(targetDir), { recursive: true });
      fs.symlinkSync(srcDir, targetDir, 'dir');
    } else {
      copyDirectory(srcDir, targetDir);
    }
    res.json({ ok: true, dest: path.join(targetDir, 'SKILL.md'), symlink: useSymlink });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/skills/unassign', auth, (req, res) => {
  const { agentId, skillId } = req.body;
  if (!agentId || !skillId) return res.status(400).json({ error: 'agentId and skillId required' });
  const agent = getAgentById(agentId);
  if (!agent?.skillsRoot) return res.status(404).json({ error: 'Agent not found' });

  const index = buildSkillsIndex();
  const skill = index.skills.find(item => item.id === skillId);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });

  const installedVariant = skill.variants.find(variant => (
    variant.kind === 'workspace' && variant.sourceId === `workspace-${agentId}`
  ));
  if (!installedVariant) return res.status(404).json({ error: 'Skill is not installed for this agent' });

  const targetDir = path.dirname(installedVariant.path);
  if (!targetDir.startsWith(path.resolve(agent.skillsRoot) + path.sep) && path.resolve(targetDir) !== path.resolve(agent.skillsRoot)) {
    return res.status(403).json({ error: 'Not allowed' });
  }

  try {
    // Check if it's a symlink — remove symlink only, don't delete real files
    let wasSymlink = false;
    try { wasSymlink = fs.lstatSync(targetDir).isSymbolicLink(); } catch {}
    if (wasSymlink) {
      fs.unlinkSync(targetDir);
    } else {
      removeDirectoryRecursive(targetDir);
    }
    res.json({ ok: true, wasSymlink });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/skill/tag', auth, (req, res) => {
  const { skillId, department } = req.body;
  if (!skillId || !department) return res.status(400).json({ error: 'skillId and department required' });

  const index = buildSkillsIndex();
  const skill = index.skills.find(s => s.id === skillId);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });

  // Use the preferred variant's SKILL.md
  const variant = skill.variants[0];
  if (!variant) return res.status(404).json({ error: 'No variant found' });
  if (!isAllowed(variant.path)) return res.status(403).json({ error: 'Not allowed' });

  // Resolve symlinks to write to the actual file
  let targetPath = variant.path;
  try {
    const dir = path.dirname(targetPath);
    if (fs.lstatSync(dir).isSymbolicLink()) {
      targetPath = path.join(fs.realpathSync(dir), path.basename(targetPath));
    }
  } catch { /* use original path */ }

  try {
    const content = fs.readFileSync(targetPath, 'utf8');
    let updated: string;

    if (content.startsWith('---')) {
      const lines = content.split('\n');
      let endIndex = -1;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '---') { endIndex = i; break; }
      }
      if (endIndex === -1) {
        // Malformed frontmatter — wrap entire content
        updated = `---\ndepartment: ${department}\n---\n${content}`;
      } else {
        // Check if department already exists in frontmatter
        let found = false;
        for (let i = 1; i < endIndex; i++) {
          if (/^department:\s/.test(lines[i])) {
            lines[i] = `department: ${department}`;
            found = true;
            break;
          }
        }
        if (!found) {
          // Insert before closing ---
          lines.splice(endIndex, 0, `department: ${department}`);
        }
        updated = lines.join('\n');
      }
    } else {
      // No frontmatter — add one
      updated = `---\ndepartment: ${department}\n---\n${content}`;
    }

    fs.writeFileSync(targetPath, updated, 'utf8');
    res.json({ ok: true, path: targetPath, department });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
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
// ── CRON JOBS API ─────────────────────────────────────────────

const CRON_JOBS_PATH = path.join(OPENCLAW_ROOT, 'cron', 'jobs.json');

function readCronJobs() {
  if (!fs.existsSync(CRON_JOBS_PATH)) return { version: 1, jobs: [] };
  try { return JSON.parse(fs.readFileSync(CRON_JOBS_PATH, 'utf8')); }
  catch { return { version: 1, jobs: [] }; }
}

function writeCronJobs(data: any) {
  fs.mkdirSync(path.dirname(CRON_JOBS_PATH), { recursive: true });
  // Backup first
  if (fs.existsSync(CRON_JOBS_PATH)) {
    fs.copyFileSync(CRON_JOBS_PATH, CRON_JOBS_PATH + '.bak');
  }
  fs.writeFileSync(CRON_JOBS_PATH, JSON.stringify(data, null, 2));
}

// GET all cron jobs
app.get('/api/crons', auth, (_req, res) => {
  try { res.json(readCronJobs()); }
  catch (e: any) { res.status(500).json({ error: e.message }); }
});

// POST create new cron job
app.post('/api/crons', auth, (req, res) => {
  try {
    const data = readCronJobs();
    const now = Date.now();
    const job = {
      id: crypto.randomUUID(),
      ...req.body,
      createdAtMs: now,
      updatedAtMs: now,
      state: {},
    };
    data.jobs.push(job);
    writeCronJobs(data);
    res.json({ ok: true, job });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// PATCH update cron job
app.patch('/api/crons/:id', auth, (req, res) => {
  try {
    const data = readCronJobs();
    const idx = data.jobs.findIndex((j: any) => j.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Job not found' });
    data.jobs[idx] = { ...data.jobs[idx], ...req.body, updatedAtMs: Date.now() };
    writeCronJobs(data);
    res.json({ ok: true, job: data.jobs[idx] });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// DELETE cron job
app.delete('/api/crons/:id', auth, (req, res) => {
  try {
    const data = readCronJobs();
    const before = data.jobs.length;
    data.jobs = data.jobs.filter((j: any) => j.id !== req.params.id);
    if (data.jobs.length === before) return res.status(404).json({ error: 'Job not found' });
    writeCronJobs(data);
    res.json({ ok: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ── HQ (Headquarters) CONFIG ────────────────────────────────
// Stores linked folder paths for the HQ page

const HQ_CONFIG_PATH = path.join(path.dirname(CONFIG_PATH), 'hq.config.json');

function readHQConfig(): { sources: { id: string; name: string; icon: string; path: string; description: string; color: string }[] } {
  if (fs.existsSync(HQ_CONFIG_PATH)) {
    try { return JSON.parse(fs.readFileSync(HQ_CONFIG_PATH, 'utf8')); }
    catch { /* fall through */ }
  }
  return { sources: [] };
}

function writeHQConfig(config: ReturnType<typeof readHQConfig>) {
  fs.mkdirSync(path.dirname(HQ_CONFIG_PATH), { recursive: true });
  fs.writeFileSync(HQ_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

function refreshHQAllowedRoots() {
  const hqConfig = readHQConfig();
  for (const source of hqConfig.sources) {
    const resolved = path.resolve(expandPath(source.path));
    if (!ALLOWED_ROOTS.includes(resolved)) {
      ALLOWED_ROOTS.push(resolved);
    }
  }
}
refreshHQAllowedRoots();

// ── SKILLS REPOS CONFIG ─────────────────────────────────────
// Stores linked skill repos for the Skills page

const SKILLS_REPOS_CONFIG_PATH = path.join(path.dirname(CONFIG_PATH), 'skills-repos.config.json');

function readSkillsReposConfig(): { repos: SkillsRepoEntry[] } {
  if (fs.existsSync(SKILLS_REPOS_CONFIG_PATH)) {
    try { return JSON.parse(fs.readFileSync(SKILLS_REPOS_CONFIG_PATH, 'utf8')); }
    catch { /* fall through */ }
  }
  return { repos: [] };
}

function writeSkillsReposConfig(config: ReturnType<typeof readSkillsReposConfig>) {
  fs.mkdirSync(path.dirname(SKILLS_REPOS_CONFIG_PATH), { recursive: true });
  fs.writeFileSync(SKILLS_REPOS_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

function refreshSkillsReposAllowedRoots() {
  const config = readSkillsReposConfig();
  for (const repo of config.repos) {
    for (const p of [repo.path, repo.skillsRoot]) {
      const resolved = path.resolve(expandPath(p));
      if (!ALLOWED_ROOTS.includes(resolved)) {
        ALLOWED_ROOTS.push(resolved);
      }
    }
  }
}
refreshSkillsReposAllowedRoots();

// ── STARRED SKILLS CONFIG ────────────────────────────────
const STARRED_SKILLS_CONFIG_PATH = path.join(path.dirname(CONFIG_PATH), 'starred-skills.config.json');

function readStarredSkillsConfig(): { starred: string[]; starredAt: Record<string, string> } {
  if (fs.existsSync(STARRED_SKILLS_CONFIG_PATH)) {
    try { return JSON.parse(fs.readFileSync(STARRED_SKILLS_CONFIG_PATH, 'utf8')); }
    catch { /* fall through */ }
  }
  return { starred: [], starredAt: {} };
}

function writeStarredSkillsConfig(config: ReturnType<typeof readStarredSkillsConfig>) {
  fs.mkdirSync(path.dirname(STARRED_SKILLS_CONFIG_PATH), { recursive: true });
  fs.writeFileSync(STARRED_SKILLS_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
}

app.post('/api/skills/star', auth, (req, res) => {
  const { skillId } = req.body;
  if (!skillId || typeof skillId !== 'string') return res.status(400).json({ error: 'skillId required' });
  const config = readStarredSkillsConfig();
  if (!config.starred.includes(skillId)) {
    config.starred.push(skillId);
    config.starredAt[skillId] = new Date().toISOString();
    writeStarredSkillsConfig(config);
  }
  res.json({ ok: true, starred: config.starred });
});

app.post('/api/skills/unstar', auth, (req, res) => {
  const { skillId } = req.body;
  if (!skillId || typeof skillId !== 'string') return res.status(400).json({ error: 'skillId required' });
  const config = readStarredSkillsConfig();
  config.starred = config.starred.filter((id: string) => id !== skillId);
  delete config.starredAt[skillId];
  writeStarredSkillsConfig(config);
  res.json({ ok: true, starred: config.starred });
});

// Native folder picker — opens OS dialog, returns selected path (async, non-blocking)
app.get('/api/hq/pick-folder', auth, async (_req, res) => {
  const { exec } = await import('child_process');
  const platform = process.platform;

  const runCmd = (cmd: string): Promise<string> =>
    new Promise((resolve, reject) => {
      exec(cmd, { encoding: 'utf8', timeout: 120000 }, (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout.trim());
      });
    });

  try {
    let selected = '';
    if (platform === 'darwin') {
      // macOS: activate to bring dialog to front, then open Finder folder picker
      selected = await runCmd(
        `osascript -e 'activate' -e 'POSIX path of (choose folder with prompt "Select your HQ folder")'`
      );
    } else if (platform === 'linux') {
      try {
        selected = await runCmd('zenity --file-selection --directory --title="Select your HQ folder"');
      } catch {
        selected = await runCmd('kdialog --getexistingdirectory ~');
      }
    } else {
      return res.status(400).json({ error: 'Folder picker not supported on this platform. Enter path manually.' });
    }
    if (!selected) return res.status(400).json({ error: 'No folder selected' });
    selected = selected.replace(/\/+$/, '');
    res.json({ path: selected });
  } catch (e: any) {
    res.status(400).json({ error: 'Folder selection cancelled' });
  }
});

app.get('/api/hq/config', auth, (_req, res) => {
  const config = readHQConfig();
  const sources = config.sources.map(s => {
    const resolved = expandPath(s.path);
    let fileCount = 0;
    try {
      if (fs.existsSync(resolved)) {
        fileCount = fs.readdirSync(resolved, { withFileTypes: true })
          .filter(e => !e.name.startsWith('.')).length;
      }
    } catch { /* ignore */ }
    return { ...s, fileCount, exists: fs.existsSync(resolved) };
  });
  res.json({ sources });
});

app.post('/api/hq/link', auth, (req, res) => {
  const { id, name, icon, path: folderPath, description, color } = req.body;
  if (!id || !name || !folderPath) return res.status(400).json({ error: 'id, name, path required' });
  const resolved = expandPath(folderPath);
  if (!fs.existsSync(resolved)) return res.status(400).json({ error: `Folder does not exist: ${resolved}` });
  const config = readHQConfig();
  const existing = config.sources.findIndex(s => s.id === id);
  const source = { id, name, icon: icon || '📁', path: folderPath, description: description || '', color: color || '#7a5c2e' };
  if (existing >= 0) config.sources[existing] = source;
  else config.sources.push(source);
  writeHQConfig(config);
  refreshHQAllowedRoots();
  res.json({ ok: true, source });
});

app.delete('/api/hq/unlink/:id', auth, (req, res) => {
  const config = readHQConfig();
  config.sources = config.sources.filter(s => s.id !== req.params.id);
  writeHQConfig(config);
  res.json({ ok: true });
});

app.get('/api/hq/tree', auth, (req, res) => {
  const { path: dirPath, depth: depthStr } = req.query as { path: string; depth?: string };
  if (!dirPath) return res.status(400).json({ error: 'path required' });
  const resolved = path.resolve(expandPath(dirPath));
  if (!isAllowed(resolved)) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(resolved)) return res.status(404).json({ error: 'Not found' });
  const maxDepth = parseInt(depthStr || '3', 10);

  function buildTree(dir: string, depth: number): any[] {
    if (depth > maxDepth) return [];
    try {
      return fs.readdirSync(dir, { withFileTypes: true })
        .filter(e => !e.name.startsWith('.'))
        .sort((a, b) => {
          if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
          return a.name.localeCompare(b.name);
        })
        .map(e => {
          const fullPath = path.join(dir, e.name);
          if (e.isDirectory()) {
            return { name: e.name, type: 'folder' as const, path: fullPath, children: buildTree(fullPath, depth + 1) };
          }
          const ext = e.name.includes('.') ? e.name.split('.').pop() : undefined;
          return { name: e.name, type: 'file' as const, path: fullPath, extension: ext };
        });
    } catch { return []; }
  }

  res.json({ files: buildTree(resolved, 0) });
});

// ── SKILLS REPOS API ─────────────────────────────────────────

app.get('/api/skills-repos/config', auth, (_req, res) => {
  const config = readSkillsReposConfig();
  const repos = config.repos.map(repo => {
    const resolvedRoot = expandPath(repo.skillsRoot);
    let skillCount = 0;
    try {
      if (fs.existsSync(resolvedRoot)) {
        const entries = fs.readdirSync(resolvedRoot, { withFileTypes: true });
        skillCount = entries.filter(e => e.isDirectory() && fs.existsSync(path.join(resolvedRoot, e.name, 'SKILL.md'))).length;
      }
    } catch { /* ignore */ }
    let gitBranch: string | null = null;
    let gitDirty = false;
    try {
      const resolvedPath = expandPath(repo.path);
      const { execSync } = require('child_process');
      gitBranch = execSync(`git -C "${resolvedPath}" branch --show-current`, { encoding: 'utf8', timeout: 5000 }).trim();
      const status = execSync(`git -C "${resolvedPath}" status --porcelain`, { encoding: 'utf8', timeout: 5000 }).trim();
      gitDirty = status.length > 0;
    } catch { /* not a git repo or git not available */ }
    return { ...repo, skillCount, exists: fs.existsSync(expandPath(repo.path)), gitBranch, gitDirty };
  });
  res.json({ repos });
});

app.post('/api/skills-repos/link', auth, (req, res) => {
  const { name, path: repoPath, description } = req.body;
  if (!name || !repoPath) return res.status(400).json({ error: 'name and path required' });
  const resolved = expandPath(repoPath);
  if (!fs.existsSync(resolved)) return res.status(400).json({ error: `Path does not exist: ${resolved}` });

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Auto-detect skillsRoot: if root has SKILL.md dirs, use root; otherwise check for skills/ subdir
  let skillsRoot = repoPath;
  const hasSkillsAtRoot = fs.readdirSync(resolved, { withFileTypes: true })
    .some(e => e.isDirectory() && fs.existsSync(path.join(resolved, e.name, 'SKILL.md')));
  if (!hasSkillsAtRoot) {
    const skillsSubdir = path.join(resolved, 'skills');
    if (fs.existsSync(skillsSubdir)) {
      const hasSkillsInSubdir = fs.readdirSync(skillsSubdir, { withFileTypes: true })
        .some(e => e.isDirectory() && fs.existsSync(path.join(skillsSubdir, e.name, 'SKILL.md')));
      if (hasSkillsInSubdir) skillsRoot = path.join(repoPath, 'skills');
    }
  }

  let isGitRepo = false;
  try { isGitRepo = fs.existsSync(path.join(resolved, '.git')); } catch {}

  const config = readSkillsReposConfig();
  const entry: SkillsRepoEntry = { id, name, path: repoPath, skillsRoot, description: description || '', isGitRepo, linkedAt: new Date().toISOString() };
  const existing = config.repos.findIndex(r => r.id === id);
  if (existing >= 0) config.repos[existing] = entry;
  else config.repos.push(entry);
  writeSkillsReposConfig(config);
  refreshSkillsReposAllowedRoots();
  res.json({ ok: true, repo: entry });
});

app.delete('/api/skills-repos/unlink/:id', auth, (req, res) => {
  const config = readSkillsReposConfig();
  const before = config.repos.length;
  config.repos = config.repos.filter(r => r.id !== req.params.id);
  if (config.repos.length === before) return res.status(404).json({ error: 'Repo not found' });
  writeSkillsReposConfig(config);
  res.json({ ok: true });
});

app.post('/api/skills-repos/pull/:id', auth, async (req, res) => {
  const config = readSkillsReposConfig();
  const repo = config.repos.find(r => r.id === req.params.id);
  if (!repo) return res.status(404).json({ error: 'Repo not found' });
  if (!repo.isGitRepo) return res.status(400).json({ error: 'Not a git repo' });

  const resolved = expandPath(repo.path);
  try {
    const { execSync } = require('child_process');
    const output = execSync(`git -C "${resolved}" pull`, { encoding: 'utf8', timeout: 30000 });
    res.json({ ok: true, output: output.trim() });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'git pull failed' });
  }
});

app.post('/api/skills/promote', auth, (req, res) => {
  const { variantPath } = req.body;
  if (!variantPath) return res.status(400).json({ error: 'variantPath required' });
  if (!isAllowed(variantPath)) return res.status(403).json({ error: 'Not allowed' });

  const srcDir = path.dirname(variantPath);
  const dirName = path.basename(srcDir);
  const targetDir = path.join(AGENTS_SKILLS_ROOT, dirName);

  if (fs.existsSync(targetDir)) return res.status(409).json({ error: `Skill "${dirName}" already exists in master` });

  try {
    fs.mkdirSync(AGENTS_SKILLS_ROOT, { recursive: true });
    copyDirectory(srcDir, targetDir);
    res.json({ ok: true, dest: targetDir });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', auth, (_req, res) => {
  if (hasClientBuild) {
    res.sendFile(CLIENT_INDEX);
  } else {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
  }
});
app.listen(PORT, () => console.log(`Agent Hub :${PORT}`));
