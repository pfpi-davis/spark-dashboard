<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
    isOpen: boolean;
    initialTags: string[];
}>();

const emit = defineEmits(['close', 'save']);

const tagsInput = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// Sync local state when the modal opens
watch(() => props.isOpen, async (isOpen) => {
    if (isOpen) {
        tagsInput.value = props.initialTags ? props.initialTags.join(', ') : '';
        // Focus the input automatically
        await nextTick();
        inputRef.value?.focus();
    }
});

function handleSave() {
    // Clean up the input: split by comma, trim whitespace, remove empty strings
    const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
    emit('save', tags);
    emit('close');
}
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <h3>🏷️ Edit Tags</h3>

            <div class="input-group">
                <label>Tags (comma separated):</label>
                <input ref="inputRef" v-model="tagsInput" placeholder="e.g. research, urgent, ideas"
                    @keyup.enter="handleSave" />
                <small>Press Enter to save</small>
            </div>

            <div class="actions">
                <button class="text-btn" @click="emit('close')">Cancel</button>
                <button class="primary-btn" @click="handleSave">Save Tags</button>
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

input {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
}

small {
    color: #888;
    font-size: 0.8rem;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    align-items: center;
}

.primary-btn {
    background: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}

.primary-btn:hover {
    background: #34495e;
}

.text-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
}

.text-btn:hover {
    text-decoration: underline;
    color: #333;
}
</style>