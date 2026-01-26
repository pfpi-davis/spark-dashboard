<script setup lang="ts">
import { ref } from 'vue';
import { useAreasStore } from '../store';

const props = defineProps<{
    isOpen: boolean;
    itemData: { title: string; type: string; content: any; sourceUrl?: string } | null;
}>();

const emit = defineEmits(['close', 'saved']);
const store = useAreasStore();

const selectedArea = ref('');
const newAreaName = ref('');
const isCreating = ref(false);
const tagsInput = ref('');

async function handleSave() {
    if (!selectedArea.value || !props.itemData) return;

    // Parse tags: split by comma, trim spaces, remove empty
    const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);

    await store.saveItemToArea(
        selectedArea.value,
        {
            title: props.itemData.title,
            type: props.itemData.type as any,
            content: props.itemData.content,
            sourceUrl: props.itemData.sourceUrl
        },
        tags // <--- Pass tags to store
    );

    // Reset
    tagsInput.value = '';
    emit('saved');
    emit('close');
}

async function handleCreateAndSave() {
    if (!newAreaName.value) return;
    await store.createArea(newAreaName.value);
    // Store doesn't return ID easily in that simple implementation, 
    // so for UX we just reset to "Select mode" and let user pick the new one.
    isCreating.value = false;
    newAreaName.value = '';
}
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <h3>📥 Save to Area</h3>

            <div class="preview">
                <strong>Saving:</strong> {{ itemData?.title }}
            </div>

            <div v-if="!isCreating" class="selector">
                <label>Choose Area:</label>
                <select v-model="selectedArea">
                    <option disabled value="">-- Select --</option>
                    <option v-for="area in store.areas" :key="area.id" :value="area.id">
                        {{ area.name }}
                    </option>
                </select>
                <label>Tags (comma separated):</label>
                <input v-model="tagsInput" placeholder="e.g. todo, research, social" />
                <div class="actions">
                    <button class="primary-btn" @click="handleSave" :disabled="!selectedArea">
                        Save Item
                    </button>
                    <button class="text-btn" @click="isCreating = true">+ New Area</button>
                </div>
            </div>

            <div v-else class="creator">
                <input v-model="newAreaName" placeholder="New Area Name..." />
                <div class="actions">
                    <button class="primary-btn" @click="handleCreateAndSave">Create Area</button>
                    <button class="text-btn" @click="isCreating = false">Cancel</button>
                </div>
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
}

.preview {
    background: #f4f4f4;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.9rem;
    margin-bottom: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.selector,
.creator {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

select,
input {
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 1rem;
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
    color: #3498db;
    cursor: pointer;
    text-decoration: underline;
}
</style>