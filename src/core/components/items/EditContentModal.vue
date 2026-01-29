<script setup lang="ts">
import { ref, watch } from 'vue';
import { useItemsStore } from '@/core/stores/items';
import RichEditor from '@/core/components/RichEditor.vue';
import type { SavedItem, SupportingLink } from '@/core/types/items';

const props = defineProps<{
    isOpen: boolean;
    item: SavedItem | null;
}>();

const emit = defineEmits(['close', 'saved']);
const store = useItemsStore();

const title = ref('');
const url = ref('');
const content = ref('');
const links = ref<SupportingLink[]>([]);

watch(() => props.isOpen, (isOpen) => {
    if (isOpen && props.item) {
        title.value = props.item.title;
        url.value = props.item.sourceUrl || '';
        content.value = (typeof props.item.content === 'string') ? props.item.content : '';
        // Clone links so we don't mutate prop directly
        links.value = props.item.supportingLinks ? [...props.item.supportingLinks] : [];
    }
});

function addLink() {
    links.value.push({ label: '', url: '' });
}
function removeLink(index: number) {
    links.value.splice(index, 1);
}

async function handleSave() {
    if (!props.item) return;

    const cleanLinks = links.value.filter(l => l.url.trim() !== '');

    await store.updateItemDetails(props.item.id, {
        title: title.value,
        content: content.value,
        sourceUrl: url.value || null,
        supportingLinks: cleanLinks
    });

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
                    <input v-model="title" class="full-width" />
                </div>

                <div class="input-group">
                    <label>Primary URL</label>
                    <input v-model="url" class="full-width" />
                </div>

                <div class="input-group">
                    <div class="links-header">
                        <label>Supporting Links</label>
                        <button class="add-link-btn" @click="addLink">+ Add</button>
                    </div>
                    <div class="links-list">
                        <div v-for="(link, index) in links" :key="index" class="link-row">
                            <input v-model="link.label" placeholder="Label" class="link-label" />
                            <input v-model="link.url" placeholder="URL" class="link-url" />
                            <button class="remove-btn" @click="removeLink(index)">×</button>
                        </div>
                    </div>
                </div>

                <div class="editor-wrapper">
                    <label>Content</label>
                    <div class="quill-container">
                        <RichEditor v-if="item" :key="item.id" v-model="content" />
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
/* Reuse styles from AddItemModal for consistency */
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

.full-width {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
}

.links-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.add-link-btn {
    background: none;
    border: none;
    color: #3498db;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: bold;
}

.links-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.link-row {
    display: flex;
    gap: 0.5rem;
}

.link-label {
    width: 30%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.link-url {
    flex: 1;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.remove-btn {
    background: none;
    border: none;
    color: #e74c3c;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0 0.5rem;
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