<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAreasStore } from '../store';
import type { Area } from '../types';

const props = defineProps<{
    area: Area;
    depth: number;
}>();

const store = useAreasStore();
const isOpen = ref(false); // Toggle for collapse/expand

const hasChildren = computed(() => props.area.children && props.area.children.length > 0);
const isSelected = computed(() => store.selectedAreaId === props.area.id);

function handleClick() {
    store.fetchItemsForArea(props.area.id);
    // Optional: Auto-expand when clicked
    // isOpen.value = true;
}

function toggle(e: Event) {
    e.stopPropagation(); // Don't trigger select
    isOpen.value = !isOpen.value;
}
</script>

<template>
    <li :class="{ selected: isSelected }">
        <div class="row" :style="{ paddingLeft: depth * 12 + 'px' }" @click="handleClick">
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
}

.row:hover {
    background: #e9ecef;
}

.selected .row {
    background: #2c3e50;
    color: white;
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

/* Aligns items without children */

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