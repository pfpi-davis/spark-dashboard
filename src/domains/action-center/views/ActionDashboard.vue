<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useItemsStore } from '@/core/stores/items';   // <--- 1. For Items
import { useAreasStore } from '@/domains/areas-of-interest/store'; // <--- 2. For Folders
import type { SavedItem, ActionStatus } from '@/core/types/items';
import ReaderModal from '@/core/components/ReaderModal.vue';
import AddItemModal from '@/core/components/items/AddItemModal.vue';

const itemsStore = useItemsStore();
const areasStore = useAreasStore();

onMounted(() => {
    itemsStore.fetchAll(); // Correct method from itemsStore
    // areasStore is auto-synced by its own watcher, so we don't need to fetch it manually
});

// --- STATE ---
const isViewModalOpen = ref(false);
const itemToView = ref<{ title: string; content: string } | null>(null);

const isAddItemModalOpen = ref(false);
const addItemStatus = ref<ActionStatus>('inbox');

// --- QUEUES ---
// Use itemsStore.items (not activeItems)
const queues = computed(() => {
    const items = itemsStore.items;
    return {
        analyze: items.filter(i => i.actionStatus === 'to_analyze'),
        write: items.filter(i => i.actionStatus === 'to_write'),
        share: items.filter(i => i.actionStatus === 'to_share'),
    };
});

// --- ACTIONS ---
function move(item: SavedItem, status: ActionStatus) {
    itemsStore.updateItemStatus(item.id, status);
}

function openViewModal(item: SavedItem) {
    itemToView.value = {
        title: item.title,
        content: item.content || ''
    };
    isViewModalOpen.value = true;
}

function openAddModal(status: ActionStatus) {
    addItemStatus.value = status;
    isAddItemModalOpen.value = true;
}

// --- DRAG AND DROP HANDLERS ---
const isDragOver = ref<string | null>(null);

function onDragStart(event: DragEvent, item: SavedItem) {
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/json', JSON.stringify({ itemId: item.id }));
    }
}

function onDragEnter(colName: string) {
    isDragOver.value = colName;
}

async function onDrop(event: DragEvent, status: ActionStatus) {
    isDragOver.value = null;
    const data = event.dataTransfer?.getData('application/json');
    if (!data) return;

    try {
        const payload = JSON.parse(data);
        if (payload.itemId) {
            await itemsStore.updateItemStatus(payload.itemId, status);
        }
    } catch (e) {
        console.error("Drop failed", e);
    }
}
</script>

<template>
    <div class="command-center">
        <header>
            <h1>⚡ Action Command Center</h1>
            <p>Triage and process your active knowledge queue.</p>
        </header>

        <div class="dashboard-grid">

            <section class="queue-col analyze-col" :class="{ 'drag-hover': isDragOver === 'analyze' }"
                @dragover.prevent="onDragEnter('analyze')" @dragleave="isDragOver = null"
                @drop="onDrop($event, 'to_analyze')">
                <div class="col-header">
                    <h3>🧐 To Analyze ({{ queues.analyze.length }})</h3>
                    <button class="add-btn" @click="openAddModal('to_analyze')" title="Add Task">+</button>
                </div>
                <div class="list-container">
                    <div v-for="item in queues.analyze" :key="item.id" class="task-row" draggable="true"
                        @dragstart="onDragStart($event, item)">
                        <div class="task-main">
                            <span class="type-dot note"></span>
                            <span class="task-title" @click="openViewModal(item)">{{ item.title }}</span>
                        </div>
                        <div class="task-actions">
                            <button @click="openViewModal(item)">📄 View</button>
                            <button @click="move(item, 'to_write')" title="Promote">➡️ Write</button>
                        </div>
                    </div>
                    <div v-if="queues.analyze.length === 0" class="empty-state">Nothing to analyze.</div>
                </div>
            </section>

            <section class="queue-col write-col" :class="{ 'drag-hover': isDragOver === 'write' }"
                @dragover.prevent="onDragEnter('write')" @dragleave="isDragOver = null"
                @drop="onDrop($event, 'to_write')">
                <div class="col-header">
                    <h3>✍️ To Write ({{ queues.write.length }})</h3>
                    <button class="add-btn" @click="openAddModal('to_write')" title="Add Task">+</button>
                </div>
                <div class="list-container">
                    <div v-for="item in queues.write" :key="item.id" class="task-row" draggable="true"
                        @dragstart="onDragStart($event, item)">
                        <div class="task-main">
                            <span class="type-dot write"></span>
                            <span class="task-title" @click="openViewModal(item)">{{ item.title }}</span>
                        </div>
                        <div class="task-actions">
                            <button @click="openViewModal(item)">📄 View</button>
                            <button @click="move(item, 'to_share')" title="Promote">➡️ Share</button>
                        </div>
                    </div>
                    <div v-if="queues.write.length === 0" class="empty-state">Nothing in writing queue.</div>
                </div>
            </section>

            <section class="queue-col share-col" :class="{ 'drag-hover': isDragOver === 'share' }"
                @dragover.prevent="onDragEnter('share')" @dragleave="isDragOver = null"
                @drop="onDrop($event, 'to_share')">
                <div class="col-header">
                    <h3>📤 To Share ({{ queues.share.length }})</h3>
                    <button class="add-btn" @click="openAddModal('to_share')" title="Add Task">+</button>
                </div>
                <div class="list-container">
                    <div v-for="item in queues.share" :key="item.id" class="task-row" draggable="true"
                        @dragstart="onDragStart($event, item)">
                        <div class="task-main">
                            <span class="type-dot share"></span>
                            <span class="task-title" @click="openViewModal(item)">{{ item.title }}</span>
                        </div>
                        <div class="task-actions">
                            <button @click="openViewModal(item)">📄 View</button>
                            <button @click="move(item, 'reference')" class="done-btn" title="Archive">✅ Sent</button>
                        </div>
                    </div>
                    <div v-if="queues.share.length === 0" class="empty-state">Nothing to share.</div>
                </div>
            </section>

        </div>

        <ReaderModal :is-open="isViewModalOpen" :title="itemToView?.title || ''" :content="itemToView?.content || ''"
            @close="isViewModalOpen = false" />

        <AddItemModal :is-open="isAddItemModalOpen" :folders="areasStore.areas" :initial-area-id="null"
            :initial-status="addItemStatus" @saved="isAddItemModalOpen = false" @close="isAddItemModalOpen = false" />
    </div>
</template>

<style scoped>
/* (Reuse style block from previous turn) */
.command-center {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
}

header {
    margin-bottom: 2rem;
}

h1 {
    margin: 0;
    color: #2c3e50;
}

p {
    color: #666;
    margin-top: 0.5rem;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    flex: 1;
    min-height: 0;
}

.queue-col {
    background: #f8f9fa;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    border: 1px solid #eee;
    transition: background 0.2s, border-color 0.2s;
}

/* Drag Hover Effects */
.queue-col.drag-hover {
    background: #eef2f5;
    border: 2px dashed #3498db;
}

.col-header {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #ddd;
    background: white;
    border-radius: 8px 8px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.col-header h3 {
    margin: 0;
    font-size: 1.1rem;
    color: #333;
}

/* Add Button in Header */
.add-btn {
    background: none;
    border: 1px solid #ddd;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-weight: bold;
    color: #555;
}

.add-btn:hover {
    background: #eee;
    color: #2c3e50;
}

.analyze-col .col-header {
    border-top: 4px solid #f1c40f;
}

.write-col .col-header {
    border-top: 4px solid #e67e22;
}

.share-col .col-header {
    border-top: 4px solid #3498db;
}

.list-container {
    padding: 0.5rem;
    overflow-y: auto;
    flex: 1;
}

.task-row {
    background: white;
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: transform 0.1s;
    cursor: grab;
}

.task-row:active {
    cursor: grabbing;
}

.task-row:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.task-main {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.task-title {
    font-weight: 500;
    cursor: pointer;
    color: #2c3e50;
}

.task-title:hover {
    text-decoration: underline;
    color: #3498db;
}

.task-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    border-top: 1px solid #f0f0f0;
    padding-top: 0.5rem;
}

button {
    background: white;
    border: 1px solid #ddd;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    cursor: pointer;
    color: #555;
}

button:hover {
    background: #eee;
}

.done-btn {
    color: #27ae60;
    border-color: #abebc6;
}

.done-btn:hover {
    background: #eafaf1;
}

.type-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
    background: #ccc;
}

.empty-state {
    text-align: center;
    color: #999;
    padding: 2rem;
    font-style: italic;
    font-size: 0.9rem;
}
</style>