import type { SparkPlugin } from './types/plugin';
import AreasPlugin from '@/domains/areas-of-interest';
import FeedAggregatorPlugin from '@/domains/feed-aggregator';

export const activePlugins: SparkPlugin[] = [
  AreasPlugin,
  FeedAggregatorPlugin,
];

export function getRoutes() {
  return activePlugins.flatMap(p => p.routes);
}