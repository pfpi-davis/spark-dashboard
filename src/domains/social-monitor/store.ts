import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSocialStore = defineStore('social-monitor', () => {
  const posts = ref<any[]>([])
  const isLoading = ref(false)
  const currentQuery = ref('')

  async function search(query: string) {
    if (!query.trim()) return
    isLoading.value = true
    currentQuery.value = query

    try {
      const res = await fetch(`/.netlify/functions/fetch-bluesky?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Failed to fetch BlueSky')
      const data = await res.json()

      // Ensure we map the CID so we can repost later
      posts.value = data.map((p: any) => ({
        ...p,
        cid: p.cid || p.id, // Fallback if your fetch function isn't returning CID yet
      }))
    } catch (err) {
      console.error(err)
      posts.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function repost(post: any) {
    if (!confirm(`Repost this to your BlueSky feed?`)) return

    try {
      const res = await fetch('/.netlify/functions/repost-bluesky', {
        method: 'POST',
        body: JSON.stringify({ uri: post.id, cid: post.cid }), // ID is the URI in our mapper
      })

      if (!res.ok) throw new Error('Repost failed')

      // Optimistic update
      const target = posts.value.find((p) => p.id === post.id)
      if (target) target.reposts++

      alert('Reposted successfully!')
    } catch (e) {
      alert('Error reposting. Check console.')
      console.error(e)
    }
  }

  return {
    posts,
    isLoading,
    currentQuery,
    search,
    repost,
  }
})
