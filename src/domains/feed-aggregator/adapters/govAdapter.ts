import type { FeedAdapter } from '../types'

export const govAdapter: FeedAdapter = {
  validateUrl: (url: string) => url.includes('federalregister.gov'),

  async fetch(searchUrl: string, keywords?: string[]) {
    // Logic ported from your 'fetchFederalRegisterDocs'
    const inputUrl = new URL(searchUrl)
    const term = inputUrl.searchParams.get('conditions[term]')
    const agencies = inputUrl.searchParams.getAll('conditions[agencies][]')

    const apiUrl = new URL('https://www.federalregister.gov/api/v1/documents.json')
    if (term) apiUrl.searchParams.set('conditions[term]', term)
    agencies.forEach((agency) => apiUrl.searchParams.append('conditions[agencies][]', agency))

    const today = new Date().toISOString().split('T')[0]
    apiUrl.searchParams.set('conditions[comment_date][gte]', today!) // Future comments only
    apiUrl.searchParams.set('order', 'comment_date')

    const response = await fetch(apiUrl.toString()) // No proxy needed for FedReg!
    const data = await response.json()

    return data.results.map((doc: any) => ({
      pluginId: 'feed-aggregator',
      externalId: doc.html_url,
      title: `[FR] ${doc.title}`, // Add prefix for clarity
      url: doc.html_url,
      summary: doc.abstract || doc.excerpt,
      publishedAt: new Date(doc.publication_date),
      ingestedAt: new Date(),
      status: 'new',
      nativeData: {
        source: 'federal-register',
        agency: doc.agencies?.map((a: any) => a.name).join(', '),
        dueDate: doc.comment_date,
      },
    }))
  },
}
