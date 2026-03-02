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
