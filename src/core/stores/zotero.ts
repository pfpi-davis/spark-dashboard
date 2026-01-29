import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useZoteroStore = defineStore('zotero', () => {
  const apiKey = ref(localStorage.getItem('zotero_api_key') || '')
  const userId = ref(localStorage.getItem('zotero_user_id') || '')

  const searchResults = ref<any[]>([])
  const isLoading = ref(false)

  function setCredentials(key: string, id: string) {
    if (isNaN(Number(id))) {
      alert('Warning: Zotero User ID is usually a number (e.g. 12345), not a username.')
    }
    apiKey.value = key
    userId.value = id
    localStorage.setItem('zotero_api_key', key)
    localStorage.setItem('zotero_user_id', id)
  }

  function getHeaders() {
    return {
      'Zotero-API-Version': '3',
      Authorization: `Bearer ${apiKey.value}`,
      'Content-Type': 'application/json',
    }
  }

  // 1. CLOUD SEARCH
  async function searchLibrary(query: string) {
    if (!apiKey.value || !query) return
    isLoading.value = true

    try {
      const url = `https://api.zotero.org/users/${userId.value}/items?q=${encodeURIComponent(query)}&itemType=-attachment&limit=10`
      const res = await fetch(url, { headers: getHeaders() })
      if (!res.ok) throw new Error(`Search failed: ${res.status}`)

      const data = await res.json()

      searchResults.value = data.map((item: any) => ({
        key: item.key,
        title: item.data.title || 'Untitled',
        creators: item.data.creators?.map((c: any) => c.lastName || c.name).join(', ') || 'Unknown',
        date: item.data.date || 'n.d.',
        // FIX: Use the actual source URL (item.data.url) instead of the Zotero library link
        url: item.data.url || null,
      }))
    } catch (e) {
      console.error('Zotero Cloud Error:', e)
      searchResults.value = []
    } finally {
      isLoading.value = false
    }
  }

  // 2. CREATE WEB ITEM
  async function createWebItem(title: string, url: string) {
    if (!apiKey.value) return null
    isLoading.value = true

    try {
      const newItem = [
        {
          itemType: 'webpage',
          title: title || 'Untitled',
          url: url || '',
          tags: [{ tag: 'Sent from SPARK' }],
        },
      ]

      const res = await fetch(`https://api.zotero.org/users/${userId.value}/items`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(newItem),
      })

      if (!res.ok) throw new Error('API Error')

      const data = await res.json()
      if (data.successful && data.successful['0']) {
        const created = data.successful['0']
        return {
          key: created.key,
          title: created.data.title,
          citation: 'Web Page',
          libraryId: userId.value,
          // FIX: Ensure the returned object uses the Source URL
          url: created.data.url || null,
        }
      }
      return null
    } catch (e) {
      console.error('Create Failed:', e)
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    apiKey,
    userId,
    searchResults,
    isLoading,
    setCredentials,
    searchLibrary,
    createWebItem,
  }
})
