export interface Area {
  id: string
  name: string
  description?: string
  parentId?: string | null // <--- Allows hierarchy/nesting
  createdAt: any
  children?: Area[] // <--- For the tree view in sidebar
}

export interface SavedItem {
  id: string
  areaId: string
  type: 'rss' | 'spark' | 'note' | 'web'
  title: string
  sourceUrl?: string | null // <--- FIX: Explicitly allow 'null' here
  content?: any
  savedAt: any
  tags?: string[]
}
