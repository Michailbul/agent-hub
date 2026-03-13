import type { TreeData, AssignTarget } from '@/types'

export async function fetchTree(): Promise<TreeData> {
  const r = await fetch('/api/tree')
  if (!r.ok) throw new Error('Failed to fetch tree')
  return r.json()
}

export async function fetchFile(path: string): Promise<string> {
  const r = await fetch('/api/file?path=' + encodeURIComponent(path))
  if (!r.ok) throw new Error('Failed to fetch file')
  return r.text()
}

export async function saveFile(path: string, content: string): Promise<void> {
  const r = await fetch('/api/file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, content }),
  })
  if (!r.ok) throw new Error('Save failed')
}

export async function login(password: string): Promise<boolean> {
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  return r.ok
}

export async function logout(): Promise<void> {
  await fetch('/api/logout', { method: 'POST' })
}

export async function fetchSetupStatus(): Promise<{ needsSetup: boolean; cli: string | null }> {
  const r = await fetch('/api/setup/status')
  if (!r.ok) throw new Error('Failed to check setup')
  return r.json()
}

export async function fetchAssignTargets(): Promise<AssignTarget[]> {
  const r = await fetch('/api/assign-targets')
  if (!r.ok) return []
  return r.json()
}

export async function skillCopy(src: string, destDir: string): Promise<void> {
  const r = await fetch('/api/skill/copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src, destDir }),
  })
  if (!r.ok) {
    const j = await r.json()
    throw new Error(j.error || 'Copy failed')
  }
}

export async function skillMove(src: string, destDir: string): Promise<void> {
  const r = await fetch('/api/skill/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src, destDir }),
  })
  if (!r.ok) {
    const j = await r.json()
    throw new Error(j.error || 'Move failed')
  }
}

export async function skillDelete(src: string): Promise<void> {
  const r = await fetch('/api/skill/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ src }),
  })
  if (!r.ok) {
    const j = await r.json()
    throw new Error(j.error || 'Delete failed')
  }
}

// ── Skills Index API ────────────────────────────────────────

export interface SkillsIndexVariant {
  sourceId: string
  sourceLabel: string
  ecosystem: string
  kind: string
  path: string
  previewPath: string
  label: string
  directoryName: string
  frontmatter: {
    name: string | null
    author: string | null
    source: string | null
    description: string | null
    license: string | null
  }
  summary: string
  sourceRank: number
  folder: string | null
  isSymlink: boolean
}

export interface SkillsIndexSkill {
  id: string
  name: string
  summary: string
  variants: SkillsIndexVariant[]
  installedAgentIds: string[]
  missingAgentIds: string[]
  isInMaster: boolean
  grouping: {
    purpose: string
    department: string
    confidence: number
    source: string
  }
}

export interface SkillsIndexSource {
  id: string
  label: string
  ecosystem: string
  root: string
  kind: string
}

export interface SkillsIndexAgent {
  id: string
  label: string
  emoji: string
  role: string
  skillsRoot: string
}

export interface SkillsIndexData {
  sources: SkillsIndexSource[]
  agents: SkillsIndexAgent[]
  skills: SkillsIndexSkill[]
  folders: { name: string; root: string; sourceId: string }[]
  starredSkillIds?: string[]
}

export async function fetchSkillsIndex(): Promise<SkillsIndexData> {
  const r = await fetch('/api/skills/index')
  if (!r.ok) throw new Error('Failed to fetch skills index')
  return r.json()
}

// ── HQ API ──────────────────────────────────────────────────

export async function fetchHQConfig(): Promise<{ sources: any[] }> {
  const r = await fetch('/api/hq/config')
  if (!r.ok) throw new Error('Failed to fetch HQ config')
  return r.json()
}

export async function linkHQFolder(source: {
  id: string; name: string; icon?: string; path: string; description?: string; color?: string
}): Promise<any> {
  const r = await fetch('/api/hq/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(source),
  })
  if (!r.ok) {
    const j = await r.json()
    throw new Error(j.error || 'Link failed')
  }
  return r.json()
}

export async function unlinkHQFolder(id: string): Promise<void> {
  const r = await fetch(`/api/hq/unlink/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Unlink failed')
}

export async function fetchHQTree(folderPath: string): Promise<{ files: any[] }> {
  const r = await fetch('/api/hq/tree?path=' + encodeURIComponent(folderPath))
  if (!r.ok) throw new Error('Failed to fetch directory tree')
  return r.json()
}

// ── Skills Repos API ─────────────────────────────────────────

export interface SkillsRepoEntry {
  id: string
  name: string
  path: string
  skillsRoot: string
  description: string
  isGitRepo: boolean
  linkedAt: string
  skillCount?: number
  exists?: boolean
  gitBranch?: string | null
  gitDirty?: boolean
}

export async function fetchSkillsReposConfig(): Promise<{ repos: SkillsRepoEntry[] }> {
  const r = await fetch('/api/skills-repos/config')
  if (!r.ok) throw new Error('Failed to fetch skills repos config')
  return r.json()
}

export async function linkSkillsRepo(data: { name: string; path: string; description?: string }): Promise<any> {
  const r = await fetch('/api/skills-repos/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!r.ok) {
    const j = await r.json()
    throw new Error(j.error || 'Link failed')
  }
  return r.json()
}

export async function unlinkSkillsRepo(id: string): Promise<void> {
  const r = await fetch(`/api/skills-repos/unlink/${id}`, { method: 'DELETE' })
  if (!r.ok) throw new Error('Unlink failed')
}

export async function pullSkillsRepo(id: string): Promise<{ ok: boolean; output: string }> {
  const r = await fetch(`/api/skills-repos/pull/${id}`, { method: 'POST' })
  if (!r.ok) {
    const j = await r.json()
    throw new Error(j.error || 'Pull failed')
  }
  return r.json()
}

export async function promoteSkill(variantPath: string): Promise<any> {
  const r = await fetch('/api/skills/promote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variantPath }),
  })
  if (!r.ok) {
    const j = await r.json()
    throw new Error(j.error || 'Promote failed')
  }
  return r.json()
}
