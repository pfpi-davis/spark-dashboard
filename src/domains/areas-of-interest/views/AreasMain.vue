<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAreasStore } from '../store';
import { useItemsStore } from '@/core/stores/items';
import { useAuthStore } from '@/core/stores/auth';
import { useAnalysisStore } from '@/core/stores/analysis';
import AreaTreeItem from '../components/AreaTreeItem.vue';

// Modals
import EditTagsModal from '../components/EditTagsModal.vue';
import ReaderModal from '@/core/components/ReaderModal.vue';
import MoveItemModal from '../components/MoveItemModal.vue';
import EditContentModal from '../components/EditContentModal.vue';
import AreaFormModal from '../components/AreaFormModal.vue';
import AddItemModal from '../components/AddItemModal.vue';
import ActionStatusPicker from '../components/ActionStatusPicker.vue';

const areasStore = useAreasStore();
const itemsStore = useItemsStore();
const auth = useAuthStore();
const analysisStore = useAnalysisStore();

const activeFilter = ref('');
const searchQuery = ref('');

// --- MODAL STATE ---
const isTagModalOpen = ref(false);
const itemToEditTags = ref<any>(null);
const isViewModalOpen = ref(false);
const itemToView = ref<{ title: string; content: string } | null>(null);
const isMoveModalOpen = ref(false);
const itemToMove = ref<any>(null);
const isEditContentModalOpen = ref(false);
const itemToEditContent = ref<any>(null);
const isAreaModalOpen = ref(false);
const areaIdToEdit = ref<string | null>(null);
const isAddItemModalOpen = ref(false);

// --- INITIALIZE ---
onMounted(() => {
    // If no folder is selected (default), fetch EVERYTHING
    if (!areasStore.selectedAreaId) {
        itemsStore.fetchAll();
    } else {
        itemsStore.fetchByArea(areasStore.selectedAreaId);
    }
});

function selectAllItems() {
    areasStore.selectedAreaId = null;
    itemsStore.fetchAll();
    activeFilter.value = ''; // Reset filters for clarity
}

// --- ACTIONS ---
function openCreateAreaModal() {
    areaIdToEdit.value = null;
    isAreaModalOpen.value = true;
}

function openEditAreaModal(id: string) {
    areaIdToEdit.value = id;
    isAreaModalOpen.value = true;
}

function openAddItemModal() {
    isAddItemModalOpen.value = true;
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
        await itemsStore.updateItemTags(itemToEditTags.value.id, newTags);
        itemToEditTags.value = null;
    }
}

function hasReadableContent(item: any) {
    return item.type === 'note' || (item.content && typeof item.content === 'string');
}

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
    return areasStore.areas.find(a => a.id === areasStore.selectedAreaId);
});

// "All Items" View Title
const pageTitle = computed(() => {
    return currentArea.value ? currentArea.value.name : '🗃️ All Items';
});

const filteredItems = computed(() => {
    let items = itemsStore.items;

    if (activeFilter.value) {
        items = items.filter(item => item.tags?.includes(activeFilter.value));
    }

    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase();
        items = items.filter(item => {
            const inTitle = item.title.toLowerCase().includes(q);
            const inContent = (typeof item.content === 'string') && item.content.toLowerCase().includes(q);
            const inTags = item.tags?.some(t => t.toLowerCase().includes(q));
            return inTitle || inContent || inTags;
        });
    }

    return items;
});

const availableTags = computed(() => {
    const allTags = itemsStore.items.flatMap(i => i.tags || []);
    return [...new Set(allTags)].sort();
});
</script>

<template>
    <div class="areas-layout">
        <aside class="areas-sidebar">
            <div class="sidebar-header">
                <h3>📂 My Areas</h3>
                <button class="add-area-btn" @click="openCreateAreaModal" title="New Folder">+</button>
            </div>

            <div class="all-items-row" :class="{ active: !areasStore.selectedAreaId }" @click="selectAllItems">
                🗃️ All Items
            </div>

            <ul>
                <AreaTreeItem v-for="rootArea in areasStore.areaTree" :key="rootArea.id" :area="rootArea" :depth="0" />
            </ul>
        </aside>

        <main class="areas-content">
            <div class="area-header-block">
                <div class="title-row">
                    <h2>{{ pageTitle }}</h2>
                    <button v-if="currentArea" class="icon-btn edit-area-btn"
                        @click="openEditAreaModal(areasStore.selectedAreaId!)" title="Edit Folder">
                        ✏️
                    </button>
                </div>
                <p v-if="currentArea?.description" class="area-desc">{{ currentArea.description }}</p>
                <p v-else-if="!currentArea" class="area-desc">Viewing all items from all folders.</p>
            </div>

            <div class="items-header">
                <div class="header-left">
                    <h3>Items</h3>
                    <button class="primary-btn sm-btn" @click="openAddItemModal">
                        + Add Entry
                    </button>
                </div>

                <div class="header-right">
                    <div class="search-wrapper">
                        <span class="search-icon">🔍</span>
                        <input v-model="searchQuery" placeholder="Search items..." class="search-input" />
                        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">×</button>
                    </div>

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

                    <button v-if="currentArea" @click="areasStore.deleteArea(areasStore.selectedAreaId!)"
                        class="delete-btn text-danger">
                        Delete Folder
                    </button>
                </div>
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
                            <ActionStatusPicker :item="item" />
                        </div>

                        <div class="secondary-actions">
                            <button class="action-btn" @click="openMoveModal(item)" title="Move">
                                📦 Move
                            </button>
                            <button class="action-btn" @click="openTagModal(item)" title="Tag">
                                🏷️ Tag
                            </button>
                            <button class="action-btn delete" @click="itemsStore.deleteItem(item.id)" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="filteredItems.length === 0 && (searchQuery || activeFilter)" class="no-results">
                    <p>No items match your filters.</p>
                    <button class="text-btn" @click="searchQuery = ''; activeFilter = ''">Clear Filters</button>
                </div>
                <div v-if="filteredItems.length === 0 && !searchQuery && !activeFilter" class="no-results">
                    <p>No items found.</p>
                </div>
            </div>
        </main>
    </div>

    <EditTagsModal :is-open="isTagModalOpen" :initial-tags="itemToEditTags?.tags || []" @save="handleTagsSaved"
        @close="isTagModalOpen = false" />
    <ReaderModal :is-open="isViewModalOpen" :title="itemToView?.title || ''" :content="itemToView?.content || ''"
        @close="isViewModalOpen = false" />
    <MoveItemModal :is-open="isMoveModalOpen" :item-id="itemToMove?.id || null"
        :current-area-id="areasStore.selectedAreaId" @saved="isMoveModalOpen = false"
        @close="isMoveModalOpen = false" />
    <EditContentModal :is-open="isEditContentModalOpen" :item="itemToEditContent"
        @saved="isEditContentModalOpen = false" @close="isEditContentModalOpen = false" />
    <AreaFormModal :is-open="isAreaModalOpen" :edit-id="areaIdToEdit" @saved="isAreaModalOpen = false"
        @close="isAreaModalOpen = false" />
    <AddItemModal :is-open="isAddItemModalOpen" :area-id="areasStore.selectedAreaId" @saved="isAddItemModalOpen = false"
        @close="isAddItemModalOpen = false" />
</template>

<style scoped>
/* Layout */
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

/* Sidebar */
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

/* NEW: All Items Row */
.all-items-row {
    padding: 8px;
    margin-bottom: 8px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    color: #333;
}

.all-items-row:hover {
    background: #e9ecef;
}

.all-items-row.active {
    background: #34495e;
    color: white;
}

/* Headers */
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

/* Items Toolbar */
.items-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 1rem;
    border-bottom: 2px solid #eee;
    padding-bottom: 0.5rem;
    flex-wrap: wrap;
    gap: 1rem;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.header-left h3 {
    margin: 0;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.search-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.search-input {
    padding: 6px 30px 6px 10px;
    border: 1px solid #ddd;
    border-radius: 20px;
    width: 200px;
    font-size: 0.9rem;
    transition: width 0.2s;
}

.search-input:focus {
    outline: none;
    border-color: #3498db;
    width: 240px;
}

.search-icon {
    position: absolute;
    right: 10px;
    opacity: 0.5;
    font-size: 0.8rem;
    pointer-events: none;
}

.clear-btn {
    position: absolute;
    right: 28px;
    background: none;
    border: none;
    cursor: pointer;
    color: #999;
    font-weight: bold;
}

.clear-btn:hover {
    color: #555;
}

.primary-btn {
    background: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.sm-btn {
    padding: 6px 12px;
    font-size: 0.85rem;
}

.text-danger {
    color: red;
    background: none;
    border: 1px solid red;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
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

/* Grid & Cards */
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
    align-items: center;
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

.no-results {
    text-align: center;
    padding: 2rem;
    color: #888;
    background: #f9f9f9;
    border-radius: 8px;
}

.text-btn {
    background: none;
    border: none;
    color: #3498db;
    cursor: pointer;
    text-decoration: underline;
    margin-top: 0.5rem;
}
</style>