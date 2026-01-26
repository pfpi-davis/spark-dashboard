<script setup lang="ts">
import { activePlugins } from '@/core/pluginLoader';
import { APP_CONFIG } from '@/config'; // Import the config
</script>

<template>
    <div class="dashboard-container">
        <h1>{{ APP_CONFIG.greeting }}</h1>
        <div class="widget-grid">
            <div v-for="plugin in activePlugins" :key="plugin.manifest.id" class="widget-card">
                <component :is="plugin.components.dashboardWidget" v-if="plugin.components.dashboardWidget" />
                <div v-else class="empty-widget">
                    <h3>{{ plugin.manifest.name }}</h3>
                    <p>No widget defined.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.widget-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
}

.widget-card {
    border: 1px solid #ddd;
    padding: 1rem;
    border-radius: 8px;
    background: white;
    min-height: 150px;
}
</style>