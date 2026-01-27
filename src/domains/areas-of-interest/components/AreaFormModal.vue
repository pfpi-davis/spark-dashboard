<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useAreasStore } from '../store';

const props = defineProps<{
    isOpen: boolean;
    editId: string | null;
}>();

const emit = defineEmits(['close', 'saved']);
const store = useAreasStore();

const name = ref('');
const description = ref('');
const parentId = ref<string | null>(null);

// Flatten the tree for the dropdown (exclude self to prevent cycles)
const availableParents = computed(() => {
    return store.areas.filter(a => a.id !== props.editId);
});

watch(() => props.isOpen, () => {
    if (props.isOpen) {
        if (props.editId) {
            const area = store.areas.find(a => a.id === props.editId);
            if (area) {
                name.value = area.name;
                description.value = area.description || '';
                parentId.value = area.parentId || null;
            }
        } else {
            name.value = '';
            description.value = '';
            // Optional: Auto-select currently selected folder as parent?
            // parentId.value = store.selectedAreaId; 
            parentId.value = null;
        }
    }
});

async function handleSubmit() {
    if (!name.value.trim()) return;

    if (props.editId) {
        await store.updateArea(props.editId, name.value, description.value, parentId.value);
    } else {
        await store.createArea(name.value, description.value, parentId.value);
    }

    emit('saved');
    emit('close');
}
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <h3>{{ editId ? '✏️ Edit Area' : '📂 New Folder' }}</h3>

            <div class="input-group">
                <label>Name</label>
                <input v-model="name" placeholder="e.g. Bioenergy" @keyup.enter="handleSubmit" />
            </div>

            <div class="input-group">
                <label>Parent Folder</label>
                <select v-model="parentId">
                    <option :value="null">-- No Parent (Root Level) --</option>
                    <option v-for="area in availableParents" :key="area.id" :value="area.id">
                        {{ area.name }}
                    </option>
                </select>
            </div>

            <div class="input-group">
                <label>Description</label>
                <textarea v-model="description" rows="3" placeholder="Context for this folder..."></textarea>
            </div>

            <div class="actions">
                <button class="text-btn" @click="emit('close')">Cancel</button>
                <button class="primary-btn" @click="handleSubmit">
                    {{ editId ? 'Save' : 'Create' }}
                </button>
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

h3 {
    margin-top: 0;
    color: #2c3e50;
}

.input-group {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

input,
select,
textarea {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
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

.text-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
}
</style>