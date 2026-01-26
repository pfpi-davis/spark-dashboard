<script setup lang="ts">
import { activePlugins } from '@/core/pluginLoader';
import { APP_CONFIG } from '@/config';
</script>

<template>
    <div class="app-shell">
        <aside class="sidebar">
            <div class="logo">
                <span class="app-icon">{{ APP_CONFIG.appIcon }}</span>
                <span class="app-name">{{ APP_CONFIG.appName }}</span>
            </div>

            <nav>
                <router-link to="/" class="nav-item">
                    Dashboard
                </router-link>

                <div class="nav-divider">Plugins</div>

                <template v-for="plugin in activePlugins" :key="plugin.manifest.id">
                    <router-link v-if="plugin.routes.length > 0" :to="plugin.routes[0]!.path" class="nav-item">
                        {{ plugin.manifest.name }}
                    </router-link>
                </template>
            </nav>
        </aside>

        <main class="content">
            <RouterView />
        </main>
    </div>
</template>

<style scoped>
.app-shell {
    display: flex;
    height: 100vh;
}

.sidebar {
    width: 250px;
    background: #f4f4f4;
    padding: 1rem;
    border-right: 1px solid #ddd;
}

.content {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
}

.nav-item {
    display: block;
    padding: 0.5rem;
    text-decoration: none;
    color: #333;
    margin-bottom: 0.25rem;
}

.nav-item.router-link-active {
    background: #e0e0e0;
    font-weight: bold;
    border-radius: 4px;
}

.nav-divider {
    margin-top: 1.5rem;
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #666;
    font-weight: bold;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 2rem;
}
</style>