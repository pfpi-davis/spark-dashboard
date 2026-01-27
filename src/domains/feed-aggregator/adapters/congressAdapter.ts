import type { FeedAdapter } from '../types'

export const congressAdapter: FeedAdapter = {
  validateUrl: (url: string) => url.includes('congress.gov'),

  // Accept the keywords argument
  async fetch(sourceUrl: string, keywords?: string[]) {
    let endpoint = '/.netlify/functions/fetch-congress'

    // If we have keywords, append them to the URL
    if (keywords && keywords.length > 0) {
      const params = new URLSearchParams()
      params.append('keywords', keywords.join(','))
      endpoint += `?${params.toString()}`
    }

    const res = await fetch(endpoint)
    if (!res.ok) throw new Error('Congress API failed')
    return await res.json()
  },
}
