export type ActionStatus = 'inbox' | 'to_analyze' | 'to_write' | 'to_share' | 'reference'

export interface SupportingLink {
  url: string
  label: string
}

export interface ZoteroLink {
  key: string
  title: string
  citation: string
  libraryId: string
  url?: string
}

export interface SavedItem {
  id: string
  areaId: string
  // FIX: Added 'paper' to the union type
  type: 'rss' | 'spark' | 'note' | 'web' | 'paper' | 'social' | string
  title: string
  sourceUrl?: string | null
  imageUrl?: string | null
  supportingLinks?: SupportingLink[]
  zotero?: ZoteroLink | null
  content?: any
  savedAt: any
  tags?: string[]
  actionStatus?: ActionStatus
}
