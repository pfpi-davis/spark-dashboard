<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import { useAreasStore } from '../store';
import { useItemsStore } from '@/core/stores/items';

const props = defineProps<{
    isOpen: boolean;
    itemId: string | null;
    currentAreaId: string | null;
}>();

const emit = defineEmits(['close', 'saved']);
const areasStore = useAreasStore();
const itemsStore = useItemsStore();

const searchQuery = ref('');
const selectedArea = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// Reset when opened
watch(() => props.isOpen, (val) => {
    if (val) {
        selectedArea.value = '';
        searchQuery.value = '';
        nextTick(() => inputRef.value?.focus());
    }
});

// Filter folders
const filteredAreas = computed(() => {
    const q = searchQuery.value.toLowerCase();
    return areasStore.areas.filter(a => {
        // Exclude current folder
        if (a.id === props.currentAreaId) return false;
        // Match name
        return a.name.toLowerCase().includes(q);
    });
});

async function handleMove() {
    if (!props.itemId || !selectedArea.value) return;
    await itemsStore.moveItem(props.itemId, selectedArea.value);
    emit('saved');
    emit('close');
}

function selectArea(id: string) {
    selectedArea.value = id;
}
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <h3>📦 Move Item</h3>

            <div class="input-group">
                <label>Select Destination:</label>
                <input ref="inputRef" v-model="searchQuery" class="search-input" placeholder="Search folders..." />

                <div class="folder-list">
                    <div v-for="area in filteredAreas" :key="area.id" class="folder-option"
                        :class="{ selected: selectedArea === area.id }" @click="selectArea(area.id)">
                        📁 {{ area.name }}
                    </div>
                    <div v-if="filteredAreas.length === 0" class="empty-msg">
                        No folders found.
                    </div>
                </div>
            </div>

            <div class="actions">
                <button class="text-btn" @click="emit('close')">Cancel</button>
                <button class="primary-btn" @click="handleMove" :disabled="!selectedArea">Move</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.modal-content {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    max-height: 80vh;
}

h3 {
    margin-top: 0;
    color: #2c3e50;
    margin-bottom: 1rem;
}

.input-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    flex: 1;
    overflow: hidden;
}

.search-input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.folder-list {
    flex: 1;
    overflow-y: auto;
    border: 1px solid #eee;
    border-radius: 4px;
    margin-bottom: 1rem;
}

.folder-option {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid #f9f9f9;
    transition: background 0.1s;
}

.folder-option:hover {
    background: #f0f4f8;
}

.folder-option.selected {
    background: #2c3e50;
    color: white;
}

.empty-msg {
    padding: 1rem;
    text-align: center;
    color: #999;
    font-style: italic;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: auto;
}

.primary-btn {
    background: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.primary-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}

.text-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
}
</style>