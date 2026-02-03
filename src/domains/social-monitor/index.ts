import type { SparkPlugin } from '@/core/types/plugin'
import SocialMain from './views/SocialMain.vue'

const SocialPlugin: SparkPlugin = {
  manifest: {
    id: 'social-monitor',
    name: 'Social Monitor',
    icon: 'public',
    description: 'Track conversations on BlueSky',
  },
  components: {
    mainView: SocialMain,
  },
  routes: [
    {
      path: 'social',
      name: 'social-main',
      component: SocialMain,
    },
  ],
}

export default SocialPlugin
