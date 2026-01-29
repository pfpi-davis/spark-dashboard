<script setup lang="ts">
import { ref, computed } from 'vue';
import { useItemsStore } from '@/core/stores/items';
import { useZoteroStore } from '@/core/stores/zotero';
import type { SavedItem } from '@/core/types/items';

const itemsStore = useItemsStore();
const zoteroStore = useZoteroStore();

// UI State
const activeTab = ref<'saved' | 'zotero'>('saved');
const searchQuery = ref('');
const typeFilter = ref('');
const zSearchQuery = ref('');
let zDebounce: any = null;

// Ensure local items are loaded
if (itemsStore.items.length === 0) itemsStore.fetchAll();

// --- TAB 1: LOCAL ITEMS LOGIC ---
const filteredItems = computed(() => {
    let list = itemsStore.items;
    if (typeFilter.value) list = list.filter(i => i.type === typeFilter.value);
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase();
        list = list.filter(i => i.title.toLowerCase().includes(q));
    }
    return list;
});

// --- TAB 2: ZOTERO LOGIC ---
function onZoteroInput() {
    if (zDebounce) clearTimeout(zDebounce);
    zDebounce = setTimeout(() => {
        if (zSearchQuery.value.length > 2) zoteroStore.searchLibrary(zSearchQuery.value);
    }, 600);
}

// --- DRAG HANDLERS ---
function onDragSavedItem(event: DragEvent, item: SavedItem) {
    if (!event.dataTransfer) return;

    let label = item.title;
    if (item.zotero?.citation && item.zotero.citation !== 'Web Page') {
        label = item.zotero.citation;
    }

    const payload = JSON.stringify({
        origin: 'saved',
        id: item.id,
        title: item.title,
        citation: label,
        // FIX: Prefer sourceUrl, but fallback to Zotero's URL if available
        url: item.sourceUrl || item.zotero?.url
    });

    event.dataTransfer.setData('application/spark-citation', payload);
    event.dataTransfer.effectAllowed = 'copy';
}

function onDragZoteroItem(event: DragEvent, res: any) {
    if (!event.dataTransfer) return;
    const citation = `${res.creators} (${res.date})`;
    const payload = JSON.stringify({
        origin: 'zotero',
        id: null,
        title: res.title,
        citation: citation,
        // This 'url' comes from the store, which we just fixed to be item.data.url
        url: res.url
    });
    event.dataTransfer.setData('application/spark-citation', payload);
    event.dataTransfer.effectAllowed = 'copy';
}
</script>

<template>
    <aside class="source-sidebar">
        <div class="tabs-header">
            <button class="tab-btn" :class="{ active: activeTab === 'saved' }" @click="activeTab = 'saved'">📂 Saved
                Items</button>
            <button class="tab-btn" :class="{ active: activeTab === 'zotero' }" @click="activeTab = 'zotero'">📚
                Zotero</button>
        </div>

        <div v-if="activeTab === 'saved'" class="tab-content">
            <div class="filters">
                <input v-model="searchQuery" placeholder="Filter saved items..." class="search-box" />
                <select v-model="typeFilter" class="type-select">
                    <option value="">All</option>
                    <option value="paper">Papers</option>
                    <option value="rss">RSS</option>
                    <option value="note">Notes</option>
                    <option value="web">Web</option>
                </select>
            </div>
            <div class="items-list">
                <div v-for="item in filteredItems" :key="item.id" class="source-card" :class="item.type"
                    draggable="true" @dragstart="onDragSavedItem($event, item)">
                    <div class="card-header">
                        <span class="type-icon" v-if="item.type === 'paper'">📄</span>
                        <span class="type-icon" v-else-if="item.type === 'rss'">📡</span>
                        <span class="type-icon" v-else-if="item.type === 'note'">📝</span>
                        <span class="type-icon" v-else>🌐</span>
                        <span class="title">{{ item.title }}</span>
                    </div>
                    <div class="card-meta">
                        <span v-if="item.zotero && item.zotero.citation !== 'Web Page'" class="citation-tag">{{
                            item.zotero.citation }}</span>
                        <span v-else class="date-tag">{{ item.savedAt?.toDate ?
                            item.savedAt.toDate().toLocaleDateString() : 'Draft' }}</span>
                    </div>
                </div>
                <div v-if="filteredItems.length === 0" class="empty-state">No saved items found.</div>
            </div>
        </div>

        <div v-if="activeTab === 'zotero'" class="tab-content zotero-mode">
            <div class="filters">
                <input v-model="zSearchQuery" @input="onZoteroInput" placeholder="Search cloud library..."
                    class="search-box z-box" />
            </div>
            <div v-if="zoteroStore.isLoading" class="loading-state">Searching Zotero...</div>
            <div class="items-list">
                <div v-if="!zoteroStore.apiKey" class="empty-state warning">⚠️ API Key missing. Go to an item's "Z" menu
                    to configure.</div>
                <div v-for="res in zoteroStore.searchResults" :key="res.key" class="source-card paper" draggable="true"
                    @dragstart="onDragZoteroItem($event, res)">
                    <div class="card-header">
                        <span class="type-icon">☁️</span>
                        <span class="title">{{ res.title }}</span>
                    </div>
                    <div class="card-meta">
                        <span class="citation-tag">{{ res.creators }} ({{ res.date }})</span>
                        <span v-if="res.url" class="source-tag">🔗 Link</span>
                    </div>
                </div>
                <div v-if="zoteroStore.searchResults.length === 0 && !zoteroStore.isLoading" class="empty-state">{{
                    zSearchQuery ? 'No results found.' : 'Type to search your Zotero library.' }}</div>
            </div>
        </div>
    </aside>
</template>

<style scoped>
/* (Reuse styles from previous step) */
.source-sidebar {
    width: 320px;
    border-left: 1px solid #ddd;
    background: #f8f9fa;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.tabs-header {
    display: flex;
    background: white;
    border-bottom: 1px solid #ddd;
}

.tab-btn {
    flex: 1;
    padding: 10px;
    border: none;
    background: none;
    cursor: pointer;
    border-bottom: 3px solid transparent;
    font-weight: 600;
    color: #777;
    font-size: 0.9rem;
}

.tab-btn.active {
    color: #2c3e50;
    border-bottom-color: #3498db;
    background: #fdfdfd;
}

.tab-btn:hover:not(.active) {
    background: #f0f4f8;
}

.tab-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.filters {
    padding: 0.8rem;
    background: white;
    border-bottom: 1px solid #eee;
    display: flex;
    gap: 0.5rem;
}

.search-box {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
}

.z-box {
    border-color: #3498db;
}

.type-select {
    width: 80px;
    padding: 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.8rem;
}

.items-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.loading-state {
    text-align: center;
    padding: 1rem;
    color: #666;
    font-style: italic;
}

.empty-state {
    text-align: center;
    padding: 2rem;
    color: #999;
    font-size: 0.9rem;
}

.empty-state.warning {
    color: #e67e22;
}

.source-card {
    background: white;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 10px;
    cursor: grab;
    position: relative;
    transition: transform 0.1s;
}

.source-card:active {
    cursor: grabbing;
}

.source-card:hover {
    transform: translateY(-1px);
    border-color: #bbb;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 4px;
}

.type-icon {
    font-size: 1rem;
    padding-top: 1px;
}

.title {
    font-weight: 600;
    font-size: 0.85rem;
    color: #333;
    line-height: 1.3;
}

.card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-size: 0.75rem;
    align-items: center;
}

.citation-tag {
    background: #eafaf1;
    color: #27ae60;
    padding: 2px 6px;
    border-radius: 3px;
    font-weight: 500;
}

.date-tag {
    color: #888;
}

.source-tag {
    background: #f0f4f8;
    color: #555;
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 0.7rem;
}

.source-card.paper {
    border-left: 3px solid #3498db;
}

.source-card.rss {
    border-left: 3px solid #e67e22;
}

.source-card.note {
    border-left: 3px solid #2ecc71;
}

.source-card.web {
    border-left: 3px solid #9b59b6;
}
</style>