// src/core/types/domain.ts

/**
 * RESOURCE: The Raw Input
 * Something you found (Paper, Article, Permit Notice).
 * It is passive until you "Spark" it.
 */
export interface Resource {
  id: string;              // unique DB ID
  pluginId: string;        // 'rss-aggregator' | 'air-permits'
  externalId: string;      // The original ID (e.g., URL or Permit #)
  
  title: string;
  url?: string;
  summary?: string;        // Auto-generated snippet
  publishedAt: Date;       // When it was created externally
  ingestedAt: Date;        // When your system found it
  
  // The raw data from the plugin (so you never lose context)
  nativeData: Record<string, any>; 
  
  status: 'new' | 'saved' | 'archived';
}

/**
 * SPARK: The Actionable Unit
 * A thought, task, or synthesis derived from Resources.
 * This is what you actually "do" work on.
 */
export interface Spark {
  id: string;
  content: string;         // Markdown supported
  createdAt: Date;
  
  // Relationships
  linkedResourceIds: string[]; 
  linkedProjectIds: string[];
  tags: string[];
}