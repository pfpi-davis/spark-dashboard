<script setup lang="ts">
import { ref, watch } from 'vue';
import { useItemsStore } from '@/core/stores/items'; // <--- NEW STORE
import RichEditor from '@/core/components/RichEditor.vue';

const props = defineProps<{
    isOpen: boolean;
    item: { id: string, title: string, content: string } | null;
}>();

const emit = defineEmits(['close', 'saved']);
const store = useItemsStore(); // <--- Use itemsStore

const titleInput = ref('');
const contentInput = ref('');

watch(() => props.isOpen, (isOpen) => {
    if (isOpen && props.item) {
        titleInput.value = props.item.title;
        contentInput.value = (typeof props.item.content === 'string') ? props.item.content : '';
    }
});

async function handleSave() {
    if (!props.item) return;
    await store.updateItemContent(props.item.id, contentInput.value, titleInput.value);
    emit('saved');
    emit('close');
}
</script>
<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <header>
                <h3>✏️ Edit Item</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </header>

            <div class="form-body">
                <div class="input-group">
                    <label>Title</label>
                    <input v-model="titleInput" placeholder="Item Title" class="title-input" />
                </div>

                <div class="editor-wrapper">
                    <label>Content</label>
                    <div class="quill-container">
                        <RichEditor v-if="item" :key="item.id" v-model="contentInput" />
                    </div>
                </div>
            </div>

            <footer>
                <button class="text-btn" @click="emit('close')">Cancel</button>
                <button class="primary-btn" @click="handleSave">Save Changes</button>
            </footer>
        </div>
    </div>
</template>

<style scoped>
/* Reuse styles from previous file content */
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

.input-group label,
.editor-wrapper label {
    display: block;
    font-weight: bold;
    font-size: 0.85rem;
    color: #555;
    margin-bottom: 0.5rem;
}

.title-input {
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

.text-btn {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
}
</style>