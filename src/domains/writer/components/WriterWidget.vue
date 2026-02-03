<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useWriterStore } from '../store';

const store = useWriterStore();
const router = useRouter();

onMounted(() => {
    store.fetchDrafts();
});

const recentDrafts = computed(() => {
    // Store already sorts by updatedAt desc
    return store.drafts.slice(0, 5);
});

function openDraft(id: string) {
    router.push({ path: '/writer', query: { id } });
}

function formatDate(timestamp: any) {
    if (!timestamp) return '';
    // Handle Firestore Timestamp or standard Date
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>

<template>
    <div class="writer-widget">
        <div class="header">
            <h3>✍️ Recent Drafts</h3>
            <button class="link-btn" @click="router.push('/writer')">View All</button>
        </div>

        <ul class="draft-list">
            <li v-for="draft in recentDrafts" :key="draft.id" @click="openDraft(draft.id)" class="draft-item">
                <span class="status-icon" :title="draft.isPublished ? 'Published' : 'Draft'">
                    {{ draft.isPublished ? '🟢' : '📝' }}
                </span>
                <span class="title">{{ draft.title || 'Untitled Draft' }}</span>
                <span class="date">{{ formatDate(draft.updatedAt) }}</span>
            </li>
            <li v-if="recentDrafts.length === 0" class="empty">
                No drafts started.
                <button class="text-btn" @click="router.push('/writer')">Start Writing</button>
            </li>
        </ul>
    </div>
</template>

<style scoped>
.writer-widget {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

h3 {
    margin: 0;
    font-size: 1rem;
    color: #2c3e50;
}

.link-btn {
    background: none;
    border: none;
    color: #3498db;
    cursor: pointer;
    font-size: 0.85rem;
}

.link-btn:hover {
    text-decoration: underline;
}

.draft-list {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
    overflow-y: auto;
}

.draft-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 8px 6px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.9rem;
    color: #444;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.1s;
}

.draft-item:hover {
    background: #f8f9fa;
}

.draft-item:last-child {
    border-bottom: none;
}

.status-icon {
    font-size: 0.75rem;
    opacity: 0.8;
}

.title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
}

.date {
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
}

.empty {
    font-style: italic;
    color: #999;
    padding: 1rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.text-btn {
    background: none;
    border: none;
    color: #3498db;
    cursor: pointer;
    text-decoration: underline;
}
</style>