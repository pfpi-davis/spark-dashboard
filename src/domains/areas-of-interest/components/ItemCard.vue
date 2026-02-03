<script setup lang="ts">
import { useAnalysisStore } from '@/core/stores/analysis';
import { useItemsStore } from '@/core/stores/items';
import ActionStatusPicker from './ActionStatusPicker.vue';
import type { SavedItem } from '@/core/types/items';

const props = defineProps<{
    item: SavedItem;
}>();

const emit = defineEmits([
    'read',
    'edit-content',
    'move',
    'tag',
    'filter-tag', 'zotero' // NEW event
]);

const analysisStore = useAnalysisStore();
const itemsStore = useItemsStore();

function hasReadableContent(item: SavedItem) {
    // Social posts have content we display on card, so 'read' button is redundant
    if (item.type === 'social') return false;
    return item.type === 'note' || (item.content && typeof item.content === 'string');
}

async function handleAnalyze() {
    const safeContent = (typeof props.item.content === 'string') ? props.item.content : '';
    await analysisStore.analyze({
        title: props.item.title,
        summary: safeContent,
        url: props.item.sourceUrl || ''
    });
}

// NEW: Drag Start Handler
function onDragStart(event: DragEvent) {
    if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move';
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/json', JSON.stringify({ itemId: props.item.id }));
    }
}


</script>

<template>
    <div class="item-card" draggable="true" @dragstart="onDragStart">
        <div class="top-row">
            <div class="type-badge">{{ item.type }}</div>
            <div class="tags-list">
                <span v-for="tag in item.tags" :key="tag" class="mini-tag clickable"
                    @click.stop="emit('filter-tag', tag)" title="Filter by this tag">
                    #{{ tag }}
                </span>
            </div>
        </div>

        <h4>
            <a v-if="item.sourceUrl" :href="item.sourceUrl" target="_blank">{{ item.title }}</a>
            <span v-else>{{ item.title }}</span>
        </h4>

        <div class="item-meta">
            Saved: {{ item.savedAt?.toDate().toLocaleDateString() }}
        </div>

        <div v-if="item.type === 'social'" class="social-preview">
            {{ item.content }}
            <div v-if="item.imageUrl" class="card-image">
                <img :src="item.imageUrl" />
            </div>
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

            <button v-else-if="item.sourceUrl" class="spark-btn" @click="handleAnalyze"
                :disabled="analysisStore.isAnalyzing">
                {{ analysisStore.isAnalyzing ? 'Thinking...' : '✨ Run Analysis' }}
            </button>
        </div>

        <div class="card-actions">
            <div class="primary-actions">
                <button v-if="hasReadableContent(item)" class="action-btn view-btn" @click="emit('read', item)"
                    title="Read Content">
                    📄 Read
                </button>
                <button class="action-btn" @click="emit('edit-content', item)" title="Edit Content">
                    ✏️ Edit
                </button>
                <ActionStatusPicker :item="item" />
            </div>

            <div class="secondary-actions">
                <button class="action-btn zotero-btn" :class="{ active: item.zotero }" @click="emit('zotero', item)"
                    title="Manage Zotero Link">
                    {{ item.zotero ? '✅ Z' : 'Z' }}
                </button>
                <button class="action-btn" @click="emit('move', item)" title="Move">
                    📦 Move
                </button>
                <button class="action-btn" @click="emit('tag', item)" title="Tag">
                    🏷️ Tag
                </button>
                <button class="action-btn delete" @click="itemsStore.deleteItem(item.id)" title="Delete">
                    🗑️
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.item-card {
    border: 1px solid #eee;
    padding: 1rem;
    border-radius: 8px;
    background: white;
    transition: box-shadow 0.2s, transform 0.1s;
    cursor: grab;
}

.item-card:active {
    cursor: grabbing;
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

.mini-tag.clickable {
    cursor: pointer;
    text-decoration: none;
}

.mini-tag.clickable:hover {
    text-decoration: underline;
    font-weight: bold;
}

h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
}

h4 a {
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

.spark-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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

.zotero-btn {
    font-weight: bold;
    color: #e74c3c;
}

.zotero-btn.active {
    background: #e74c3c;
    color: white;
    border-color: #c0392b;
}

.social-preview {
    margin-top: 0.5rem;
    font-size: 0.95rem;
    color: #333;
    background: #f0f8ff;
    /* Light blue/gray context */
    padding: 0.75rem;
    border-radius: 6px;
    border-left: 3px solid #3498db;
    font-style: italic;
    white-space: pre-wrap;
    line-height: 1.4;
}

.card-image {
    margin-bottom: 0.5rem;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 18px;
    /* 1. Cap the height so it doesn't dominate the screen */
    max-height: 300px;

    /* 2. Center the image if it's narrower than the card */
    display: flex;
    justify-content: center;
    background: #f8f9fa;
    /* Light background for "letterboxed" space */
}

.card-image img {
    /* 3. Constrain dimensions to the parent container */
    max-width: 100%;
    max-height: 100%;

    /* 4. Allow natural aspect ratio */
    width: auto;
    height: auto;

    /* 5. Ensure the WHOLE image is visible */
    object-fit: contain;
}
</style>