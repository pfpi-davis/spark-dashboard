<script setup lang="ts">
// ... imports same as before ...
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '@/core/stores/items';
import { useZoteroStore } from '@/core/stores/zotero';
import RichEditor from '@/core/components/RichEditor.vue';
import type { ActionStatus, SupportingLink } from '@/core/types/items';

const props = defineProps<{
    isOpen: boolean;
    folders: { id: string; name: string }[];
    initialAreaId?: string | null;
    initialStatus?: ActionStatus;
}>();

const emit = defineEmits(['close', 'saved']);
const itemsStore = useItemsStore();
const zoteroStore = useZoteroStore();

// ... (State definitions same as before) ...
const title = ref('');
const url = ref('');
const content = ref('');
const selectedAreaId = ref('');
const links = ref<SupportingLink[]>([]);
const zoteroLink = ref<any>(null);
const searchQuery = ref('');
const isDropdownOpen = ref(false);
const comboboxRef = ref<HTMLElement | null>(null);
const showZoteroSearch = ref(false);
const zQuery = ref('');
let zDebounce: any = null;

// ... (Watchers and Filters same as before) ...
watch(() => props.isOpen, (val) => {
    if (val) {
        title.value = '';
        url.value = '';
        content.value = '';
        links.value = [];
        zoteroLink.value = null;
        showZoteroSearch.value = false;
        zQuery.value = '';

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

function toggleZotero() {
    if (!zoteroStore.apiKey) {
        alert("Please configure your Zotero keys in an existing item's 'Z' menu first.");
        return;
    }
    showZoteroSearch.value = !showZoteroSearch.value;
    if (showZoteroSearch.value) nextTick(() => document.getElementById('zotero-search-input')?.focus());
}

function handleZoteroInput() {
    if (zDebounce) clearTimeout(zDebounce);
    zDebounce = setTimeout(() => {
        if (zQuery.value.length > 2) zoteroStore.searchLibrary(zQuery.value);
    }, 600);
}

function selectZoteroItem(res: any) {
    title.value = res.title;
    if (res.url) url.value = res.url;

    let citationStr = res.citation;
    if (!citationStr) {
        const c = res.creators || 'Unknown';
        const d = res.date || 'n.d.';
        citationStr = `${c} (${d})`;
    }

    zoteroLink.value = {
        key: res.key || "unknown",
        title: res.title || "Untitled",
        citation: citationStr,
        libraryId: zoteroStore.userId || "",
        url: res.url || null
    };
    showZoteroSearch.value = false;
    zQuery.value = '';
}

function addLink() { links.value.push({ label: '', url: '' }); }
function removeLink(index: number) { links.value.splice(index, 1); }

async function handleSubmit() {
    if (!selectedAreaId.value || !title.value.trim()) return;

    const cleanLinks = links.value.filter(l => l.url.trim() !== '');

    await itemsStore.createItem(
        selectedAreaId.value,
        {
            title: title.value,
            sourceUrl: url.value || null,
            // FIX: If Zotero link is present, type is PAPER
            type: zoteroLink.value ? 'paper' : 'note',
            content: content.value,
            actionStatus: props.initialStatus || 'inbox',
            supportingLinks: cleanLinks,
            zotero: zoteroLink.value
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
                <div class="zotero-section">
                    <div v-if="!zoteroLink" class="z-controls">
                        <button class="z-btn" @click="toggleZotero">📚 Import from Zotero</button>
                    </div>
                    <div v-if="zoteroLink" class="z-linked-state">
                        <span class="z-icon">✅</span>
                        <span class="z-citation">{{ zoteroLink.citation }}</span>
                        <button class="z-remove" @click="zoteroLink = null" title="Remove Link">×</button>
                    </div>
                    <div v-if="showZoteroSearch && !zoteroLink" class="z-search-area">
                        <input id="zotero-search-input" v-model="zQuery" @input="handleZoteroInput"
                            placeholder="Search your Zotero library..." class="full-width z-input" />
                        <div v-if="zoteroStore.isLoading" class="z-loading">Searching cloud...</div>
                        <div v-if="zoteroStore.searchResults.length > 0" class="z-results">
                            <div v-for="res in zoteroStore.searchResults" :key="res.key" class="z-item"
                                @click="selectZoteroItem(res)">
                                <div class="z-title">{{ res.title }}</div>
                                <div class="z-meta">{{ res.creators }} • {{ res.date }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="!initialAreaId" class="input-group">
                    <label>Save to Folder <span class="required">*</span></label>
                    <div class="combobox-wrapper" ref="comboboxRef">
                        <input v-model="searchQuery" class="full-width search-input"
                            placeholder="Type to search folders..." @focus="openDropdown"
                            @input="isDropdownOpen = true" />
                        <div v-if="isDropdownOpen" class="dropdown-list">
                            <div v-for="folder in filteredFolders" :key="folder.id" class="dropdown-item"
                                :class="{ selected: selectedAreaId === folder.id }" @click="selectFolder(folder)">📂 {{
                                folder.name }}</div>
                        </div>
                    </div>
                </div>

                <div class="input-group">
                    <label>Title <span class="required">*</span></label>
                    <input v-model="title" placeholder="e.g. Draft Q3 Report" class="full-width" />
                </div>

                <div class="input-group">
                    <label>Primary URL</label>
                    <input v-model="url" placeholder="https://..." class="full-width" />
                </div>

                <div class="input-group">
                    <div class="links-header">
                        <label>Supporting Links</label>
                        <button class="add-link-btn" @click="addLink">+ Add Link</button>
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
/* Reuse existing styles */
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

.zotero-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
}

.z-btn {
    background: #eafaf1;
    color: #27ae60;
    border: 1px solid #abebc6;
    padding: 8px 12px;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
    text-align: left;
}

.z-btn:hover {
    background: #d4efdf;
}

.z-linked-state {
    background: #eafaf1;
    padding: 10px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid #abebc6;
}

.z-citation {
    font-weight: bold;
    color: #27ae60;
    flex: 1;
}

.z-remove {
    background: none;
    border: none;
    color: #e74c3c;
    font-size: 1.2rem;
    cursor: pointer;
}

.z-search-area {
    margin-top: 0.5rem;
    background: #f9f9f9;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #eee;
}

.z-input {
    margin-bottom: 0.5rem;
}

.z-loading {
    font-size: 0.8rem;
    color: #888;
    font-style: italic;
}

.z-results {
    max-height: 150px;
    overflow-y: auto;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.z-item {
    padding: 8px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
}

.z-item:hover {
    background: #f0f4f8;
}

.z-title {
    font-weight: bold;
    font-size: 0.9rem;
}

.z-meta {
    font-size: 0.75rem;
    color: #888;
}

.combobox-wrapper {
    position: relative;
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
    z-index: 100;
}

.dropdown-item {
    padding: 10px;
    cursor: pointer;
}

.dropdown-item:hover {
    background: #f0f4f8;
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