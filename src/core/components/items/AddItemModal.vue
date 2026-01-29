<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '@/core/stores/items';
import RichEditor from '@/core/components/RichEditor.vue';
import type { ActionStatus } from '@/core/types/items';

const props = defineProps<{
    isOpen: boolean;
    folders: { id: string; name: string }[]; // <--- Received as prop (Decoupled)
    initialAreaId?: string | null;
    initialStatus?: ActionStatus;
}>();

const emit = defineEmits(['close', 'saved']);
const itemsStore = useItemsStore();

// Form Data
const title = ref('');
const url = ref('');
const content = ref('');
const selectedAreaId = ref('');

// Combobox / Search State
const searchQuery = ref('');
const isDropdownOpen = ref(false);
const comboboxRef = ref<HTMLElement | null>(null);

// Reset fields when opening
watch(() => props.isOpen, (val) => {
    if (val) {
        title.value = '';
        url.value = '';
        content.value = '';

        if (props.initialAreaId) {
            selectedAreaId.value = props.initialAreaId;
            searchQuery.value = '';
        } else {
            selectedAreaId.value = '';
            searchQuery.value = '';
        }
        isDropdownOpen.value = false;
    }
});

// Filter folders based on search
const filteredFolders = computed(() => {
    const q = searchQuery.value.toLowerCase();
    return props.folders.filter(f => f.name.toLowerCase().includes(q));
});

function selectFolder(folder: { id: string; name: string }) {
    selectedAreaId.value = folder.id;
    searchQuery.value = folder.name;
    isDropdownOpen.value = false;
}

function openDropdown() {
    isDropdownOpen.value = true;
    // If specific folder selected, prepopulate search so user sees what it is
    if (!searchQuery.value && selectedAreaId.value) {
        const f = props.folders.find(a => a.id === selectedAreaId.value);
        if (f) searchQuery.value = f.name;
    }
}

function handleClickOutside(event: MouseEvent) {
    if (comboboxRef.value && !comboboxRef.value.contains(event.target as Node)) {
        isDropdownOpen.value = false;
    }
}

onMounted(() => document.addEventListener('click', handleClickOutside));
onUnmounted(() => document.removeEventListener('click', handleClickOutside));

async function handleSubmit() {
    if (!selectedAreaId.value || !title.value.trim()) return;

    await itemsStore.createItem(
        selectedAreaId.value,
        {
            title: title.value,
            sourceUrl: url.value || null,
            type: 'note',
            content: content.value,
            actionStatus: props.initialStatus || 'inbox'
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

                <div v-if="!initialAreaId" class="input-group">
                    <label>Save to Folder <span class="required">*</span></label>

                    <div class="combobox-wrapper" ref="comboboxRef">
                        <input v-model="searchQuery" class="full-width search-input"
                            placeholder="Type to search folders..." @focus="openDropdown"
                            @input="isDropdownOpen = true" />
                        <span class="arrow-indicator">▼</span>

                        <div v-if="isDropdownOpen" class="dropdown-list">
                            <div v-for="folder in filteredFolders" :key="folder.id" class="dropdown-item"
                                :class="{ selected: selectedAreaId === folder.id }" @click="selectFolder(folder)">
                                📂 {{ folder.name }}
                            </div>
                            <div v-if="filteredFolders.length === 0" class="empty-msg">
                                No folders match.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="input-group">
                    <label>Title <span class="required">*</span></label>
                    <input v-model="title" placeholder="e.g. Draft Q3 Report" class="full-width" />
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
                <button class="primary-btn" @click="handleSubmit" :disabled="!title || !selectedAreaId">Save
                    Entry</button>
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

/* Combobox */
.combobox-wrapper {
    position: relative;
}

.search-input {
    padding-right: 30px;
}

.arrow-indicator {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.8rem;
    color: #999;
    pointer-events: none;
}

.dropdown-list {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 100;
    margin-top: 4px;
}

.dropdown-item {
    padding: 10px;
    cursor: pointer;
    font-size: 0.95rem;
    border-bottom: 1px solid #f9f9f9;
}

.dropdown-item:hover {
    background: #f0f4f8;
}

.dropdown-item.selected {
    background: #eafaf1;
    color: #27ae60;
    font-weight: bold;
}

.empty-msg {
    padding: 1rem;
    text-align: center;
    color: #999;
    font-style: italic;
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