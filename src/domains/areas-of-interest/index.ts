import type { SparkPlugin } from '@/core/types/plugin'
import AreasMain from './views/AreasMain.vue'
import AreasWidget from './components/AreasWidget.vue' // <--- Import

const AreasPlugin: SparkPlugin = {
  manifest: {
    id: 'areas-of-interest',
    name: 'Knowledge Base',
    icon: 'folder_special',
    description: 'Organize your research',
  },
  components: {
    mainView: AreasMain,
    dashboardWidget: AreasWidget, // <--- Register
  },
  routes: [
    {
      path: 'areas',
      name: 'areas-main',
      component: AreasMain,
    },
  ],
}

export default AreasPlugin
