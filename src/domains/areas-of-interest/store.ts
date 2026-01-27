import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
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
  writeBatch,
} from 'firebase/firestore'
import { useAuthStore } from '@/core/stores/auth'
import type { Area, SavedItem } from './types'
import DOMPurify from 'dompurify'

export const useAreasStore = defineStore('areas-of-interest', () => {
  const db = getFirestore()
  const auth = useAuthStore()

  const areas = ref<Area[]>([])
  const activeItems = ref<SavedItem[]>([])
  const selectedAreaId = ref<string | null>(null)

  // --- GETTER: Tree Structure ---
  // --- GETTER: Tree Structure ---
  // --- GETTER: Tree Structure ---
  const areaTree = computed(() => {
    // 1. Define a strictly typed Node
    type AreaNode = Area & { children: Area[] }

    const map: Record<string, AreaNode> = {}
    const roots: AreaNode[] = []

    // 2. Initialize Map
    areas.value.forEach((a) => {
      map[a.id] = { ...a, children: [] }
    })

    // 3. Build Tree
    areas.value.forEach((a) => {
      const node = map[a.id]
      if (!node) return

      // FIX: Capture parentId to a const so TS knows it won't change
      const pid = a.parentId

      // Check existence using the const 'pid'
      if (pid && map[pid]) {
        map[pid].children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  })

  // --- 1. SYNC ---
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

  // --- 2. ACTIONS: Areas ---

  // UPDATED: Accepts parentId
  async function createArea(
    name: string,
    description: string = '',
    parentId: string | null = null,
  ) {
    if (!auth.user || !name.trim()) return
    await addDoc(collection(db, 'users', auth.user.uid, 'areas'), {
      name: name.trim(),
      description: description.trim(),
      parentId,
      createdAt: serverTimestamp(),
    })
  }

  // UPDATED: Accepts parentId (Moving folders)
  async function updateArea(
    areaId: string,
    name: string,
    description: string = '',
    parentId: string | null = null,
  ) {
    if (!auth.user || !name.trim()) return
    const docRef = doc(db, 'users', auth.user.uid, 'areas', areaId)
    await updateDoc(docRef, {
      name: name.trim(),
      description: description.trim(),
      parentId,
    })
  }

  async function deleteArea(areaId: string) {
    if (!auth.user || !confirm('Delete this folder? (Items will be removed)')) return

    // Simple delete for MVP.
    // Ideally, we'd recursively find children and delete them too.
    // For now, if a parent is deleted, children will visually "pop" to the root level
    // because their parentId no longer exists in the map.
    await deleteDoc(doc(db, 'users', auth.user.uid, 'areas', areaId))

    if (selectedAreaId.value === areaId) selectedAreaId.value = null
  }

  // --- 3. ACTIONS: Items ---
  async function saveItemToArea(
    areaId: string,
    item: Omit<SavedItem, 'id' | 'savedAt' | 'areaId'>,
    tags: string[] = [],
  ) {
    if (!auth.user) return

    let cleanContent = item.content
    if (typeof item.content === 'string') {
      cleanContent = DOMPurify.sanitize(item.content)
    }

    await addDoc(collection(db, 'users', auth.user.uid, 'saved_items'), {
      ...item,
      content: cleanContent,
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

  async function moveItem(itemId: string, newAreaId: string) {
    if (!auth.user) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)
    await updateDoc(itemRef, { areaId: newAreaId })
  }

  async function updateItemContent(itemId: string, newContent: string, newTitle?: string) {
    if (!auth.user) return
    const itemRef = doc(db, 'users', auth.user.uid, 'saved_items', itemId)

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
    areaTree, // <--- Exported Getter
    activeItems,
    selectedAreaId,
    createArea,
    updateArea,
    deleteArea,
    saveItemToArea,
    updateItemTags,
    fetchItemsForArea,
    deleteItem,
    moveItem,
    updateItemContent,
  }
})
