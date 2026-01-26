<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useFeedStore } from '../store';
import { useAnalysisStore } from '@/domains/analysis-engine/store';
import SourceManager from '../components/SourceManager.vue';
import AddToAreaModal from '@/domains/areas-of-interest/components/AddToAreaModal.vue';

const feedStore = useFeedStore();
const analysisStore = useAnalysisStore();
const isSaveModalOpen = ref(false);
const itemToSave = ref<any>(null);

function openSaveModal(item: any) {
    // Determine if we are saving just the article or a Spark analysis
    const hasSpark = !!item.nativeData?.aiSummary;

    itemToSave.value = {
        title: item.title,
        // If it has a Spark, save as 'spark' type, otherwise just 'rss'
        type: hasSpark ? 'spark' : 'rss',
        sourceUrl: item.url,
        content: hasSpark ? item.nativeData.aiSummary : item.summary // Save the rich data if available
    };
    isSaveModalOpen.value = true;
}

onMounted(() => {
    // FIX: Check 'subscriptions' instead of 'sources'
    if (feedStore.subscriptions.length > 0) {
        feedStore.fetchAll();
    }
});
</script>

<template>
    <div class="feed-layout">
        <aside class="feed-sidebar">
            <SourceManager />
        </aside>

        <main class="feed-content">
            <header class="feed-header">
                <h2>News Wire</h2>
                <div class="actions">
                    <span v-if="feedStore.isLoading" class="loader">Refreshing...</span>
                    <button @click="feedStore.fetchAll" class="refresh-btn">🔄 Refresh</button>
                </div>
            </header>

            <div class="stream">
                <div v-if="feedStore.resources.length === 0 && !feedStore.isLoading" class="empty-state">
                    <h3>Quiet Day?</h3>
                    <p>Add some sources on the left to get started.</p>
                </div>

                <article v-for="item in feedStore.resources" :key="item.externalId" class="feed-card">
                    <div class="meta">
                        <span class="source-tag">{{ item.nativeData?.source || 'RSS' }}</span>
                        <span class="date">{{ new Date(item.publishedAt!).toLocaleDateString() }}</span>
                    </div>

                    <h3>
                        <a :href="item.url" target="_blank">{{ item.title }}</a>
                    </h3>

                    <p class="summary">{{ item.summary }}</p>
                    <div class="actions-row">
                        <button class="icon-btn save-btn" @click="openSaveModal(item)" title="Save to Area">
                            💾
                        </button>
                    </div>

                    <div class="spark-area">

                        <div v-if="analysisStore.getSpark(item.url!)" class="ai-result">
                            <div class="ai-header">
                                <strong>✨ Spark Analysis</strong>
                                <span class="relevance-badge"
                                    :class="analysisStore.getSpark(item.url!).relevance.toLowerCase()">
                                    {{ analysisStore.getSpark(item.url!).relevance }}
                                </span>
                            </div>
                            <p>{{ analysisStore.getSpark(item.url!).summary }}</p>
                            <div class="tweet-box">
                                <small>Draft Tweet:</small>
                                <code>{{ analysisStore.getSpark(item.url!).tweet }}</code>
                            </div>
                        </div>

                        <button v-else class="spark-btn" @click="analysisStore.analyze({
                            title: item.title || '',
                            summary: item.summary || '',
                            url: item.url!
                        })" :disabled="analysisStore.isAnalyzing">
                            {{ analysisStore.isAnalyzing ? 'Thinking...' : '✨ Spark Analysis' }}
                        </button>

                    </div>
                </article>
            </div>
        </main>
    </div>
    <AddToAreaModal :is-open="isSaveModalOpen" :item-data="itemToSave" @close="isSaveModalOpen = false" />
</template>

<style scoped>
/* (Same styles as before, no changes needed here) */
.feed-layout {
    display: flex;
    height: 100%;
    gap: 2rem;
}

.feed-sidebar {
    width: 300px;
    flex-shrink: 0;
}

.feed-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.feed-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid #eee;
}

.refresh-btn {
    padding: 5px 10px;
    cursor: pointer;
}

.stream {
    overflow-y: auto;
    height: 100%;
    padding-right: 1rem;
}

.feed-card {
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: white;
}

.meta {
    display: flex;
    gap: 1rem;
    font-size: 0.8rem;
    color: #888;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
}

.source-tag {
    font-weight: bold;
    color: #2c3e50;
}

.feed-card h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
}

.feed-card h3 a {
    text-decoration: none;
    color: #2c3e50;
}

.feed-card h3 a:hover {
    color: #3498db;
}

.summary {
    color: #555;
    line-height: 1.5;
    margin-bottom: 1rem;
}

/* AI Styles */
.spark-area {
    margin-top: 1rem;
    border-top: 1px solid #eee;
    padding-top: 1rem;
}

.spark-btn {
    background: #f1c40f;
    border: none;
    padding: 8px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    color: #333;
}

.spark-btn:hover {
    background: #f39c12;
}

.spark-btn:disabled {
    background: #ddd;
    cursor: not-allowed;
}

.ai-result {
    background: #f9f9f9;
    padding: 1rem;
    border-radius: 6px;
    border-left: 4px solid #f1c40f;
}

.ai-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
}

.relevance-badge {
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: bold;
}

.relevance-badge.high {
    background: #e74c3c;
    color: white;
}

.relevance-badge.medium {
    background: #f39c12;
    color: white;
}

.relevance-badge.low {
    background: #95a5a6;
    color: white;
}

.tweet-box {
    margin-top: 0.5rem;
    background: #fff;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9rem;
    color: #555;
}

.save-btn {
    font-size: 1.2rem;
    background: none;
    border: none;
    cursor: pointer;
}

.save-btn:hover {
    transform: scale(1.1);
}

.actions-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-top: 1rem;
}
</style>