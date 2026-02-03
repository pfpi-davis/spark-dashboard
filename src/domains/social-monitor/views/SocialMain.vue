<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSocialStore } from '../store';
import SaveResourceModal from '@/core/components/SaveResourceModal.vue';

const store = useSocialStore();
const queryInput = ref('');

// Save Modal State
const isSaveModalOpen = ref(false);
const itemToSave = ref<any>(null);

onMounted(() => {
    if (store.currentQuery) {
        queryInput.value = store.currentQuery;
    } else {
        queryInput.value = 'bioenergy';
        store.search('bioenergy');
    }
});

function handleSearch() {
    store.search(queryInput.value);
}

function openPost(url: string) {
    window.open(url, '_blank');
}

function openSaveModal(post: any) {
    itemToSave.value = {
        title: `Post by @${post.author.handle}`,
        type: 'social',
        sourceUrl: post.url,
        content: post.content,
        imageUrl: post.image
    };
    isSaveModalOpen.value = true;
}
</script>

<template>
    <div class="social-main">
        <header class="page-header">
            <h2>🦋 BlueSky Monitor</h2>
            <div class="search-bar">
                <input v-model="queryInput" @keyup.enter="handleSearch" placeholder="Search BlueSky..." />
                <button @click="handleSearch" :disabled="store.isLoading">
                    {{ store.isLoading ? 'Searching...' : 'Search' }}
                </button>
            </div>
        </header>

        <div class="feed-container">
            <div v-if="store.posts.length === 0 && !store.isLoading" class="empty-state">
                No posts found. Try a different search term.
            </div>

            <div v-for="post in store.posts" :key="post.id" class="post-card">
                <div class="post-header" @click="openPost(post.url)">
                    <img v-if="post.author.avatar" :src="post.author.avatar" class="avatar" />
                    <div class="author-info">
                        <span class="name">{{ post.author.displayName || post.author.handle }}</span>
                        <span class="handle">@{{ post.author.handle }}</span>
                    </div>
                    <span class="date">{{ new Date(post.createdAt).toLocaleDateString() }}</span>
                </div>

                <div class="post-header" @click="openPost(post.url)">
                </div>

                <p class="post-content">{{ post.content }}</p>

                <div v-if="post.image" class="post-image-container">
                    <img :src="post.image" class="post-image" loading="lazy" />
                </div>



                <div class="post-footer">
                    <div class="stats">
                        <span>❤️ {{ post.likes }}</span>
                        <span>🔁 {{ post.reposts }}</span>
                    </div>

                    <div class="actions">
                        <button class="action-btn" @click.stop="store.repost(post)" title="Repost">
                            🔁 Repost
                        </button>

                        <button class="action-btn save-btn" @click.stop="openSaveModal(post)" title="Save to Areas">
                            💾 Save
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <SaveResourceModal :is-open="isSaveModalOpen" :item-data="itemToSave" @close="isSaveModalOpen = false" />
    </div>
</template>

<style scoped>
.post-image-container {
    margin-bottom: 1rem;
    border-radius: 8px;
    overflow: hidden;

    /* 1. Cap the height so it doesn't dominate the feed */
    max-height: 400px;

    /* 2. Center the image (letterboxing effect) */
    display: flex;
    justify-content: center;
    background: #f8f9fa;
    /* Light gray background for empty space */
}

.post-image {
    /* 3. Constrain dimensions to the container */
    max-width: 100%;
    max-height: 100%;

    /* 4. Maintain aspect ratio */
    width: auto;
    height: auto;

    /* 5. Ensure the full image is visible */
    object-fit: contain;
    display: block;
}

/* Reuse previous styles + add new ones */
.social-main {
    padding: 2rem;
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.search-bar {
    display: flex;
    gap: 10px;
}

.search-bar input {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    width: 250px;
}

.search-bar button {
    padding: 8px 16px;
    background: #0085ff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.feed-container {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
}

.post-card {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #eee;
    transition: transform 0.1s;
}

.post-header {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-bottom: 1rem;
    cursor: pointer;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.author-info {
    display: flex;
    flex-direction: column;
    flex: 1;
}

.name {
    font-weight: 700;
    color: #111;
}

.handle {
    color: #666;
    font-size: 0.9rem;
}

.date {
    color: #999;
    font-size: 0.85rem;
}

.post-content {
    line-height: 1.5;
    color: #333;
    margin-bottom: 1rem;
    white-space: pre-wrap;
}

.post-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #f0f0f0;
    padding-top: 1rem;
}

.stats {
    display: flex;
    gap: 1rem;
    color: #666;
    font-size: 0.9rem;
}

.actions {
    display: flex;
    gap: 0.5rem;
}

.action-btn {
    background: none;
    border: 1px solid #ddd;
    padding: 6px 12px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 0.85rem;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 4px;
}

.action-btn:hover {
    background: #f0f0f0;
    border-color: #ccc;
}

.save-btn:hover {
    background: #e3f2fd;
    color: #1976d2;
    border-color: #1976d2;
}
</style>