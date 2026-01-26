import type { Resource } from '@/core/types/domain';

export function transformRssItemToResource(rssItem: any): Omit<Resource, 'id'> {
  return {
    pluginId: 'rss-aggregator',
    externalId: rssItem.link || rssItem.guid,
    title: rssItem.title,
    url: rssItem.link,
    summary: rssItem.contentSnippet || rssItem.description || '',
    publishedAt: new Date(rssItem.pubDate || Date.now()),
    ingestedAt: new Date(),
    status: 'new',
    nativeData: rssItem // Keep the original just in case
  };
}