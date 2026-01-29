<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAreasStore } from '../store';
import { useItemsStore } from '@/core/stores/items';
import type { Area } from '../types';

const props = defineProps<{
    area: Area;
    depth: number;
}>();

const areasStore = useAreasStore();
const itemsStore = useItemsStore();
const isOpen = ref(false);
const isDragOver = ref(false); // NEW: Visual state for drag

const hasChildren = computed(() => props.area.children && props.area.children.length > 0);
const isSelected = computed(() => areasStore.selectedAreaId === props.area.id);

function handleClick() {
    itemsStore.fetchByArea(props.area.id);
    areasStore.selectedAreaId = props.area.id;
}

function toggle(e: Event) {
    e.stopPropagation();
    isOpen.value = !isOpen.value;
}

// NEW: Drag Handlers
function onDragOver(e: DragEvent) {
    // Only allow drop if we are dragging an item
    if (e.dataTransfer?.types.includes('application/json')) {
        isDragOver.value = true;
    }
}

function onDragLeave() {
    isDragOver.value = false;
}

async function onDrop(e: DragEvent) {
    isDragOver.value = false;
    const data = e.dataTransfer?.getData('application/json');
    if (!data) return;

    try {
        const payload = JSON.parse(data);
        if (payload.itemId) {
            // Move item to this folder
            await itemsStore.moveItem(payload.itemId, props.area.id);
            // Optional: Refresh list if we are currently looking at the source folder?
            // Actually, Firestore listener updates automatically!
        }
    } catch (err) {
        console.error('Drop failed', err);
    }
}
</script>

<template>
    <li :class="{ selected: isSelected, 'drag-over': isDragOver }">
        <div class="row" :style="{ paddingLeft: depth * 12 + 'px' }" @click="handleClick" @dragover.prevent="onDragOver"
            @dragleave="onDragLeave" @drop="onDrop">
            <span v-if="hasChildren" class="toggle-btn" :class="{ rotated: isOpen }" @click="toggle">
                ▶
            </span>
            <span v-else class="spacer"></span>

            <span class="folder-icon">{{ isOpen ? '📂' : '📁' }}</span>
            <span class="name">{{ area.name }}</span>
        </div>

        <ul v-if="hasChildren && isOpen" class="children-list">
            <AreaTreeItem v-for="child in area.children" :key="child.id" :area="child" :depth="depth + 1" />
        </ul>
    </li>
</template>

<style scoped>
li {
    list-style: none;
    user-select: none;
}

.row {
    display: flex;
    align-items: center;
    padding: 6px 8px;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.1s;
    color: #2c3e50;
    border: 2px solid transparent;
}

.row:hover {
    background: #e9ecef;
}

.selected .row {
    background: #2c3e50;
    color: white;
}

/* Drag Hover State */
.drag-over .row {
    border-color: #3498db;
    background: #ebf5fb;
    color: #3498db;
}

.toggle-btn {
    font-size: 0.7rem;
    margin-right: 6px;
    cursor: pointer;
    transition: transform 0.2s;
    color: #888;
    width: 12px;
    display: inline-block;
}

.selected .toggle-btn {
    color: #ccc;
}

.toggle-btn.rotated {
    transform: rotate(90deg);
}

.spacer {
    width: 18px;
}

.folder-icon {
    margin-right: 6px;
    font-size: 1rem;
}

.name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.children-list {
    padding: 0;
    margin: 0;
}
</style>