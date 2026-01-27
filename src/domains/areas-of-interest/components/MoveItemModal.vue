<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAreasStore } from '../store';

const props = defineProps<{
    isOpen: boolean;
    itemId: string | null;
    currentAreaId: string | null;
}>();

const emit = defineEmits(['close', 'saved']);
const store = useAreasStore();
const selectedArea = ref('');

watch(() => props.isOpen, () => {
    if (props.isOpen) selectedArea.value = '';
});

async function handleMove() {
    if (!props.itemId || !selectedArea.value) return;
    await store.moveItem(props.itemId, selectedArea.value);
    emit('saved');
    emit('close');
}
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <h3>📦 Move Item</h3>

            <div class="input-group">
                <label>Select New Folder:</label>
                <select v-model="selectedArea">
                    <option disabled value="">-- Choose Area --</option>
                    <option v-for="area in store.areas.filter(a => a.id !== currentAreaId)" :key="area.id"
                        :value="area.id">
                        {{ area.name }}
                    </option>
                </select>
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
    width: 350px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

h3 {
    margin-top: 0;
    color: #2c3e50;
}

.input-group {
    margin: 1.5rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

select {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.primary-btn {
    background: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.text-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
}
</style>