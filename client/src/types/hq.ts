export interface HQSource {
  id: string
  name: string
  icon: string
  path: string
  description: string
  color: string
  fileCount?: number
}

export interface HQFileNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: HQFileNode[]
  extension?: string
}
