<script setup lang="ts">
import { useNotificationStore } from '../stores/notifications';
const store = useNotificationStore();
</script>

<template>
    <div class="toast-container">
        <transition-group name="toast">
            <div v-for="toast in store.toasts" :key="toast.id" class="toast-item" :class="toast.type"
                @click="store.remove(toast.id)">
                {{ toast.message }}
            </div>
        </transition-group>
    </div>
</template>

<style scoped>
.toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.toast-item {
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    min-width: 200px;
}

.toast-item.info {
    background: #2c3e50;
}

.toast-item.success {
    background: #27ae60;
}

.toast-item.error {
    background: #e74c3c;
}

/* Transitions */
.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateX(20px);
}
</style>