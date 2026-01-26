import type { FeedAdapter } from '../types';

export const congressAdapter: FeedAdapter = {
  validateUrl: (url: string) => url.includes('congress.gov'),

  async fetch(sourceUrl: string) {
    // We ignore the specific sourceUrl and just hit our filtered endpoint
    const res = await fetch('/.netlify/functions/fetch-congress');
    if (!res.ok) throw new Error('Congress API failed');
    return await res.json();
  }
};