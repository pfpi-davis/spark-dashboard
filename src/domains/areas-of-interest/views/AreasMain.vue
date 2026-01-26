<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAreasStore } from '../store';
import { useAuthStore } from '@/core/stores/auth';
import { useAnalysisStore } from '@/domains/analysis-engine/store';
import EditTagsModal from '../components/EditTagsModal.vue';

const store = useAreasStore();
const auth = useAuthStore();
const analysisStore = useAnalysisStore();

const activeFilter = ref('');

const isTagModalOpen = ref(false);
const itemToEdit = ref<any>(null); // Holds the item currently being edited

const openTagModal = (item: any) => {
    itemToEdit.value = item;
    isTagModalOpen.value = true;
};

// 2. Handle the Save event from the modal
const handleTagsSaved = async (newTags: string[]) => {
    if (itemToEdit.value) {
        await store.updateItemTags(itemToEdit.value.id, newTags);
        itemToEdit.value = null; // Clear selection
    }
};

// Filter items
const filteredItems = computed(() => {
    if (!activeFilter.value) return store.activeItems;
    return store.activeItems.filter(item =>
        item.tags?.includes(activeFilter.value)
    );
});

const availableTags = computed(() => {
    const allTags = store.activeItems.flatMap(i => i.tags || []);
    return [...new Set(allTags)].sort();
});

// NEW: Simple Tag Editor
const editTags = async (item: any) => {
    const currentTags = item.tags?.join(', ') || '';
    const newTagsString = prompt("Edit Tags (comma separated):", currentTags);

    if (newTagsString !== null) {
        // Clean up the string into an array
        const newTags = newTagsString.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        await store.updateItemTags(item.id, newTags);
    }
};
</script>

<template>
    <div class="areas-layout">
        <aside class="areas-sidebar">
            <h3>📂 My Areas</h3>
            <ul>
                <li v-for="area in store.areas" :key="area.id" :class="{ active: store.selectedAreaId === area.id }"
                    @click="store.fetchItemsForArea(area.id); activeFilter = ''">
                    {{ area.name }}
                </li>
            </ul>
            <div v-if="auth.user && store.areas.length === 0" class="empty-msg">
                No areas yet.
            </div>
        </aside>

        <main class="areas-content">
            <div v-if="!store.selectedAreaId" class="placeholder">
                Select an Area to view saved items.
            </div>

            <div v-else>
                <div class="header">
                    <h2>Items</h2>

                    <div class="filter-bar" v-if="availableTags.length > 0">
                        <span>Filter:</span>
                        <button class="tag-pill" :class="{ active: activeFilter === '' }" @click="activeFilter = ''">
                            All
                        </button>
                        <button v-for="tag in availableTags" :key="tag" class="tag-pill"
                            :class="{ active: activeFilter === tag }" @click="activeFilter = tag">
                            #{{ tag }}
                        </button>
                    </div>

                    <button @click="store.deleteArea(store.selectedAreaId!)" class="delete-btn text-danger">Delete
                        Folder</button>
                </div>

                <div class="items-grid">
                    <div v-for="item in filteredItems" :key="item.id" class="item-card">

                        <div class="top-row">
                            <div class="type-badge">{{ item.type }}</div>
                            <div class="tags-list">
                                <span v-for="tag in item.tags" :key="tag" class="mini-tag">#{{ tag }}</span>
                            </div>
                        </div>

                        <h4>
                            <a v-if="item.sourceUrl" :href="item.sourceUrl" target="_blank">{{ item.title }}</a>
                            <span v-else>{{ item.title }}</span>
                        </h4>

                        <div class="item-meta">
                            Saved: {{ item.savedAt?.toDate().toLocaleDateString() }}
                        </div>

                        <div v-if="item.type === 'spark'" class="spark-preview">
                            ✨ {{ item.content.summary }}
                        </div>

                        <div v-else-if="item.sourceUrl" class="spark-area">
                            <div v-if="analysisStore.getSpark(item.sourceUrl)" class="spark-preview">
                                <div class="ai-header">
                                    <strong>✨ Spark Analysis</strong>
                                    <span class="relevance-badge">{{ analysisStore.getSpark(item.sourceUrl).relevance
                                    }}</span>
                                </div>
                                {{ analysisStore.getSpark(item.sourceUrl).summary }}
                            </div>

                            <button v-else class="spark-btn" @click="analysisStore.analyze({
                                title: item.title,
                                summary: typeof item.content === 'string' ? item.content : '',
                                url: item.sourceUrl
                            })" :disabled="analysisStore.isAnalyzing">
                                {{ analysisStore.isAnalyzing ? 'Thinking...' : '✨ Run Analysis' }}
                            </button>
                        </div>

                        <div class="card-actions">
                            <button class="action-btn" @click="openTagModal(item)">🏷️ Edit Tags</button>
                            <button class="action-btn delete" @click="store.deleteItem(item.id)">🗑️ Delete</button>
                        </div>
                        <EditTagsModal :is-open="isTagModalOpen" :initial-tags="itemToEdit?.tags || []"
                            @save="handleTagsSaved" @close="isTagModalOpen = false" />
                    </div>
                </div>
            </div>
        </main>
    </div>
</template>

<style scoped>
/* ... Keep all existing styles ... */

.areas-layout {
    display: flex;
    height: 100%;
}

.areas-sidebar {
    width: 250px;
    background: #f8f9fa;
    padding: 1rem;
    border-right: 1px solid #ddd;
}

.areas-sidebar ul {
    list-style: none;
    padding: 0;
}

.areas-sidebar li {
    padding: 0.5rem;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 2px;
}

.areas-sidebar li:hover {
    background: #e9ecef;
}

.areas-sidebar li.active {
    background: #2c3e50;
    color: white;
    font-weight: bold;
}

.areas-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.filter-bar {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.tag-pill {
    background: #eee;
    border: none;
    padding: 4px 8px;
    border-radius: 12px;
    cursor: pointer;
    font-size: 0.85rem;
    color: #555;
}

.tag-pill:hover {
    background: #ddd;
}

.tag-pill.active {
    background: #3498db;
    color: white;
    font-weight: bold;
}

.item-card {
    border: 1px solid #eee;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    background: white;
}

.top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.mini-tag {
    font-size: 0.75rem;
    color: #3498db;
    margin-left: 0.5rem;
}

.type-badge {
    display: inline-block;
    background: #eee;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
}

.item-card h4 {
    margin: 0 0 0.5rem 0;
}

.item-meta {
    font-size: 0.8rem;
    color: #888;
}

.spark-area {
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #f0f0f0;
}

.spark-preview {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #555;
    background: #fffdf0;
    padding: 0.5rem;
    border-left: 3px solid #f1c40f;
}

.ai-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    margin-bottom: 4px;
    color: #f39c12;
    font-weight: bold;
}

.spark-btn {
    background: #f1c40f;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    color: #333;
    font-size: 0.85rem;
}

.spark-btn:hover {
    background: #f39c12;
}

/* NEW STYLES */
.card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #f9f9f9;
}

.action-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    color: #555;
}

.action-btn:hover {
    background: #f4f4f4;
}

.action-btn.delete {
    color: #e74c3c;
    border-color: #fadbd8;
}

.action-btn.delete:hover {
    background: #fadbd8;
}

.text-danger {
    color: red;
    background: none;
    border: 1px solid red;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
}
</style>