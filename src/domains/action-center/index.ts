import type { SparkPlugin } from '@/core/types/plugin'
import ActionDashboard from './views/ActionDashboard.vue'
import ActionWidget from './components/ActionWidget.vue' // <--- Import

const ActionCenterPlugin: SparkPlugin = {
  manifest: {
    id: 'action-center',
    name: 'Action Center',
    icon: 'bolt',
    description: 'Process your knowledge queue.',
  },
  components: {
    mainView: ActionDashboard,
    dashboardWidget: ActionWidget, // <--- Register
  },
  routes: [
    {
      path: '/actions',
      name: 'action-center',
      component: ActionDashboard,
    },
  ],
}

export default ActionCenterPlugin
