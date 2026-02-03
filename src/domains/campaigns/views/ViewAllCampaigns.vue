<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useCampaignStore } from '../store';
import { useItemsStore } from '@/core/stores/items';
import { useRouter } from 'vue-router';

const store = useCampaignStore();
const itemsStore = useItemsStore();
const router = useRouter();
const isCreateModalOpen = ref(false);
const newCampaignTitle = ref('');

onMounted(() => {
    store.fetchCampaigns();
    itemsStore.fetchAll();
});

function getNextDate(campaign: any) {
    if (!campaign.dates || campaign.dates.length === 0) return null;
    const sorted = [...campaign.dates]
        .filter(d => d.date) // Ensure date isn't empty
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[0];
}

async function handleCreate() {
    if (!newCampaignTitle.value) return;
    const id = await store.createCampaign(newCampaignTitle.value);
    if (id) {
        isCreateModalOpen.value = false;
        router.push(`/campaigns/${id}`);
    }
}

function toggleTag(tag: string) {
    const index = store.selectedTags.indexOf(tag);
    if (index > -1) store.selectedTags.splice(index, 1);
    else store.selectedTags.push(tag);
}
</script>

<template>
    <div class="campaigns-container">
        <header class="view-header">
            <div class="header-main">
                <h1>Campaigns</h1>
                <button class="primary-btn" @click="isCreateModalOpen = true">+ New Campaign</button>
            </div>

            <div class="filter-section">
                <input v-model="store.searchQuery" placeholder="Search campaigns..." class="search-input" />
                <label class="archive-toggle">
                    <input type="checkbox" v-model="store.showArchived" />
                    <span>Show Archived</span>
                </label>
                <div class="tag-filters">
                    <button v-for="tag in store.allCampaignTags" :key="tag"
                        :class="{ active: store.selectedTags.includes(tag) }" @click="toggleTag(tag)"
                        class="filter-tag">
                        {{ tag }}
                    </button>
                </div>
            </div>
        </header>

        <div class="campaign-grid">
            <div v-for="campaign in store.filteredCampaigns" :key="campaign.id" class="campaign-mini-card"
                :class="{ 'is-archived': campaign.isArchived }" @click="router.push(`/campaigns/${campaign.id}`)">
                <div class="mini-main">
                    <h4>{{ campaign.title }}</h4>
                    <div class="mini-narrative" v-html="campaign.goals.narrative"></div>
                </div>

                <div class="mini-meta">
                    <div v-if="getNextDate(campaign)" class="next-event">
                        <span class="event-label">Next:</span>
                        <span class="event-date">{{ getNextDate(campaign).date }}</span>
                        <span class="event-desc">{{ getNextDate(campaign).description }}</span>
                    </div>
                    <div v-else class="no-event">
                        <span class="event-label">No upcoming dates</span>
                    </div>
                    <div class="link-count">
                        🔗 {{ campaign.linkedItems?.length || 0 }}
                    </div>
                </div>
            </div>
        </div>

    </div>

    <div v-if="isCreateModalOpen" class="modal-overlay" @click.self="isCreateModalOpen = false">
        <div class="modal-content">
            <h3>Start New Campaign</h3>
            <input v-model="newCampaignTitle" placeholder="Enter campaign title..." class="modal-input"
                @keyup.enter="handleCreate" autofocus />
            <div class="modal-actions">
                <button class="cancel-btn" @click="isCreateModalOpen = false">Cancel</button>
                <button class="primary-btn" @click="handleCreate" :disabled="!newCampaignTitle">Create Project</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.campaigns-container {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.view-header {
    margin-bottom: 2rem;
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-content h3 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    color: #111827;
}

.modal-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 1rem;
    margin-bottom: 1.5rem;
    box-sizing: border-box;
    /* Ensures padding doesn't break width */
}

.modal-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.cancel-btn {
    background: transparent;
    border: none;
    color: #6b7280;
    cursor: pointer;
    font-weight: 500;
    padding: 8px 16px;
}

.cancel-btn:hover {
    color: #374151;
    background: #f3f4f6;
    border-radius: 6px;
}

.header-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.archive-toggle {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #555;
    cursor: pointer;
    user-select: none;
    padding-right: 1rem;
    border-right: 1px solid #ddd;
    /* Separator between toggle and tags */
}

.campaign-mini-card.is-archived {
    opacity: 0.6;
    background-color: #f9f9f9;
    border-style: dashed;
}

.archive-toggle input {
    cursor: pointer;
    accent-color: #3498db;
    /* Matches your primary button color */
    width: 16px;
    height: 16px;
}

.filter-section {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    background: #f9fafb;
    padding: 1rem;
    border-radius: 8px;
    border: 1px solid #eee;
}

.search-input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 250px;
}

.tag-filters {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.filter-tag {
    padding: 4px 10px;
    border-radius: 12px;
    border: 1px solid #ddd;
    background: white;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
}

.filter-tag.active {
    background: #3498db;
    color: white;
    border-color: #3498db;
}

/* The Grid */
.campaign-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
}

/* Card Styling (Identical to Dashboard Widget) */
.campaign-mini-card {
    background: white;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 1.25rem;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: all 0.2s ease;
    min-height: 180px;
}

.campaign-mini-card:hover {
    background: #fdfdfd;
    border-color: #3498db;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.mini-main h4 {
    margin: 0 0 8px 0;
    color: #2c3e50;
    font-size: 1.1rem;
}

.mini-narrative {
    font-size: 0.85rem;
    color: #666;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
}

.mini-meta {
    margin-top: 1.25rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
}

.next-event {
    display: flex;
    flex-direction: column;
    font-size: 0.75rem;
}

.event-label {
    color: #999;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 0.65rem;
    letter-spacing: 0.05em;
}

.event-date {
    color: #e67e22;
    font-weight: bold;
}

.event-desc {
    color: #555;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 180px;
}

.no-event {
    font-size: 0.75rem;
    color: #ccc;
    font-style: italic;
}

.link-count {
    font-size: 0.85rem;
    color: #888;
    background: #f5f5f5;
    padding: 2px 8px;
    border-radius: 12px;
}

.primary-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 600;
}
</style>