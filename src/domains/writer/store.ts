import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { useAuthStore } from '@/core/stores/auth'
import type { Draft } from './types'

export const useWriterStore = defineStore('writer', () => {
  const db = getFirestore()
  const auth = useAuthStore()

  const drafts = ref<Draft[]>([])
  const activeDraftId = ref<string | null>(null)
  const isSidebarOpen = ref(true) // Default to having source material open

  let unsubscribe: Unsubscribe | null = null

  // --- ACTIONS ---

  async function createDraft(title: string = 'Untitled Draft') {
    if (!auth.user) return
    const docRef = await addDoc(collection(db, 'users', auth.user.uid, 'drafts'), {
      title,
      content: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    activeDraftId.value = docRef.id
    return docRef.id
  }

  async function updateDraft(id: string, changes: Partial<Draft>) {
    if (!auth.user) return
    const ref = doc(db, 'users', auth.user.uid, 'drafts', id)
    await updateDoc(ref, {
      ...changes,
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteDraft(id: string) {
    if (!auth.user || !confirm('Delete this draft permanently?')) return
    await deleteDoc(doc(db, 'users', auth.user.uid, 'drafts', id))
    if (activeDraftId.value === id) activeDraftId.value = null
  }

  // --- SUBSCRIPTIONS ---

  function fetchDrafts() {
    if (!auth.user) return
    if (unsubscribe) unsubscribe()

    const colRef = collection(db, 'users', auth.user.uid, 'drafts')
    unsubscribe = onSnapshot(colRef, (snap) => {
      drafts.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as Draft)
        .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
    })
  }

  return {
    drafts,
    activeDraftId,
    isSidebarOpen,
    createDraft,
    updateDraft,
    deleteDraft,
    fetchDrafts,
  }
})
