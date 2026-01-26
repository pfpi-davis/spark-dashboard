import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { useAuthStore } from '@/core/stores/auth';
import { rssAdapter } from './adapters/rssAdapter';
import { govAdapter } from './adapters/govAdapter';
import { newsAdapter } from './adapters/newsAdapter';
import type { Resource } from '@/core/types/domain';
import type { FeedSubscription, PublicFeed } from './types';
import { congressAdapter } from './adapters/congressAdapter';

export const useFeedStore = defineStore('feed-aggregator', () => {
  const db = getFirestore();
  const auth = useAuthStore();
  
  // STATE: Now strictly typed as Objects
  const subscriptions = ref<FeedSubscription[]>([]);
  const resources = ref<Partial<Resource>[]>([]);
  const publicFeeds = ref<PublicFeed[]>([]);
  const isLoading = ref(false);

  // --- 1. PERSISTENCE ---

  async function loadUserConfig() {
    if (!auth.user) return;
    try {
      const userDocRef = doc(db, 'users', auth.user.uid);
      const snap = await getDoc(userDocRef);

      if (snap.exists()) {
        const data = snap.data();
        // MIGRATION: Handle old string[] format if it exists
        if (data.feeds && typeof data.feeds[0] === 'string') {
          subscriptions.value = data.feeds.map((url: string) => ({
            url,
            isActive: true,
            addedAt: new Date()
          }));
        } else {
          subscriptions.value = data.feeds || [];
        }
      } else {
        await setDoc(userDocRef, { feeds: [] });
      }
      fetchAll();
    } catch (e) {
      console.error("Failed to load config:", e);
    }
  }

  async function saveConfig() {
    if (!auth.user) return;
    const userDocRef = doc(db, 'users', auth.user.uid);
    // Save the entire object array
    await updateDoc(userDocRef, { feeds: subscriptions.value });
  }

  // --- 2. MANAGEMENT ACTIONS ---

  async function addSource(url: string) {
    if (subscriptions.value.some(s => s.url === url)) return;
    
    subscriptions.value.push({
      url,
      isActive: true,
      addedAt: new Date()
    });
    
    await saveConfig();
    fetchAll(); 
  }

async function fetchLibrary() {
  try {
    const libCol = collection(db, 'public_library');
    const snap = await getDocs(libCol);
    
    publicFeeds.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as PublicFeed[];
    
  } catch (e) {
    console.error("Failed to load library:", e);
  }
}

async function subscribeFromLibrary(url: string) {
  await addSource(url);
  alert("Subscribed!");
}

  async function removeSource(url: string) {
    subscriptions.value = subscriptions.value.filter(s => s.url !== url);
    resources.value = resources.value.filter(r => r.url !== url);
    await saveConfig();
  }

  // NEW: Hide/Show Logic
  async function toggleSource(url: string) {
    const feed = subscriptions.value.find(s => s.url === url);
    if (feed) {
      feed.isActive = !feed.isActive;
      await saveConfig();
      // Re-fetch to reflect changes (or just filter locally to be faster)
      fetchAll();
    }
  }

  // NEW: Share Logic (Public Library)
  async function shareFeedToLibrary(url: string, description: string = '') {
    if (!auth.user) return alert("Must be logged in");
    
    try {
      // Check if already exists in public library
      const libCol = collection(db, 'public_library');
      const q = query(libCol, where('url', '==', url));
      const snap = await getDocs(q);
      
      if (!snap.empty) return alert("Already in library!");

      await addDoc(libCol, {
        url,
        description,
        sharedBy: auth.user.email,
        sharedAt: new Date(),
        likes: 0
      });
      alert("Shared to Public Library!");
    } catch (e) {
      console.error(e);
      alert("Failed to share.");
    }
  }

  // --- 3. FETCHING ---

  async function fetchAll() {
    isLoading.value = true;
    resources.value = [];

    // FILTER: Only fetch 'isActive' feeds
    const activeFeeds = subscriptions.value.filter(s => s.isActive);

    const promises = activeFeeds.map(async (sub) => {
      try {
        if (newsAdapter.validateUrl(sub.url)) return await newsAdapter.fetch(sub.url);
        if (govAdapter.validateUrl(sub.url)) return await govAdapter.fetch(sub.url);
        if (congressAdapter.validateUrl(sub.url)) return await congressAdapter.fetch(sub.url); 
        return await rssAdapter.fetch(sub.url);
      } catch (err) {
        console.error(`Failed to fetch ${sub.url}`, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    
    resources.value = results.flat().sort((a, b) => {
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    });

    isLoading.value = false;
  }

  async function deleteFeedFromLibrary(feedId: string) {
    if (!auth.user) return;
    
    if (!confirm("Are you sure you want to remove this from the public library?")) return;

    try {
      const feedRef = doc(db, 'public_library', feedId);
      await deleteDoc(feedRef);
      
      // Update local state immediately
      publicFeeds.value = publicFeeds.value.filter(f => f.id !== feedId);
      
    } catch (e) {
      console.error("Failed to delete:", e);
      alert("Could not delete feed.");
    }
  }

  watch(() => auth.user, (u) => {
    if (u) loadUserConfig();
    else {
      subscriptions.value = [];
      resources.value = [];
    }
  }, { immediate: true });

  return {
    subscriptions, // Exporting the objects, not just strings
    resources,
    isLoading,
    addSource,
    removeSource,
    toggleSource,
    shareFeedToLibrary,
    fetchAll,
    publicFeeds,
    fetchLibrary,
    subscribeFromLibrary,
    deleteFeedFromLibrary,
  };
});