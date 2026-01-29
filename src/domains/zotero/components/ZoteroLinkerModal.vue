<script setup lang="ts">
import { ref, watch } from 'vue';
import { useZoteroStore } from '@/core/stores/zotero';
import { useItemsStore } from '@/core/stores/items';
import type { SavedItem } from '@/core/types/items';

const props = defineProps<{
    isOpen: boolean;
    item: SavedItem | null;
}>();

const emit = defineEmits(['close', 'linked']);

const zoteroStore = useZoteroStore();
const itemsStore = useItemsStore();

const activeTab = ref<'search' | 'create' | 'settings'>('search');
const searchQuery = ref('');
const apiKeyInput = ref('');
const userIdInput = ref('');
let debounceTimer: any = null;

watch(() => props.isOpen, (val) => {
    if (val && props.item) {
        // FIX: Clear previous search results so the list is fresh
        zoteroStore.searchResults = [];

        searchQuery.value = props.item.title;

        if (!zoteroStore.apiKey) activeTab.value = 'settings';
        else activeTab.value = 'search';

        apiKeyInput.value = zoteroStore.apiKey;
        userIdInput.value = zoteroStore.userId;
    }
});

function saveSettings() {
    zoteroStore.setCredentials(apiKeyInput.value, userIdInput.value);
    activeTab.value = 'search';
}

// Autocomplete (Debounced)
function onSearchInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (searchQuery.value.length > 2) {
            zoteroStore.searchLibrary(searchQuery.value);
        }
    }, 600);
}

// Robust Linking Logic
async function linkItem(zoteroResult: any) {
    if (!props.item) return;

    let citationStr = zoteroResult.citation;
    if (!citationStr) {
        const c = zoteroResult.creators || 'Unknown';
        const d = zoteroResult.date || 'n.d.';
        citationStr = `${c} (${d})`;
    }

    const zoteroData = {
        key: zoteroResult.key || "unknown",
        title: zoteroResult.title || "Untitled",
        citation: citationStr || "Unknown Citation",
        libraryId: zoteroStore.userId || "",
        url: zoteroResult.url || null
    };

    await itemsStore.updateItemDetails(props.item.id, {
        zotero: zoteroData,
        type: 'paper' // Auto-upgrade to paper
    });

    emit('linked');
    emit('close');
}

async function handleCreate() {
    if (!props.item) return;
    const result = await zoteroStore.createWebItem(props.item.title, props.item.sourceUrl || '');
    if (result) {
        await linkItem(result);
    } else {
        alert("Failed to create item in Zotero.");
    }
}

async function unlink() {
    if (!props.item || !confirm("Unlink Zotero reference?")) return;
    await itemsStore.updateItemDetails(props.item.id, { zotero: null });
    emit('linked');
    emit('close');
}
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <header>
                <h3>📚 Zotero Bridge</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </header>

            <div v-if="item?.zotero" class="linked-banner">
                <div class="link-info">
                    <strong>✅ Linked to Zotero</strong>
                    <div class="citation">{{ item.zotero.citation }}</div>
                </div>
                <button class="unlink-btn" @click="unlink">Unlink</button>
            </div>

            <div v-else class="tabs">
                <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">🔍 Search</button>
                <button :class="{ active: activeTab === 'create' }" @click="activeTab = 'create'">➕ Send New</button>
                <button :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">⚙️
                    Settings</button>
            </div>

            <div class="body">

                <div v-if="activeTab === 'search'">
                    <div class="input-group">
                        <input v-model="searchQuery" @input="onSearchInput" placeholder="Type to search library..."
                            class="full-width" />
                    </div>

                    <div v-if="zoteroStore.isLoading" class="loading">Searching...</div>

                    <div class="results-list">
                        <div v-for="res in zoteroStore.searchResults" :key="res.key" class="result-item">
                            <div class="res-info">
                                <div class="res-title">{{ res.title }}</div>
                                <div class="res-meta">{{ res.creators }} • {{ res.date }}</div>
                            </div>
                            <button class="sm-btn" @click="linkItem(res)">Link</button>
                        </div>
                    </div>
                </div>

                <div v-if="activeTab === 'create'" class="create-tab">
                    <p>Create a new <strong>Web Page</strong> item in Zotero.</p>
                    <div class="preview-box">
                        <div class="field"><strong>Title:</strong> {{ item?.title }}</div>
                        <div class="field"><strong>URL:</strong> {{ item?.sourceUrl || 'No URL' }}</div>
                    </div>
                    <button class="primary-btn full-width" @click="handleCreate" :disabled="zoteroStore.isLoading">
                        {{ zoteroStore.isLoading ? 'Sending...' : 'Create Reference' }}
                    </button>
                </div>

                <div v-if="activeTab === 'settings'" class="settings-tab">
                    <label>Zotero API Key</label>
                    <input v-model="apiKeyInput" type="password" />
                    <label>User ID</label>
                    <input v-model="userIdInput" />
                    <button class="primary-btn" @click="saveSettings">Save</button>
                    <p class="help-text">Get keys at zotero.org/settings/keys</p>
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
    width: 500px;
    max-width: 95vw;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    max-height: 85vh;
}

header {
    padding: 1rem;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

h3 {
    margin: 0;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #999;
}

.tabs {
    display: flex;
    border-bottom: 1px solid #eee;
}

.tabs button {
    flex: 1;
    padding: 12px;
    background: none;
    border: none;
    cursor: pointer;
    border-bottom: 3px solid transparent;
}

.tabs button.active {
    border-bottom-color: #e74c3c;
    color: #e74c3c;
    font-weight: bold;
    background: #fffcfc;
}

.body {
    padding: 1rem;
    flex: 1;
    overflow-y: auto;
}

.input-group input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
}

.results-list {
    margin-top: 1rem;
    border: 1px solid #eee;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
}

.result-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #eee;
}

.res-title {
    font-weight: bold;
    font-size: 0.9rem;
}

.res-meta {
    font-size: 0.8rem;
    color: #888;
}

.linked-banner {
    background: #eafaf1;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #d4efdf;
}

.citation {
    font-size: 0.9rem;
    color: #555;
}

.unlink-btn {
    background: white;
    border: 1px solid #e74c3c;
    color: #e74c3c;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
}

.primary-btn {
    background: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 1rem;
}

.sm-btn {
    background: #f0f4f8;
    border: 1px solid #ddd;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85rem;
}

.loading {
    text-align: center;
    color: #999;
    padding: 1rem;
}

.full-width {
    width: 100%;
}

.preview-box {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.settings-tab {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.settings-tab input {
    padding: 8px;
    border: 1px solid #ddd;
}

.help-text {
    font-size: 0.8rem;
    color: #999;
}
</style>