export interface Area {
  id: string;
  name: string;
  description?: string;
  createdAt: any; // Firestore Timestamp
}

export interface SavedItem {
  id: string;
  areaId: string;      // The folder it belongs to
  type: 'rss' | 'spark' | 'note' | 'web'; // Expandable types
  title: string;
  sourceUrl?: string;  // Optional, if it's a link
  content?: any;       // The full payload (RSS item, Spark summary, text)
  savedAt: any;
  tags?: string[];
}