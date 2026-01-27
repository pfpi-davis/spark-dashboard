<script setup lang="ts">
import { useFeedStore } from '../store';
import { useAuthStore } from '@/core/stores/auth';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits(['close']);
const store = useFeedStore();
const auth = useAuthStore();
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <header>
                <h3>📚 Community Library</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </header>

            <div class="feed-list">

                <div class="section-title">✨ Featured Sources</div>

                <div class="library-item featured">
                    <div class="info">
                        <div class="url">The Guardian (Environment)</div>
                        <div class="desc">Official API Feed</div>
                    </div>
                    <button class="add-btn"
                        @click="store.subscribeFromLibrary('https://www.theguardian.com/us/environment')"
                        :disabled="store.subscriptions.some(s => s.url.includes('theguardian.com'))">
                        {{store.subscriptions.some(s => s.url.includes('theguardian.com')) ? '✓ Added' : '+ Add'}}
                    </button>
                </div>

                <div class="library-item featured">
                    <div class="info">
                        <div class="url">New York Times (Climate)</div>
                        <div class="desc">Official API Feed</div>
                    </div>
                    <button class="add-btn"
                        @click="store.subscribeFromLibrary('https://www.nytimes.com/section/climate')"
                        :disabled="store.subscriptions.some(s => s.url.includes('nytimes.com'))">
                        {{store.subscriptions.some(s => s.url.includes('nytimes.com')) ? '✓ Added' : '+ Add'}}
                    </button>
                </div>

                <div class="library-item featured">
                    <div class="info">
                        <div class="url">US Congress (Bioenergy Filter)</div>
                        <div class="desc">Filtered Bills & Resolutions</div>
                    </div>
                    <button class="add-btn" @click="store.subscribeFromLibrary('https://www.congress.gov')"
                        :disabled="store.subscriptions.some(s => s.url.includes('congress.gov'))">
                        {{store.subscriptions.some(s => s.url.includes('congress.gov')) ? '✓ Added' : '+ Add'}}
                    </button>
                </div>

                <div class="section-title">📚 Community Feeds</div>

                <div v-if="store.publicFeeds.length === 0" class="loading">
                    {{ store.isLoading ? 'Loading...' : 'Library is empty.' }}
                </div>

                <div v-for="feed in store.publicFeeds" :key="feed.id" class="library-item">
                    <div class="info">
                        <div class="url">{{ feed.url }}</div>
                        <div class="desc">{{ feed.description || 'No description provided.' }}</div>
                        <div class="meta">
                            Shared by {{ feed.sharedBy }}
                            <span v-if="feed.sharedBy === auth.user?.email" class="you-badge">(You)</span>
                        </div>
                    </div>

                    <div class="actions">
                        <button v-if="feed.sharedBy === auth.user?.email" class="icon-btn delete-btn"
                            @click="store.deleteFeedFromLibrary(feed.id)" title="Remove from Library">
                            🗑️
                        </button>

                        <button class="add-btn" @click="store.subscribeFromLibrary(feed.url)"
                            :disabled="store.subscriptions.some(s => s.url === feed.url)">
                            {{store.subscriptions.some(s => s.url === feed.url) ? '✓ Added' : '+ Add'}}
                        </button>
                    </div>
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
    z-index: 1000;
}

.modal-content {
    background: white;
    width: 600px;
    max-height: 80vh;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

header {
    padding: 1rem;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
}

.feed-list {
    padding: 1rem;
    overflow-y: auto;
}

.library-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #f0f0f0;
}

.info {
    flex: 1;
    margin-right: 1rem;
    overflow: hidden;
}

.url {
    font-weight: bold;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
    word-break: break-all;
}

.desc {
    color: #555;
    font-size: 0.85rem;
    margin-bottom: 0.25rem;
}

.meta {
    color: #999;
    font-size: 0.75rem;
}

.you-badge {
    color: #27ae60;
    font-weight: bold;
    margin-left: 4px;
}

.actions {
    display: flex;
    align-items: center;
    gap: 10px;
}

.add-btn {
    padding: 6px 12px;
    background: #2c3e50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
}

.add-btn:disabled {
    background: #27ae60;
    cursor: default;
}

.icon-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    padding: 4px;
}

.delete-btn:hover {
    background-color: #ffeaea;
    border-radius: 4px;
}

.loading {
    text-align: center;
    color: #888;
    padding: 2rem;
}

.section-title {
    padding: 0.5rem 0;
    font-weight: bold;
    color: #888;
    font-size: 0.8rem;
    text-transform: uppercase;
    border-bottom: 2px solid #eee;
    margin-top: 1rem;
}

.featured {
    background: #fdfdfd;
}
</style>