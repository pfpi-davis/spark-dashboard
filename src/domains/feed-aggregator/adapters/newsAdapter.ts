import type { FeedAdapter } from '../types';

export const newsAdapter: FeedAdapter = {
  validateUrl: (url: string) => {
    return url.includes('nytimes.com') || url.includes('theguardian.com');
  },

  async fetch(sourceUrl: string) {
    if (sourceUrl.includes('nytimes.com')) {
      const res = await fetch('/.netlify/functions/fetch-nyt');
      if (!res.ok) throw new Error('NYT API failed');
      return await res.json();
    } 
    
    if (sourceUrl.includes('theguardian.com')) {
      const res = await fetch('/.netlify/functions/fetch-guardian');
      if (!res.ok) throw new Error('Guardian API failed');
      return await res.json();
    }
    
    return [];
  }
};