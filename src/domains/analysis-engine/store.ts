import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getFirestore, doc, setDoc, collection, onSnapshot } from 'firebase/firestore'
import { useAuthStore } from '@/core/stores/auth'
import { generateArticleId } from '@/core/utils/hash'

export const useAnalysisStore = defineStore('analysis-engine', () => {
  const db = getFirestore()
  const auth = useAuthStore()

  // State: Dictionary of ID -> Spark Data
  const sparks = ref<Record<string, any>>({})
  const isAnalyzing = ref(false)

  // 1. WATCHER: Real-time Sync with Firestore
  watch(
    () => auth.user,
    (user) => {
      if (user) {
        const sparksCol = collection(db, 'users', user.uid, 'sparks')
        onSnapshot(sparksCol, (snapshot) => {
          const data: Record<string, any> = {}
          snapshot.forEach((doc) => {
            data[doc.id] = doc.data()
          })
          sparks.value = data
        })
      } else {
        sparks.value = {}
      }
    },
    { immediate: true },
  )

  // 2. ACTION: Analyze Article
  async function analyze(resource: { title: string; summary: string; url: string }) {
    // We require a URL to generate the ID, even if we don't scrape it.
    if (!resource.url) {
      console.error('Cannot analyze item without a sourceUrl (needed for ID generation).')
      return
    }

    isAnalyzing.value = true
    const articleId = generateArticleId(resource.url)

    try {
      // Call Netlify Function
      const res = await fetch('/.netlify/functions/summarize', {
        method: 'POST',
        body: JSON.stringify({
          title: resource.title,
          text: resource.summary, // The clipped content (or RSS snippet)
          url: resource.url, // <--- ADD THIS: Allow backend to scrape if text is missing
        }),
      })

      if (!res.ok) throw new Error('AI request failed')
      const aiData = await res.json()

      // Save to Firestore
      if (auth.user) {
        const sparkDoc = doc(db, 'users', auth.user.uid, 'sparks', articleId)
        await setDoc(sparkDoc, {
          ...aiData,
          originalUrl: resource.url,
          sourceTitle: resource.title,
          createdAt: new Date(),
          type: 'ai-summary',
        })
      }
      return aiData
    } catch (e) {
      console.error('Analysis Failed:', e)
      alert('Analysis failed. See console.')
    } finally {
      isAnalyzing.value = false
    }
  }

  function getSpark(url: string) {
    if (!url) return null // Safety check
    const id = generateArticleId(url)
    return sparks.value[id]
  }

  return { sparks, isAnalyzing, analyze, getSpark }
})
