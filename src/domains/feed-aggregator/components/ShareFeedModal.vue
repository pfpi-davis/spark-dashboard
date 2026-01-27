<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
    isOpen: boolean;
    url: string;
}>();

const emit = defineEmits(['close', 'confirm']);
const description = ref('');

function handleConfirm() {
    emit('confirm', description.value);
    description.value = ''; // Reset
    emit('close');
}
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <h3>📤 Share Feed</h3>
            <p class="url-preview">{{ url }}</p>

            <div class="input-group">
                <label>Description (Optional):</label>
                <textarea v-model="description" placeholder="Why is this feed useful? (e.g. 'Good for forestry news')"
                    rows="3"></textarea>
            </div>

            <div class="actions">
                <button class="text-btn" @click="emit('close')">Cancel</button>
                <button class="primary-btn" @click="handleConfirm">Share to Library</button>
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

.url-preview {
    font-size: 0.85rem;
    color: #666;
    background: #f4f4f4;
    padding: 8px;
    border-radius: 4px;
    word-break: break-all;
    margin-bottom: 1rem;
}

.input-group {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

textarea {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
    font-family: inherit;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.primary-btn {
    background: #3498db;
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