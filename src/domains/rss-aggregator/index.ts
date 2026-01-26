import type { SparkPlugin } from '@/core/types/plugin';
import RssWidget from './components/RssWidget.vue';
import RssMain from './views/RssMain.vue'; // Create a blank file for this first!

const RssPlugin: SparkPlugin = {
  manifest: {
    id: 'rss-aggregator',
    name: 'News Wire',
    description: 'Aggregates RSS feeds for analysis',
    icon: 'rss_feed'
  },
  components: {
    dashboardWidget: RssWidget,
    mainView: RssMain // Just put a placeholder component here for now
  },
  routes: [
    { path: 'feeds', name: 'rss-main', component: RssMain }
  ]
};

export default RssPlugin;