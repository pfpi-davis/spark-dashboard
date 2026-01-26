<template>
    <div class="rss-widget">
        <div class="header">
            <h3>📡 Feeds</h3>
            <span class="badge">12 New</span>
        </div>
        <ul class="feed-list">
            <li>EPA Policy Update (2m ago)</li>
            <li>Ohio Forestry News (1h ago)</li>
            <li>New Bioenergy Study (3h ago)</li>
        </ul>
    </div>
</template>

<style scoped>
.rss-widget {
    padding: 0.5rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.badge {
    background: #e74c3c;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.8rem;
}

.feed-list {
    list-style: none;
    padding: 0;
}

.feed-list li {
    padding: 0.5rem 0;
    border-bottom: 1px solid #eee;
    font-size: 0.9rem;
    color: #555;
}
</style>