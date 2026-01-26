import type { SparkPlugin } from './types/plugin';

// Import your plugins here
// import { MyPlugin } from '@/domains/my-plugin';

export const activePlugins: SparkPlugin[] = [
  // MyPlugin
];

export function getRoutes() {
  return activePlugins.flatMap(p => p.routes);
}