<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useItemsStore } from '@/core/stores/items';

const store = useItemsStore();
const router = useRouter();

onMounted(() => {
    store.fetchAll();
});

const recentItems = computed(() => {
    // Items are already sorted by date in the store
    return store.items.slice(0, 5);
});
</script>

<template>
    <div class="areas-widget">
        <div class="header">
            <h3>📂 Recent Research</h3>
            <button class="link-btn" @click="router.push('/areas')">View All</button>
        </div>

        <ul class="recent-list">
            <li v-for="item in recentItems" :key="item.id">
                <span class="type-icon">{{ item.type === 'note' ? '📝' : '🔗' }}</span>
                <span class="title">{{ item.title }}</span>
                <span class="date">{{ new Date(item.savedAt?.toDate()).toLocaleDateString() }}</span>
            </li>
            <li v-if="recentItems.length === 0" class="empty">
                No items saved yet.
            </li>
        </ul>
    </div>
</template>

<style scoped>
.areas-widget {
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

.recent-list {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
    overflow-y: auto;
}

.recent-list li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 6px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.9rem;
    color: #444;
}

.recent-list li:last-child {
    border-bottom: none;
}

.type-icon {
    font-size: 0.8rem;
    opacity: 0.7;
}

.title {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.date {
    font-size: 0.75rem;
    color: #999;
}

.empty {
    font-style: italic;
    color: #999;
    padding: 1rem;
    text-align: center;
}
</style>