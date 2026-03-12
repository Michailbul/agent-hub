import type { AgentFile } from '.'

export type SidePanelMode =
  | { kind: 'skill-preview'; skillId: string }
  | { kind: 'agent-inspector'; agentId: string }
  | null

export type InspectorActiveItem =
  | { kind: 'file'; path: string }
  | { kind: 'skill'; skillId: string; skillPath: string }
  | { kind: 'skill-file'; skillId: string; path: string }
  | null

export interface SkillDirFile {
  name: string
  path: string
  isDir: boolean
}

export interface AgentSkillPill {
  id: string
  name: string
}

export interface CanvasAgent {
  id: string
  label: string
  emoji: string
  role: string
  model: { primary: string | null; fallbacks: string[] }
  skills: AgentSkillPill[]
  skillCount: number
  subagents: string[]
  telegram: {
    accountId: string
    name: string
    enabled: boolean
    groupCount: number
    dmPolicy: string | null
  } | null
}

export interface PaletteSkill {
  id: string
  name: string
  summary: string
  variantPath: string
  installedAgentIds: string[]
  department: string
  purpose: string
}

export interface AgentFiles {
  instructions: AgentFile[]
  memory: AgentFile[]
  pm: AgentFile[]
}

export interface CanvasData {
  agents: CanvasAgent[]
  defaults: { model: { primary: string; fallbacks: string[] } }
  paletteSkills: PaletteSkill[]
  agentFiles: Record<string, AgentFiles>
}
