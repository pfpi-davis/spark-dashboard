<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useItemsStore } from '@/core/stores/items'; // <--- FIXED: Use Core Store
import type { SavedItem, ActionStatus } from '@/core/types/items';

const props = defineProps<{
    item: SavedItem;
}>();

const store = useItemsStore(); // <--- FIXED
const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null); // <--- Reference for click-outside logic

const labels: Record<string, string> = {
    inbox: '📥 Inbox',
    to_analyze: '🧐 To Analyze',
    to_write: '✍️ To Write',
    to_share: '📤 To Share',
    reference: '📁 Reference'
};

function setStatus(status: ActionStatus) {
    store.updateItemStatus(props.item.id, status);
    isOpen.value = false;
}

function toggle() {
    isOpen.value = !isOpen.value;
}

// FIX: Robust "Click Outside" handler instead of flaky @mouseleave
function handleClickOutside(event: MouseEvent) {
    if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
        isOpen.value = false;
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
    <div class="action-picker" ref="containerRef">
        <button class="trigger-btn" :class="item.actionStatus || 'inbox'" @click.stop="toggle"
            title="Set Workflow Status">
            {{ labels[item.actionStatus || 'inbox'] }} ▼
        </button>

        <div v-if="isOpen" class="dropdown-menu">
            <button @click="setStatus('to_analyze')">🧐 To Analyze</button>
            <button @click="setStatus('to_write')">✍️ To Write</button>
            <button @click="setStatus('to_share')">📤 To Share</button>
            <div class="divider"></div>
            <button @click="setStatus('reference')">📁 Reference</button>
            <button @click="setStatus('inbox')">📥 Inbox</button>
        </div>
    </div>
</template>

<style scoped>
.action-picker {
    position: relative;
    display: inline-block;
}

.trigger-btn {
    background: white;
    border: 1px solid #ddd;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.8rem;
    color: #555;
    min-width: 100px;
    text-align: left;
    display: flex;
    justify-content: space-between;
}

.trigger-btn:hover {
    background: #f8f9fa;
    border-color: #bbb;
}

/* Status Highlights */
.trigger-btn.to_analyze {
    border-color: #f1c40f;
    color: #d35400;
    background: #fffdf0;
}

.trigger-btn.to_write {
    border-color: #e67e22;
    color: #e67e22;
    background: #fff5e6;
}

.trigger-btn.to_share {
    border-color: #3498db;
    color: #2980b9;
    background: #ebf5fb;
}

.trigger-btn.reference {
    border-color: #27ae60;
    color: #27ae60;
    background: #eafaf1;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #ddd;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-radius: 4px;
    z-index: 100;
    min-width: 140px;
    display: flex;
    flex-direction: column;
    padding: 4px 0;
}

.dropdown-menu button {
    text-align: left;
    background: none;
    border: none;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 0.85rem;
    color: #333;
    width: 100%;
}

.dropdown-menu button:hover {
    background: #f1f1f1;
    color: #000;
}

.divider {
    height: 1px;
    background: #eee;
    margin: 4px 0;
}
</style>