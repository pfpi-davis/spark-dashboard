<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useCampaignStore } from '../store';
import { useItemsStore } from '@/core/stores/items';
import { useRouter } from 'vue-router';

const store = useCampaignStore();
const itemsStore = useItemsStore();
const router = useRouter();

onMounted(() => {
    store.fetchCampaigns();
    if (itemsStore.items.length === 0) itemsStore.fetchAll();
});

function toggleTag(tag: string) {
    const index = store.selectedTags.indexOf(tag);
    if (index > -1) store.selectedTags.splice(index, 1);
    else store.selectedTags.push(tag);
}

function getNextDate(campaign: any) {
    if (!campaign.dates || campaign.dates.length === 0) return null;
    // Sort to find the soonest date (simplistic implementation)
    const sorted = [...campaign.dates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return sorted[0];
}
</script>

<template>
    <section class="campaigns-widget full-width">
        <header class="widget-header">
            <div class="title-group">
                <span class="icon">📣</span>
                <h2>Active Campaigns</h2>
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

        <div class="widget-content">
            <div v-if="store.filteredCampaigns.length === 0" class="empty-state">
                No campaigns match the selected filters.
            </div>

            <div v-for="campaign in store.filteredCampaigns" :key="campaign.id" class="campaign-mini-card"
                @click="router.push(`/campaigns/${campaign.id}`)">
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
                    <div class="link-count">
                        🔗 {{ campaign.linkedItems?.length || 0 }} Links
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.campaigns-widget {
    background: white;
    border-radius: 8px;
    border: 1px solid #ddd;
    display: flex;
    flex-direction: column;
    margin-bottom: 1.5rem;
}

.full-width {
    grid-column: 1 / -1;
    /* Spans full dashboard width */
}

.widget-header {
    padding: 1rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fdfdfd;
}

.title-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.title-group h2 {
    margin: 0;
    font-size: 1.1rem;
}

.widget-filters {
    display: flex;
    align-items: center;
    gap: 12px;
}

.filter-label {
    font-size: 0.8rem;
    color: #777;
    font-weight: 600;
}

.tag-chips {
    display: flex;
    gap: 6px;
}

.tag-chips button {
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid #ddd;
    background: white;
    font-size: 0.75rem;
    cursor: pointer;
}

.tag-chips button.active {
    background: #3498db;
    color: white;
    border-color: #3498db;
}

.widget-content {
    display: flex;
    overflow-x: auto;
    padding: 1rem;
    gap: 1rem;
}

.campaign-mini-card {
    min-width: 300px;
    max-width: 300px;
    border: 1px solid #eee;
    border-radius: 6px;
    padding: 12px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    transition: background 0.2s;
}

.campaign-mini-card:hover {
    background: #f9f9f9;
    border-color: #3498db;
}

.mini-main h4 {
    margin: 0 0 8px 0;
    color: #2c3e50;
}

.mini-narrative {
    font-size: 0.85rem;
    color: #666;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.mini-meta {
    margin-top: 12px;
    padding-top: 8px;
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
    max-width: 140px;
}

.link-count {
    font-size: 0.75rem;
    color: #888;
}

.empty-state {
    width: 100%;
    text-align: center;
    padding: 2rem;
    color: #999;
    font-style: italic;
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
</style>