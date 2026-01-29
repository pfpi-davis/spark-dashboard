import type { SparkPlugin } from '@/core/types/plugin'
import WriterMain from './views/WriterMain.vue'

const WriterPlugin: SparkPlugin = {
  manifest: {
    id: 'writer',
    name: 'Writer',
    icon: 'edit_note', // Matches your Material icon style
    description: 'Distraction-free drafting environment',
  },
  components: {
    mainView: WriterMain,
    // We can add a dashboardWidget here later if we build one
  },
  routes: [
    {
      path: 'writer',
      name: 'writer-main',
      component: WriterMain,
    },
  ],
  // Optional: If your architecture supports an initialize() hook for the store, keep it.
  // If not, the store auto-initializes when the component is mounted.
}

export default WriterPlugin
