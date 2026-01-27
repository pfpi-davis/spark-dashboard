<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAreasStore } from '../store';
import RichEditor from '@/core/components/RichEditor.vue';

const props = defineProps<{
    isOpen: boolean;
    areaId: string | null;
}>();

const emit = defineEmits(['close', 'saved']);
const store = useAreasStore();

const title = ref('');
const url = ref('');
const content = ref('');

// Reset fields when opening
watch(() => props.isOpen, (val) => {
    if (val) {
        title.value = '';
        url.value = '';
        content.value = '';
    }
});

async function handleSubmit() {
    if (!props.areaId || !title.value.trim()) return;

    await store.saveItemToArea(
        props.areaId,
        {
            title: title.value,
            // FIX: Use 'null' instead of 'undefined'.
            // Firebase accepts 'null', allowing the field to exist without a value.
            sourceUrl: url.value || null,
            type: 'note',
            content: content.value
        },
        []
    );

    emit('saved');
    emit('close');
}
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <header>
                <h3>📄 Add New Entry</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </header>

            <div class="form-body">
                <div class="input-group">
                    <label>Title <span class="required">*</span></label>
                    <input v-model="title" placeholder="e.g. Notes from Biomass Conference" class="full-width" />
                </div>

                <div class="input-group">
                    <label>Source URL (Optional)</label>
                    <input v-model="url" placeholder="https://..." class="full-width" />
                </div>

                <div class="editor-wrapper">
                    <label>Content</label>
                    <div class="quill-container">
                        <RichEditor v-model="content" />
                    </div>
                </div>
            </div>

            <footer>
                <button class="text-btn" @click="emit('close')">Cancel</button>
                <button class="primary-btn" @click="handleSubmit" :disabled="!title">Save Entry</button>
            </footer>
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
    width: 700px;
    max-width: 95vw;
    height: 80vh;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

header {
    padding: 1rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

h3 {
    margin: 0;
    color: #2c3e50;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #999;
}

.form-body {
    padding: 1.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.input-group {
    margin-bottom: 1rem;
}

.input-group label {
    display: block;
    font-weight: bold;
    font-size: 0.85rem;
    color: #555;
    margin-bottom: 0.5rem;
}

.required {
    color: #e74c3c;
}

.full-width {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
}

.editor-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.quill-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #fff;
    overflow: hidden;
}

footer {
    padding: 1rem;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.primary-btn {
    background: #2c3e50;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
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