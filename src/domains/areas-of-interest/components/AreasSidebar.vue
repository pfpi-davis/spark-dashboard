<script setup lang="ts">
import { useAreasStore } from '../store';
import { useItemsStore } from '@/core/stores/items';
import AreaTreeItem from './AreaTreeItem.vue';

const areasStore = useAreasStore();
const itemsStore = useItemsStore();

const emit = defineEmits(['create']);

function selectAllItems() {
    areasStore.selectedAreaId = null;
    itemsStore.fetchAll();
}
</script>

<template>
    <aside class="areas-sidebar">
        <div class="sidebar-header">
            <h3>📂 My Areas</h3>
            <button class="add-area-btn" @click="emit('create')" title="New Folder">+</button>
        </div>

        <div class="all-items-row" :class="{ active: !areasStore.selectedAreaId }" @click="selectAllItems">
            🗃️ All Items
        </div>

        <ul>
            <AreaTreeItem v-for="rootArea in areasStore.areaTree" :key="rootArea.id" :area="rootArea" :depth="0" />
        </ul>
    </aside>
</template>

<style scoped>
.areas-sidebar {
    width: 250px;
    background: #f8f9fa;
    padding: 1rem;
    border-right: 1px solid #ddd;
    display: flex;
    flex-direction: column;
}

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

ul {
    list-style: none;
    padding: 0;
    margin: 0;
}

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
</style>