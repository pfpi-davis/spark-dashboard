import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  onSnapshot, // <--- The Secret Sauce
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { useAuthStore } from '@/core/stores/auth'
import { useNotificationStore } from '@/core/stores/notifications'
import { rssAdapter } from './adapters/rssAdapter'
import { govAdapter } from './adapters/govAdapter'
import { newsAdapter } from './adapters/newsAdapter'
import { congressAdapter } from './adapters/congressAdapter'
import type { Resource } from '@/core/types/domain'
import type { FeedSubscription, PublicFeed } from './types'

export const useFeedStore = defineStore('feed-aggregator', () => {
  const db = getFirestore()
  const auth = useAuthStore()
  const notifyStore = useNotificationStore()

  // STATE
  const subscriptions = ref<FeedSubscription[]>([])
  const resources = ref<Partial<Resource>[]>([])
  const publicFeeds = ref<PublicFeed[]>([])
  const isLoading = ref(false)

  // Unsubscribe functions (to stop listening when logged out)
  let unsubscribeUser: null | (() => void) = null
  let unsubscribeLibrary: null | (() => void) = null

  // --- 1. REAL-TIME SYNC ---

  function initListeners() {
    // A. Listen to User's Subscriptions
    if (auth.user) {
      const userDocRef = doc(db, 'users', auth.user.uid)

      unsubscribeUser = onSnapshot(
        userDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data()
            // Handle migration from old string[] to new object[] structure
            if (data.feeds && data.feeds.length > 0 && typeof data.feeds[0] === 'string') {
              subscriptions.value = data.feeds.map((url: string) => ({
                url,
                isActive: true,
                addedAt: new Date(),
              }))
            } else {
              subscriptions.value = data.feeds || []
            }

            // Trigger a news fetch whenever subscriptions change
            fetchAll()
          } else {
            // Initialize if missing
            setDoc(userDocRef, { feeds: [] })
            subscriptions.value = []
          }
        },
        (error) => {
          console.error('User sync error:', error)
        },
      )
    }

    // B. Listen to Public Library (Everyone's shares)
    const libCol = collection(db, 'public_library')
    unsubscribeLibrary = onSnapshot(
      libCol,
      (snap) => {
        publicFeeds.value = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as PublicFeed[]
      },
      (error) => {
        console.error('Library sync error:', error)
      },
    )
  }

  // Stop listening when logged out
  function stopListeners() {
    if (unsubscribeUser) unsubscribeUser()
    if (unsubscribeLibrary) unsubscribeLibrary()
    subscriptions.value = []
    resources.value = []
    publicFeeds.value = []
  }

  // --- 2. ACTIONS ---

  async function addSource(url: string) {
    if (subscriptions.value.some((s) => s.url === url)) return

    // We update Firestore. The 'onSnapshot' listener above will
    // catch this change and automatically update 'subscriptions.value' AND trigger 'fetchAll'
    if (auth.user) {
      const userDocRef = doc(db, 'users', auth.user.uid)
      const newFeed: FeedSubscription = {
        url,
        isActive: true,
        addedAt: new Date(),
      }

      // Use arrayUnion to safely add to the list
      await updateDoc(userDocRef, {
        feeds: arrayUnion(newFeed),
      })
      notifyStore.notify('Feed added', 'success')
    }
  }

  async function removeSource(url: string) {
    if (auth.user) {
      const userDocRef = doc(db, 'users', auth.user.uid)
      const feedToRemove = subscriptions.value.find((s) => s.url === url)

      if (feedToRemove) {
        await updateDoc(userDocRef, {
          feeds: arrayRemove(feedToRemove),
        })
        // Manually clear resources for instant feedback
        resources.value = resources.value.filter((r) => r.url !== url)
        notifyStore.notify('Feed removed', 'info')
      }
    }
  }

  async function toggleSource(url: string) {
    if (auth.user) {
      // For toggling, we have to read-modify-write the whole array
      // because Firestore can't toggle a specific field inside an array object easily
      const userDocRef = doc(db, 'users', auth.user.uid)
      const updatedFeeds = subscriptions.value.map((s) =>
        s.url === url ? { ...s, isActive: !s.isActive } : s,
      )

      await updateDoc(userDocRef, { feeds: updatedFeeds })
    }
  }

  // --- 3. NEWS FETCHING ---

  async function fetchAll() {
    // Only fetch if we have active feeds
    const activeFeeds = subscriptions.value.filter((s) => s.isActive)
    if (activeFeeds.length === 0) {
      resources.value = []
      return
    }

    isLoading.value = true
    resources.value = []

    const promises = activeFeeds.map(async (sub) => {
      try {
        if (newsAdapter.validateUrl(sub.url)) return await newsAdapter.fetch(sub.url, sub.keywords)
        if (govAdapter.validateUrl(sub.url)) return await govAdapter.fetch(sub.url, sub.keywords)
        if (congressAdapter.validateUrl(sub.url))
          return await congressAdapter.fetch(sub.url, sub.keywords)
        return await rssAdapter.fetch(sub.url)
      } catch (err) {
        console.error(`Failed to fetch ${sub.url}`, err)
        return []
      }
    })

    const results = await Promise.all(promises)

    resources.value = results.flat().sort((a, b) => {
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
    })

    isLoading.value = false
  }

  // --- 4. LIBRARY ACTIONS ---

  async function shareFeedToLibrary(url: string, description: string = '') {
    if (!auth.user) return notifyStore.notify('Must be logged in', 'error')

    try {
      const libCol = collection(db, 'public_library')
      const q = query(libCol, where('url', '==', url))
      const snap = await getDocs(q) // Check duplicates once

      if (!snap.empty) return notifyStore.notify('Already in library', 'info')

      await addDoc(libCol, {
        url,
        description,
        sharedBy: auth.user.email,
        sharedAt: new Date(),
        likes: 0,
      })
      notifyStore.notify('Shared to Public Library!', 'success')
    } catch (e) {
      console.error(e)
      notifyStore.notify('Failed to share feed.', 'error')
    }
  }

  async function subscribeFromLibrary(url: string) {
    await addSource(url)
  }

  async function deleteFeedFromLibrary(feedId: string) {
    if (!auth.user) return
    try {
      const feedRef = doc(db, 'public_library', feedId)
      await deleteDoc(feedRef)
      notifyStore.notify('Removed from library', 'info')
    } catch (e) {
      notifyStore.notify('Could not delete feed', 'error')
    }
  }

  async function updateFeedSettings(url: string, newKeywords: string[]) {
    if (!auth.user) return

    // Update local state
    const feed = subscriptions.value.find((s) => s.url === url)
    if (feed) {
      feed.keywords = newKeywords
    }

    // Update Firestore
    const userDocRef = doc(db, 'users', auth.user.uid)
    await updateDoc(userDocRef, { feeds: subscriptions.value })

    // Refresh to see new results
    fetchAll()
  }

  // --- WATCH AUTH ---
  watch(
    () => auth.user,
    (u) => {
      if (u) {
        initListeners()
      } else {
        stopListeners()
      }
    },
    { immediate: true },
  )

  return {
    subscriptions,
    resources,
    publicFeeds,
    isLoading,
    addSource,
    removeSource,
    toggleSource,
    fetchAll,
    shareFeedToLibrary,
    subscribeFromLibrary,
    deleteFeedFromLibrary,
    updateFeedSettings,
  }
})
