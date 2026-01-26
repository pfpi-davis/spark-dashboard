import type { SparkPlugin } from '@/core/types/plugin';
import Widget from './components/Widget.vue';
import MainView from './views/MainView.vue';

export const TemplatePlugin: SparkPlugin = {
  manifest: {
    id: 'new-plugin',
    name: 'New Plugin',
    icon: 'extension', // Material Icon name
    description: 'Description goes here'
  },
  components: {
    dashboardWidget: Widget,
    mainView: MainView,
  },
  routes: [
    {
      path: 'new-plugin',
      name: 'new-plugin',
      component: MainView,
    },
  ],
};