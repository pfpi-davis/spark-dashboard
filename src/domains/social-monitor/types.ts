export interface SocialPost {
  id: string
  author: {
    handle: string
    displayName: string
    avatar?: string
  }
  content: string
  createdAt: string
  url: string
  likes: number
  reposts: number
}
