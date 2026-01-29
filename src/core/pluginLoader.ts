import type { SparkPlugin } from './types/plugin'
import AreasPlugin from '@/domains/areas-of-interest'
import FeedAggregatorPlugin from '@/domains/feed-aggregator'
import ActionCenterPlugin from '@/domains/action-center'
import writerPlugin from '@/domains/writer'

export const activePlugins: SparkPlugin[] = [
  AreasPlugin,
  FeedAggregatorPlugin,
  ActionCenterPlugin,
  writerPlugin,
]

export function getRoutes() {
  return activePlugins.flatMap((p) => p.routes)
}
