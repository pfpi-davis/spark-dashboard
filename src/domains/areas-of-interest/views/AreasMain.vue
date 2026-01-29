<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useAreasStore } from '../store';
import { useItemsStore } from '@/core/stores/items';

// Components
import AreasSidebar from '../components/AreasSidebar.vue';
import ItemCard from '../components/ItemCard.vue';

// Modals
import EditTagsModal from '../components/EditTagsModal.vue';
import ReaderModal from '@/core/components/ReaderModal.vue';
import MoveItemModal from '../components/MoveItemModal.vue';
import EditContentModal from '../components/EditContentModal.vue';
import AreaFormModal from '../components/AreaFormModal.vue';
import AddItemModal from '../components/AddItemModal.vue';

const areasStore = useAreasStore();
const itemsStore = useItemsStore();

// --- STATE ---
const activeFilter = ref(''); // Tag Filter
const searchQuery = ref('');
const typeFilter = ref('');   // NEW: Type Filter
const actionFilter = ref(''); // NEW: Action Filter

// Dropdown States
const isTagMenuOpen = ref(false);
const tagSearchQuery = ref('');
const tagMenuRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);

// Modal State
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

// --- LIFECYCLE ---
onMounted(() => {
    document.addEventListener('click', handleClickOutside);
    if (!areasStore.selectedAreaId) itemsStore.fetchAll();
    else itemsStore.fetchByArea(areasStore.selectedAreaId);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});

// --- HELPER FUNCTIONS ---
function toggleTagMenu() {
    isTagMenuOpen.value = !isTagMenuOpen.value;
    if (isTagMenuOpen.value) {
        tagSearchQuery.value = '';
        nextTick(() => searchInputRef.value?.focus());
    }
}

function selectTag(tag: string) {
    activeFilter.value = tag;
    isTagMenuOpen.value = false;
}

function handleClickOutside(event: MouseEvent) {
    if (tagMenuRef.value && !tagMenuRef.value.contains(event.target as Node)) {
        isTagMenuOpen.value = false;
    }
}

// --- EVENTS ---
function openCreateAreaModal() { areaIdToEdit.value = null; isAreaModalOpen.value = true; }
function openEditAreaModal(id: string) { areaIdToEdit.value = id; isAreaModalOpen.value = true; }
function openAddItemModal() { isAddItemModalOpen.value = true; }

function onRead(item: any) { itemToView.value = { title: item.title, content: item.content }; isViewModalOpen.value = true; }
function onEditContent(item: any) { itemToEditContent.value = item; isEditContentModalOpen.value = true; }
function onMove(item: any) { itemToMove.value = item; isMoveModalOpen.value = true; }
function onTag(item: any) { itemToEditTags.value = item; isTagModalOpen.value = true; }
function onFilterTag(tag: string) { activeFilter.value = tag; } // NEW: Handle tag click from card

async function handleTagsSaved(newTags: string[]) {
    if (itemToEditTags.value) {
        await itemsStore.updateItemTags(itemToEditTags.value.id, newTags);
        itemToEditTags.value = null;
    }
}

// --- COMPUTED ---
const currentArea = computed(() => areasStore.areas.find(a => a.id === areasStore.selectedAreaId));
const pageTitle = computed(() => currentArea.value ? currentArea.value.name : '🗃️ All Items');

const filteredItems = computed(() => {
    let items = itemsStore.items;

    // 1. Tag Filter
    if (activeFilter.value) {
        items = items.filter(item => item.tags?.includes(activeFilter.value));
    }

    // 2. Type Filter
    if (typeFilter.value) {
        items = items.filter(item => item.type === typeFilter.value);
    }

    // 3. Action Filter
    if (actionFilter.value) {
        items = items.filter(item => {
            const status = item.actionStatus || 'inbox';
            return status === actionFilter.value;
        });
    }

    // 4. Text Search
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

const availableTags = computed(() => [...new Set(itemsStore.items.flatMap(i => i.tags || []))].sort());
const displayedTags = computed(() => !tagSearchQuery.value ? availableTags.value : availableTags.value.filter(t => t.toLowerCase().includes(tagSearchQuery.value.toLowerCase())));
</script>

<template>
    <div class="areas-layout">
        <AreasSidebar @create="openCreateAreaModal" />

        <main class="areas-content">
            <div class="area-header-block">
                <div class="title-row">
                    <h2>{{ pageTitle }}</h2>
                    <button v-if="currentArea" class="icon-btn edit-area-btn"
                        @click="openEditAreaModal(areasStore.selectedAreaId!)">✏️</button>
                </div>
                <p v-if="currentArea?.description" class="area-desc">{{ currentArea.description }}</p>
                <p v-else-if="!currentArea" class="area-desc">Viewing all items from all folders.</p>
            </div>

            <div class="items-header">
                <div class="header-left">
                    <button class="primary-btn sm-btn" @click="openAddItemModal">+ Add Entry</button>

                    <select v-model="typeFilter" class="filter-select">
                        <option value="">All Types</option>
                        <option value="rss">RSS</option>
                        <option value="note">Note</option>
                        <option value="web">Web</option>
                        <option value="spark">Spark</option>
                    </select>

                    <select v-model="actionFilter" class="filter-select">
                        <option value="">All Actions</option>
                        <option value="inbox">Inbox</option>
                        <option value="to_analyze">To Analyze</option>
                        <option value="to_write">To Write</option>
                        <option value="to_share">To Share</option>
                        <option value="reference">Reference</option>
                    </select>
                </div>

                <div class="header-right">
                    <div class="search-wrapper">
                        <span class="search-icon">🔍</span>
                        <input v-model="searchQuery" placeholder="Search..." class="search-input" />
                        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">×</button>
                    </div>

                    <div class="filter-dropdown-wrapper" v-if="availableTags.length > 0" ref="tagMenuRef">
                        <button class="filter-trigger" @click="toggleTagMenu" :class="{ 'has-filter': activeFilter }">
                            <span v-if="!activeFilter">🏷️ Tags</span>
                            <span v-else>#{{ activeFilter }}</span>
                        </button>
                        <div v-if="isTagMenuOpen" class="tag-dropdown-menu">
                            <div class="tag-search-box">
                                <input ref="searchInputRef" v-model="tagSearchQuery" placeholder="Find tag..."
                                    @click.stop />
                            </div>
                            <div class="tag-list-scroll">
                                <div class="tag-option all-option" @click="selectTag('')"
                                    :class="{ selected: activeFilter === '' }">Show All</div>
                                <div v-for="tag in displayedTags" :key="tag" class="tag-option"
                                    :class="{ selected: activeFilter === tag }" @click="selectTag(tag)">#{{ tag }}</div>
                            </div>
                        </div>
                    </div>

                    <button v-if="currentArea" @click="areasStore.deleteArea(areasStore.selectedAreaId!)"
                        class="delete-btn text-danger">Delete Folder</button>
                </div>
            </div>

            <div class="items-grid">
                <ItemCard v-for="item in filteredItems" :key="item.id" :item="item" @read="onRead"
                    @edit-content="onEditContent" @move="onMove" @tag="onTag" @filter-tag="onFilterTag" />

                <div v-if="filteredItems.length === 0" class="no-results">
                    <p>No items match your filters.</p>
                    <button v-if="searchQuery || activeFilter || typeFilter || actionFilter" class="text-btn"
                        @click="searchQuery = ''; activeFilter = ''; typeFilter = ''; actionFilter = ''">Clear All
                        Filters</button>
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
.areas-layout {
    display: flex;
    height: 100%;
}

.areas-content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
}

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

.header-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
}

.filter-select {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-size: 0.85rem;
    cursor: pointer;
    background-color: white;
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
    width: 150px;
    font-size: 0.9rem;
    transition: width 0.2s;
}

.search-input:focus {
    outline: none;
    border-color: #3498db;
    width: 200px;
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

/* Filter Dropdown */
.filter-dropdown-wrapper {
    position: relative;
}

.filter-trigger {
    background: white;
    border: 1px solid #ddd;
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.85rem;
    color: #555;
}

.filter-trigger:hover {
    background: #f8f9fa;
}

.filter-trigger.has-filter {
    background: #3498db;
    color: white;
    border-color: #3498db;
}

.tag-dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 6px;
    background: white;
    border: 1px solid #ddd;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 8px;
    width: 220px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.tag-search-box {
    padding: 8px;
    border-bottom: 1px solid #eee;
    background: #fafafa;
}

.tag-search-box input {
    width: 100%;
    padding: 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
}

.tag-list-scroll {
    max-height: 250px;
    overflow-y: auto;
}

.tag-option {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 0.9rem;
    color: #333;
    transition: background 0.1s;
}

.tag-option:hover {
    background: #f0f4f8;
}

.tag-option.selected {
    background: #eafaf1;
    color: #27ae60;
    font-weight: bold;
}

.all-option {
    font-style: italic;
    color: #666;
    border-bottom: 1px solid #eee;
}

.items-grid {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.no-results {
    text-align: center;
    padding: 2rem;
    color: #888;
    background: #f9f9f9;
    border-radius: 8px;
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

.text-btn {
    background: none;
    border: none;
    color: #3498db;
    cursor: pointer;
    text-decoration: underline;
    margin-top: 0.5rem;
}
</style>