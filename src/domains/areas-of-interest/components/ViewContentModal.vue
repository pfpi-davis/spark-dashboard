<script setup lang="ts">

const props = defineProps<{
    isOpen: boolean;
    title: string;
    content: string; // This expects the HTML string
}>();

const emit = defineEmits(['close']);
</script>

<template>
    <div v-if="isOpen" class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-content">
            <header>
                <h3>{{ title }}</h3>
                <button class="close-btn" @click="emit('close')">×</button>
            </header>

            <div class="scrollable-content">
                <div class="rich-text-body" v-html="content"></div>
            </div>

            <footer>
                <button class="primary-btn" @click="emit('close')">Close</button>
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
    width: 600px;
    max-width: 90vw;
    max-height: 85vh;
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
    font-size: 1.1rem;
    color: #2c3e50;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #888;
}

.scrollable-content {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
}

.rich-text-body {
    line-height: 1.6;
    color: #333;
    font-size: 1rem;
}

/* Basic styling for imported HTML content */
.rich-text-body :deep(img) {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
}

.rich-text-body :deep(blockquote) {
    border-left: 4px solid #ddd;
    padding-left: 1rem;
    color: #666;
    margin: 1rem 0;
}

.rich-text-body :deep(pre) {
    background: #f4f4f4;
    padding: 1rem;
    overflow-x: auto;
}

footer {
    padding: 1rem;
    border-top: 1px solid #eee;
    text-align: right;
}

.primary-btn {
    background: #2c3e50;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}
</style>