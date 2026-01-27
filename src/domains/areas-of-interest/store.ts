import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
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
} from 'firebase/firestore'
import { useAuthStore } from '@/core/stores/auth'
import type { Area, SavedItem } from './types'
import DOMPurify from 'dompurify' // <--- 1. IMPORT THIS

export const useAreasStore = defineStore('areas-of-interest', () => {
  const db = getFirestore()
  const auth = useAuthStore()

  const areas = ref<Area[]>([])
  const activeItems = ref<SavedItem[]>([])
  const selectedAreaId = ref<string | null>(null)

  // --- 1. SYNC AREAS (Real-time) ---
  watch(
    () => auth.user,
    (user) => {
      if (user) {
        const colRef = collection(db, 'users', user.uid, 'areas')
        onSnapshot(colRef, (snap) => {
          areas.value = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Area)
            .sort((a, b) => a.name.localeCompare(b.name))
        })
      } else {
        areas.value = []
      }
    },
    { immediate: true },
  )

  // --- 2. ACTIONS: Manage Areas ---
  async function createArea(name: string) {
    if (!auth.user || !name.trim()) return
    await addDoc(collection(db, 'users', auth.user.uid, 'areas'), {
      name: name.trim(),
      createdAt: serverTimestamp(),
    })
  }

  async function deleteArea(areaId: string) {
    if (!auth.user || !confirm('Delete this area and all its saved items?')) return

    // 1. Delete the area folder
    await deleteDoc(doc(db, 'users', auth.user.uid, 'areas', areaId))

    // 2. Note: Items in this area will technically become "orphaned" in Firestore
    // unless you batch delete them. For this MVP, we just clear the view.
    if (selectedAreaId.value === areaId) selectedAreaId.value = null
  }

  // --- 3. ACTIONS: Manage Items ---
  async function saveItemToArea(
    areaId: string,
    item: Omit<SavedItem, 'id' | 'savedAt' | 'areaId'>,
    tags: string[] = [],
  ) {
    if (!auth.user) return

    // 2. SANITIZE CONTENT (If it's a string/html)
    let cleanContent = item.content
    if (typeof item.content === 'string') {
      cleanContent = DOMPurify.sanitize(item.content)
    }

    await addDoc(collection(db, 'users', auth.user.uid, 'saved_items'), {
      ...item,
      content: cleanContent, // Save the clean version
      areaId,
      tags,
      savedAt: serverTimestamp(),
    })
  }
  async function updateItemTags(itemId: string, newTags: string[]) {
    if (!auth.user) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)
    await updateDoc(itemRef, { tags: newTags })
  }

  // NEW: Move Item to different Area
  async function moveItem(itemId: string, newAreaId: string) {
    if (!auth.user) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)
    await updateDoc(itemRef, { areaId: newAreaId })
    // Note: The item will disappear from the current view immediately due to the listener!
  }

  // NEW: Update Item Content (Rich Text / Title)
  async function updateItemContent(itemId: string, newContent: string, newTitle?: string) {
    if (!auth.user) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)

    // 3. SANITIZE ON UPDATE
    const cleanContent = DOMPurify.sanitize(newContent)

    const updates: any = { content: cleanContent }
    if (newTitle) updates.title = newTitle

    await updateDoc(itemRef, updates)
  }

  async function fetchItemsForArea(areaId: string) {
    if (!auth.user) return
    selectedAreaId.value = areaId

    const q = query(
      collection(db, 'users', auth.user.uid, 'saved_items'),
      where('areaId', '==', areaId),
    )

    onSnapshot(q, (snap) => {
      activeItems.value = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as SavedItem)
        .sort((a, b) => (b.savedAt?.seconds || 0) - (a.savedAt?.seconds || 0))
    })
  }

  async function deleteItem(itemId: string) {
    if (!auth.user || !confirm('Remove this saved item?')) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)
    await deleteDoc(itemRef)
  }

  return {
    areas,
    activeItems,
    selectedAreaId,
    createArea,
    deleteArea,
    saveItemToArea,
    updateItemTags,
    fetchItemsForArea,
    deleteItem,
    moveItem, // <--- Export
    updateItemContent, // <--- Export
  }
})
