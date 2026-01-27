<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
    isOpen: boolean;
    feedUrl: string;
    initialKeywords: string[];
}>();

const emit = defineEmits(['close', 'save']);
const keywordsInput = ref('');

watch(() => props.isOpen, () => {
    if (props.isOpen) {
        keywordsInput.value = props.initialKeywords ? props.initialKeywords.join(', ') : '';
    }
});

function handleSave() {
    const arr = keywordsInput.value.split(',').map(s => s.trim()).filter(s => s);
    emit('save', props.feedUrl, arr);
    emit('close');
}
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <h3>⚙️ Feed Settings</h3>
            <p class="subtitle">Filtering content for: <br><code>{{ feedUrl }}</code></p>

            <div class="input-group">
                <label>Keywords (comma separated):</label>
                <textarea v-model="keywordsInput" placeholder="e.g. forest, biomass, carbon" rows="4"></textarea>
                <small>Leave blank to use system defaults.</small>
            </div>

            <div class="actions">
                <button class="text-btn" @click="emit('close')">Cancel</button>
                <button class="primary-btn" @click="handleSave">Save & Refresh</button>
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

.subtitle {
    font-size: 0.85rem;
    color: #666;
    margin-bottom: 1rem;
    word-break: break-all;
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
    font-family: inherit;
}

small {
    color: #888;
    font-size: 0.8rem;
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