<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAreasStore } from '../store';
import { useAuthStore } from '@/core/stores/auth';
import { useAnalysisStore } from '@/domains/analysis-engine/store';

// Modals
import EditTagsModal from '../components/EditTagsModal.vue';
import ViewContentModal from '../components/ViewContentModal.vue';
import MoveItemModal from '../components/MoveItemModal.vue';
import EditContentModal from '../components/EditContentModal.vue';
import AreaFormModal from '../components/AreaFormModal.vue'; // <--- NEW IMPORT
import AreaTreeItem from '../components/AreaTreeItem.vue';

const store = useAreasStore();
const auth = useAuthStore();
const analysisStore = useAnalysisStore();

const activeFilter = ref('');

// --- MODAL STATE ---
const isTagModalOpen = ref(false);
const itemToEditTags = ref<any>(null);

const isViewModalOpen = ref(false);
const itemToView = ref<{ title: string; content: string } | null>(null);

const isMoveModalOpen = ref(false);
const itemToMove = ref<any>(null);

const isEditContentModalOpen = ref(false);
const itemToEditContent = ref<any>(null);

// NEW: Area Form Modal State
const isAreaModalOpen = ref(false);
const areaIdToEdit = ref<string | null>(null);

// --- ACTIONS ---

function openCreateAreaModal() {
    areaIdToEdit.value = null; // null = Create Mode
    isAreaModalOpen.value = true;
}

function openEditAreaModal(id: string) {
    areaIdToEdit.value = id;   // string = Edit Mode
    isAreaModalOpen.value = true;
}

function openViewModal(item: any) {
    itemToView.value = {
        title: item.title,
        content: item.content
    };
    isViewModalOpen.value = true;
}

function openTagModal(item: any) {
    itemToEditTags.value = item;
    isTagModalOpen.value = true;
}

function openMoveModal(item: any) {
    itemToMove.value = item;
    isMoveModalOpen.value = true;
}

function openEditContentModal(item: any) {
    itemToEditContent.value = item;
    isEditContentModalOpen.value = true;
}

async function handleTagsSaved(newTags: string[]) {
    if (itemToEditTags.value) {
        await store.updateItemTags(itemToEditTags.value.id, newTags);
        itemToEditTags.value = null;
    }
}

function hasReadableContent(item: any) {
    return item.type === 'note' || (item.content && typeof item.content === 'string');
}

// --- AI ANALYZE LOGIC ---
async function handleAnalyze(item: any) {
    const safeContent = (typeof item.content === 'string') ? item.content : '';
    await analysisStore.analyze({
        title: item.title,
        summary: safeContent,
        url: item.sourceUrl
    });
}

// --- COMPUTED ---
const currentArea = computed(() => {
    return store.areas.find(a => a.id === store.selectedAreaId);
});

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
</script>

<template>
    <div class="areas-layout">
        <aside class="areas-sidebar">
            <div class="sidebar-header">
                <h3>📂 My Areas</h3>
                <button class="add-area-btn" @click="openCreateAreaModal" title="New Area">+</button>
            </div>

            <ul>
                <AreaTreeItem v-for="rootArea in store.areaTree" :key="rootArea.id" :area="rootArea" :depth="0" />
            </ul>
            <div v-if="auth.user && store.areas.length === 0" class="empty-msg">
                No areas yet. Click + to create one.
            </div>
        </aside>

        <main class="areas-content">
            <div v-if="!store.selectedAreaId" class="placeholder">
                <div class="placeholder-content">
                    <h3>Welcome to your Knowledge Base</h3>
                    <p>Select a folder on the left or create a new one.</p>
                    <button class="primary-btn" @click="openCreateAreaModal">Create First Area</button>
                </div>
            </div>

            <div v-else>
                <div class="area-header-block">
                    <div class="title-row">
                        <h2>{{ currentArea?.name }}</h2>
                        <button class="icon-btn edit-area-btn" @click="openEditAreaModal(store.selectedAreaId!)"
                            title="Edit Name & Desc">
                            ✏️
                        </button>
                    </div>
                    <p v-if="currentArea?.description" class="area-desc">{{ currentArea.description }}</p>
                </div>

                <div class="items-header">
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

                    <button @click="store.deleteArea(store.selectedAreaId!)" class="delete-btn text-danger">
                        Delete Folder
                    </button>
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

                        <div v-else class="spark-area">
                            <div v-if="item.sourceUrl && analysisStore.getSpark(item.sourceUrl)" class="spark-preview">
                                <div class="ai-header">
                                    <strong>✨ Spark Analysis</strong>
                                    <span class="relevance-badge">
                                        {{ analysisStore.getSpark(item.sourceUrl).relevance }}
                                    </span>
                                </div>
                                {{ analysisStore.getSpark(item.sourceUrl).summary }}
                            </div>

                            <button v-else-if="item.sourceUrl" class="spark-btn" @click="handleAnalyze(item)"
                                :disabled="analysisStore.isAnalyzing">
                                {{ analysisStore.isAnalyzing ? 'Thinking...' : '✨ Run Analysis' }}
                            </button>
                        </div>

                        <div class="card-actions">
                            <div class="primary-actions">
                                <button v-if="hasReadableContent(item)" class="action-btn view-btn"
                                    @click="openViewModal(item)" title="Read Content">
                                    📄 Read
                                </button>
                                <button class="action-btn" @click="openEditContentModal(item)" title="Edit Content">
                                    ✏️ Edit
                                </button>
                            </div>

                            <div class="secondary-actions">
                                <button class="action-btn" @click="openMoveModal(item)" title="Move">
                                    📦 Move
                                </button>
                                <button class="action-btn" @click="openTagModal(item)" title="Tag">
                                    🏷️ Tag
                                </button>
                                <button class="action-btn delete" @click="store.deleteItem(item.id)" title="Delete">
                                    🗑️
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <EditTagsModal :is-open="isTagModalOpen" :initial-tags="itemToEditTags?.tags || []" @save="handleTagsSaved"
        @close="isTagModalOpen = false" />

    <ViewContentModal :is-open="isViewModalOpen" :title="itemToView?.title || ''" :content="itemToView?.content || ''"
        @close="isViewModalOpen = false" />

    <MoveItemModal :is-open="isMoveModalOpen" :item-id="itemToMove?.id || null" :current-area-id="store.selectedAreaId"
        @saved="isMoveModalOpen = false" @close="isMoveModalOpen = false" />

    <EditContentModal :is-open="isEditContentModalOpen" :item="itemToEditContent"
        @saved="isEditContentModalOpen = false" @close="isEditContentModalOpen = false" />

    <AreaFormModal :is-open="isAreaModalOpen" :edit-id="areaIdToEdit" @saved="isAreaModalOpen = false"
        @close="isAreaModalOpen = false" />
</template>

<style scoped>
/* Reuse existing + Add New */
.areas-layout {
    display: flex;
    height: 100%;
}

.areas-sidebar {
    width: 250px;
    background: #f8f9fa;
    padding: 1rem;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
}

.areas-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
}

/* Sidebar Header */
.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.sidebar-header h3 {
    margin: 0;
}

.add-area-btn {
    background: #2c3e50;
    color: white;
    border: none;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
}

.add-area-btn:hover {
    background: #34495e;
}

.areas-sidebar ul {
    list-style: none;
    padding: 0;
    margin: 0;
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

/* Area Header */
.area-header-block {
    margin-bottom: 2rem;
}

.title-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.title-row h2 {
    margin: 0;
}

.edit-area-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    opacity: 0.5;
}

.edit-area-btn:hover {
    opacity: 1;
    transform: scale(1.1);
}

.area-desc {
    margin: 0.5rem 0 0 0;
    color: #666;
    font-style: italic;
    max-width: 600px;
    line-height: 1.5;
}

/* Items Header (Filter & Delete) */
.items-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

/* Placeholders */
.placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
}

.placeholder-content {
    text-align: center;
}

.placeholder-content .primary-btn {
    margin-top: 1rem;
}

/* Common Button Styles */
.primary-btn {
    background: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.text-danger {
    color: red;
    background: none;
    border: 1px solid red;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
}

/* Filters */
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

/* Item Card */
.items-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.item-card {
    border: 1px solid #eee;
    padding: 1rem;
    border-radius: 8px;
    background: white;
    transition: box-shadow 0.2s;
}

.item-card:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.type-badge {
    background: #eee;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.7rem;
    text-transform: uppercase;
}

.mini-tag {
    font-size: 0.75rem;
    color: #3498db;
    margin-left: 0.5rem;
}

.item-card h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
}

.item-card h4 a {
    text-decoration: none;
    color: #2c3e50;
}

.item-meta {
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 0.5rem;
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

/* Actions */
.card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
    padding-top: 0.5rem;
    border-top: 1px solid #f9f9f9;
}

.primary-actions,
.secondary-actions {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    color: #555;
}

.action-btn:hover {
    background: #f4f4f4;
    border-color: #ccc;
}

.view-btn {
    color: #2c3e50;
    font-weight: 500;
    border-color: #2c3e50;
}

.view-btn:hover {
    background: #f0f4f8;
}

.delete {
    color: #e74c3c;
    border-color: #fadbd8;
}

.delete:hover {
    background: #fadbd8;
}
</style>