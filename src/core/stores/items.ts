import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  updateDoc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { useAuthStore } from '@/core/stores/auth'
import type { SavedItem, ActionStatus } from '@/core/types/items'
import DOMPurify from 'dompurify'

export const useItemsStore = defineStore('items', () => {
  const db = getFirestore()
  const auth = useAuthStore()

  const items = ref<SavedItem[]>([])
  let unsubscribe: Unsubscribe | null = null

  // --- ACTIONS ---

  /**
   * 1. Create (Save Item)
   * Handles creating a new item in a specific folder.
   */
  async function createItem(
    areaId: string,
    item: Omit<SavedItem, 'id' | 'savedAt' | 'areaId'>,
    tags: string[] = [],
  ) {
    if (!auth.user) return

    // Sanitize rich text content
    let cleanContent = item.content
    if (typeof item.content === 'string') {
      cleanContent = DOMPurify.sanitize(item.content)
    }

    await addDoc(collection(db, 'users', auth.user.uid, 'saved_items'), {
      ...item,
      content: cleanContent,
      areaId,
      tags,
      actionStatus: item.actionStatus || 'inbox',
      savedAt: serverTimestamp(),
    })
  }

  /**
   * 2. Update Details (Generic)
   * Updates core properties: Title, Content, URL, Supporting Links.
   * Replaces the old specific 'updateItemContent'.
   */
  async function updateItemDetails(itemId: string, updates: Partial<SavedItem>) {
    if (!auth.user) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)

    // Sanitize if content is being updated
    if (updates.content && typeof updates.content === 'string') {
      updates.content = DOMPurify.sanitize(updates.content)
    }

    await updateDoc(itemRef, updates)
  }

  /**
   * 3. Update Status (Action Center)
   * Moves item between Inbox -> Analyze -> Write -> Share -> Reference
   */
  async function updateItemStatus(itemId: string, status: ActionStatus) {
    if (!auth.user) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)
    await updateDoc(itemRef, { actionStatus: status })
  }

  /**
   * 4. Update Tags
   */
  async function updateItemTags(itemId: string, newTags: string[]) {
    if (!auth.user) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)
    await updateDoc(itemRef, { tags: newTags })
  }

  /**
   * 5. Move Item (Folder Change)
   */
  async function moveItem(itemId: string, newAreaId: string) {
    if (!auth.user) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)
    await updateDoc(itemRef, { areaId: newAreaId })
  }

  /**
   * 6. Delete Item
   */
  async function deleteItem(itemId: string) {
    if (!auth.user || !confirm('Remove this saved item?')) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)
    await deleteDoc(itemRef)
  }

  // --- FETCHING / SUBSCRIPTIONS ---

  /**
   * Fetch items by Folder (For Areas View)
   */
  function fetchByArea(areaId: string) {
    if (!auth.user) return
    if (unsubscribe) unsubscribe()

    const q = query(
      collection(db, 'users', auth.user.uid, 'saved_items'),
      where('areaId', '==', areaId),
    )

    unsubscribe = onSnapshot(q, (snap) => {
      items.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as SavedItem)
        .sort((a, b) => (b.savedAt?.seconds || 0) - (a.savedAt?.seconds || 0))
    })
  }

  /**
   * Fetch ALL items (For Action Center / Global View)
   */
  function fetchAll() {
    if (!auth.user) return
    if (unsubscribe) unsubscribe()

    const q = query(collection(db, 'users', auth.user.uid, 'saved_items'))

    unsubscribe = onSnapshot(q, (snap) => {
      items.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as SavedItem)
        .sort((a, b) => (b.savedAt?.seconds || 0) - (a.savedAt?.seconds || 0))
    })
  }

  return {
    items,
    createItem,
    updateItemDetails,
    updateItemStatus,
    updateItemTags,
    moveItem,
    deleteItem,
    fetchByArea,
    fetchAll,
  }
})
