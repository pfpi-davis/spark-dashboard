import type { Resource } from '@/core/types/domain'

export interface FeedSubscription {
  url: string
  name?: string
  isActive: boolean
  addedAt: Date
  keywords?: string[] // <--- Ensure this is here
}

export interface PublicFeed {
  id: string
  url: string
  description: string
  sharedBy: string
  sharedAt: any
  likes: number
}

// THE FIX: Update this interface signature
export interface FeedAdapter {
  fetch: (url: string, keywords?: string[]) => Promise<Partial<Resource>[]>
  validateUrl: (url: string) => boolean
}
