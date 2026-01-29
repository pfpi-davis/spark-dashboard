export type ActionStatus = 'inbox' | 'to_analyze' | 'to_write' | 'to_share' | 'reference'

export interface SupportingLink {
  url: string
  label: string // e.g. "Metadata", "AP News Version"
}

export interface SavedItem {
  id: string
  areaId: string
  type: 'rss' | 'spark' | 'note' | 'web'
  title: string
  sourceUrl?: string | null
  // NEW field
  supportingLinks?: SupportingLink[]
  content?: any
  savedAt: any
  tags?: string[]
  actionStatus?: ActionStatus
}
