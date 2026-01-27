import type { FeedAdapter } from '../types'

export const rssAdapter: FeedAdapter = {
  validateUrl: (url: string) => !url.includes('federalregister.gov'), // Simple check

  async fetch(sourceUrl: string, keywords?: string[]) {
    // 1. Hit the Netlify Proxy
    const proxyUrl = `/.netlify/functions/fetch-feed?url=${encodeURIComponent(sourceUrl)}`
    const res = await fetch(proxyUrl)
    if (!res.ok) throw new Error('Proxy failed')

    const xmlText = await res.text()
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml')
    const items = xmlDoc.querySelectorAll('item')
    const channelTitle = xmlDoc.querySelector('channel > title')?.textContent || 'Blog Feed'

    // 2. Map to Spark "Resource" format
    return Array.from(items).map((item) => ({
      pluginId: 'feed-aggregator',
      externalId:
        item.querySelector('guid')?.textContent || item.querySelector('link')?.textContent || '',
      title: item.querySelector('title')?.textContent || 'No Title',
      url: item.querySelector('link')?.textContent || '',
      summary:
        item
          .querySelector('description')
          ?.textContent?.replace(/<[^>]*>?/gm, '')
          .substring(0, 150) + '...',
      publishedAt: new Date(item.querySelector('pubDate')?.textContent || Date.now()),
      ingestedAt: new Date(),
      status: 'new',
      nativeData: { source: 'rss', channel: channelTitle },
    }))
  },
}
