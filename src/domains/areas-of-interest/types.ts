export interface Area {
  id: string
  name: string
  description?: string
  parentId?: string | null // <--- NEW: The link to the parent folder
  createdAt: any
  children?: Area[] // <--- Runtime only (for the UI tree)
}

export interface SavedItem {
  id: string
  areaId: string
  type: 'rss' | 'spark' | 'note' | 'web'
  title: string
  sourceUrl?: string
  content?: any
  savedAt: any
  tags?: string[]
}
