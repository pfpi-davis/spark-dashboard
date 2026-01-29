<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useItemsStore } from '@/core/stores/items';

const store = useItemsStore();
const router = useRouter();

onMounted(() => {
    // Ensure we have data
    store.fetchAll();
});

const counts = computed(() => {
    const items = store.items;
    return {
        inbox: items.filter(i => !i.actionStatus || i.actionStatus === 'inbox').length,
        analyze: items.filter(i => i.actionStatus === 'to_analyze').length,
        write: items.filter(i => i.actionStatus === 'to_write').length
    };
});
</script>

<template>
    <div class="action-widget">
        <div class="header">
            <h3>⚡ Action Center</h3>
            <button class="link-btn" @click="router.push('/actions')">Open Board</button>
        </div>

        <div class="stats-row">
            <div class="stat-box inbox" :class="{ 'has-items': counts.inbox > 0 }">
                <span class="count">{{ counts.inbox }}</span>
                <span class="label">Inbox</span>
            </div>

            <div class="stat-box analyze">
                <span class="count">{{ counts.analyze }}</span>
                <span class="label">Analyze</span>
            </div>

            <div class="stat-box write">
                <span class="count">{{ counts.write }}</span>
                <span class="label">Write</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.action-widget {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
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

.stats-row {
    display: flex;
    gap: 1rem;
    flex: 1;
}

.stat-box {
    flex: 1;
    background: #f8f9fa;
    border-radius: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0.5rem;
    border: 1px solid #eee;
}

.count {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
}

.label {
    font-size: 0.75rem;
    color: #888;
    text-transform: uppercase;
    margin-top: 4px;
}

/* Highlight inbox if it has items */
.stat-box.inbox.has-items {
    background: #fff5e6;
    border-color: #ffe0b2;
}

.stat-box.inbox.has-items .count {
    color: #d35400;
}
</style>