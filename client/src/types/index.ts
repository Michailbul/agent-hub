export interface AgentFile {
  name: string
  label: string
  path: string
  source?: 'studio' | 'community' | 'openclaw'
}

export interface Agent {
  id: string
  label: string
  emoji: string
  role: string
  root: string
  instructions: AgentFile[]
  skills: AgentFile[]
}

export interface SkillFile {
  name: string
  label: string
  path: string
  source: 'studio' | 'community' | 'openclaw'
}

export interface SkillLibrary {
  id: string
  label: string
  emoji: string
  root: string
  files: SkillFile[]
}

export interface StudioSection {
  label: string
  emoji: string
  files: AgentFile[]
}

export interface TreeData {
  agents: Agent[]
  libraries: SkillLibrary[]
  studio: StudioSection
}

export interface PaneState {
  id: string
  path: string | null
  label: string | null
  content: string
  isDirty: boolean
  isLocal: boolean
}

export interface AssignTarget {
  emoji: string
  label: string
  files: { label: string; path: string }[]
}

export type FilterSource = 'all' | 'studio' | 'community' | 'openclaw'
