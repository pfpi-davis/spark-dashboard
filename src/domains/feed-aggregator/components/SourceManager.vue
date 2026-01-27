<script setup lang="ts">
import { ref } from 'vue';
import { useFeedStore } from '../store';
import FeedLibraryModal from './FeedLibraryModal.vue';
import ShareFeedModal from './ShareFeedModal.vue';
import FeedSettingsModal from './FeedSettingsModal.vue';

const store = useFeedStore();
const newUrl = ref('');
const isLibraryOpen = ref(false); // Controls the modal visibility
const isShareModalOpen = ref(false);
const feedToShare = ref('');
const isSettingsOpen = ref(false);
const settingsFeedUrl = ref('');
const settingsKeywords = ref<string[]>([]);


function openSettings(sub: any) {
    settingsFeedUrl.value = sub.url;
    settingsKeywords.value = sub.keywords || [];
    isSettingsOpen.value = true;
}

function handleSettingsSave(url: string, keywords: string[]) {
    store.updateFeedSettings(url, keywords);
}

// Helper to check if a feed supports settings (Currently just Congress)
function hasSettings(url: string) {
    return url.includes('congress.gov');
}
function openShare(url: string) {
    feedToShare.value = url;
    isShareModalOpen.value = true;
}

function handleShareConfirm(description: string) {
    store.shareFeedToLibrary(feedToShare.value, description);
}

function handleSubmit() {
    if (newUrl.value) {
        store.addSource(newUrl.value);
        newUrl.value = '';
    }
}
</script>

<template>
    <div class="source-manager">
        <div class="header-row">
            <h3>📡 Sources</h3>
            <button class="browse-btn" @click="isLibraryOpen = true" title="Browse Library">
                📚
            </button>
        </div>

        <div class="add-box">
            <input v-model="newUrl" placeholder="Add RSS or URL..." @keyup.enter="handleSubmit" />
            <button @click="handleSubmit">+</button>
        </div>

        <ul class="source-list">
            <li v-for="sub in store.subscriptions" :key="sub.url" class="source-item">

                <input type="checkbox" :checked="sub.isActive" @change="store.toggleSource(sub.url)"
                    title="Toggle visibility" />

                <span class="url-text" :class="{ inactive: !sub.isActive }" :title="sub.url">
                    {{ sub.name || sub.url }}
                </span>

                <div class="actions">
                    <button v-if="hasSettings(sub.url)" class="icon-btn" @click="openSettings(sub)"
                        title="Feed Settings">
                        ⚙️
                    </button>
                    <button class="icon-btn share-btn" @click="openShare(sub.url)" title="Share to Library">
                        📤
                    </button>

                    <button class="icon-btn remove-btn" @click="store.removeSource(sub.url)" title="Delete">
                        ×
                    </button>
                </div>
            </li>
        </ul>

        <div v-if="store.subscriptions.length === 0" class="empty-state">
            <p>No feeds yet.</p>
        </div>

        <FeedLibraryModal :is-open="isLibraryOpen" @close="isLibraryOpen = false" />
        <ShareFeedModal :is-open="isShareModalOpen" :url="feedToShare" @close="isShareModalOpen = false"
            @confirm="handleShareConfirm" />
        <FeedSettingsModal :is-open="isSettingsOpen" :feed-url="settingsFeedUrl" :initial-keywords="settingsKeywords"
            @save="handleSettingsSave" @close="isSettingsOpen = false" />
    </div>
</template>

<style scoped>
.source-manager {
    padding: 1rem;
    background: #f9f9f9;
    border-radius: 8px;
}

.header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.browse-btn {
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    padding: 4px 8px;
    font-size: 1.2rem;
}

.browse-btn:hover {
    background: #eee;
}

.add-box {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.add-box input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.source-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.source-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
    font-size: 0.85rem;
}

.url-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #333;
}

.url-text.inactive {
    color: #aaa;
    text-decoration: line-through;
}

.actions {
    display: flex;
    gap: 4px;
}

.icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    padding: 0 4px;
    opacity: 0.6;
}

.icon-btn:hover {
    opacity: 1;
}

.share-btn {
    color: #3498db;
}

.remove-btn {
    color: #e74c3c;
    font-weight: bold;
}
</style>