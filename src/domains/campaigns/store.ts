import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { useAuthStore } from '@/core/stores/auth'
import type { Campaign, CampaignDate } from './types'

export const useCampaignStore = defineStore('campaigns', () => {
  const db = getFirestore()
  const auth = useAuthStore()

  const campaigns = ref<Campaign[]>([])
  const searchQuery = ref('')
  const selectedTags = ref<string[]>([])
  const showArchived = ref(false)
  let unsubscribe: Unsubscribe | null = null

  const filteredCampaigns = computed(() => {
    return campaigns.value.filter((c) => {
      const matchesName = c.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchesTags =
        selectedTags.value.length === 0 || selectedTags.value.every((t) => c.tags.includes(t))
      const matchesArchive = showArchived.value ? true : !c.isArchived
      return matchesName && matchesTags && matchesArchive
    })
  })

  async function createCampaign(title: string) {
    if (!auth.user) return
    const docRef = await addDoc(collection(db, 'users', auth.user.uid, 'campaigns'), {
      title,
      tags: [],
      goals: { narrative: '', lineItems: [] },
      dates: [],
      linkedItems: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isArchived: false,
    })
    return docRef.id
  }

  async function toggleArchive(id: string, currentStatus: boolean) {
    // We toggle the current status (true -> false, false -> true)
    await updateCampaign(id, { isArchived: !currentStatus })
  }

  async function updateCampaign(id: string, updates: Partial<Campaign>) {
    if (!auth.user) return
    const campaignRef = doc(db, 'users', auth.user.uid, 'campaigns', id)
    await updateDoc(campaignRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
  }

  function fetchCampaigns() {
    if (!auth.user) return
    if (unsubscribe) unsubscribe()

    const q = query(collection(db, 'users', auth.user.uid, 'campaigns'))
    unsubscribe = onSnapshot(q, (snap) => {
      campaigns.value = snap.docs.map(
        (d) =>
          ({
            id: d.id,
            ...d.data(),
            isArchived: d.data().isArchived || false,
          }) as Campaign,
      )
    })
  }

  async function updateGoals(id: string, narrative: string, lineItems: string[]) {
    await updateCampaign(id, { goals: { narrative, lineItems } })
  }

  async function addImportantDate(id: string, campaign: Campaign) {
    const newDate = { id: crypto.randomUUID(), date: '', description: 'New Event' }
    await updateCampaign(id, { dates: [...campaign.dates, newDate] })
  }

  async function updateImportantDate(
    id: string,
    campaign: Campaign,
    dateId: string,
    updates: Partial<CampaignDate>,
  ) {
    const newDates = campaign.dates.map((d) => (d.id === dateId ? { ...d, ...updates } : d))
    await updateCampaign(id, { dates: newDates })
  }

  async function removeImportantDate(id: string, campaign: Campaign, dateId: string) {
    const newDates = campaign.dates.filter((d) => d.id !== dateId)
    await updateCampaign(id, { dates: newDates })
  }

  return {
    campaigns,
    searchQuery,
    selectedTags,
    filteredCampaigns,
    createCampaign,
    updateCampaign,
    fetchCampaigns,
    addImportantDate,
    updateImportantDate,
    removeImportantDate,
    updateGoals,
    showArchived,
    toggleArchive,
  }
})
