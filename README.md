# Spark Roadmap

## Existing Plugins

### Areas of Interest

### Action Center

## Planned Features

- Zotero Bridge: Create a lightweight client that connects to the Zotero Web API to fetch library metadata without storing files.
- Writer's Studio: A focused writing environment that puts your "Action Items" and "Zotero References" side-by-side with your draft.
- Tag Manager: A centralized properties manager to manage tags, colors of tags, status, and other properties.

---

# 🚀 SPARK Expansion Roadmap: The Writer's Studio

## Overview

This initiative aims to transform SPARK from a "collection" tool into a "production" tool. We will add two new plugins that work together to create a split-screen authoring environment.

**Key Constraint:** We will **not** build a PDF manager or file storage system. We will leverage the user's existing Zotero library as the "Source of Truth" for citations and documents.

---

## Phase 1: The Zotero Bridge

**Directory:** `src/domains/zotero`

### Goal

Create a lightweight client that connects to the Zotero Web API to fetch library metadata without storing files.

### 1. Configuration & Auth

- **Requirements:** A Settings View to input `Zotero API Key` and `User ID`.
- **Storage:** Save these keys in `localStorage` (or Firestore `user_settings` collection) so they persist.
- **Security:** Ensure keys are never exposed in shared logs.

### 2. The Zotero Store (`useZoteroStore`)

- **State:**
- `collections`: Tree structure of Zotero folders.
- `items`: Flat list of current collection items.
- `searchResults`: Transient list for search queries.

- **Actions:**
- `fetchCollections()`: Get folder hierarchy.
- `searchLibrary(query)`: Hit the Zotero Search API.
- `getItemPdfLink(itemKey)`: Construct the `zotero://` URI scheme to open the local desktop app or the web view link.

### 3. The "Reference Deck" Component

- **UI:** A reusable sidebar component (to be used in the Writer's Studio).
- **Features:**
- Search bar.
- List view of items (Title, Author, Year).
- "Copy Citation" button.

---

## Phase 2: The Writer's Studio

**Directory:** `src/domains/writer`

### Goal

A focused writing environment that puts your "Action Items" and "Zotero References" side-by-side with your draft.

### 1. The Split-Screen Layout (`WriterMain.vue`)

- **Left Pane (60%):** The Editor.
- Uses `RichEditor` (Quill).
- **Feature:** Auto-save drafts to Firestore (`users/{uid}/drafts`).

- **Right Pane (40%):** The Resource Deck.
- **Tab 1: Action Items:** Fetches items from `useItemsStore` where `status == 'to_write'`.
- **Tab 2: Zotero:** Renders the "Reference Deck" from Phase 1.

### 2. Drag-and-Drop Citations

- **Interaction:** User drags an item from the Right Pane into the Editor.
- **Result:** The editor inserts a formatted citation (e.g., `(Smith, 2023)`) and links it to the source.

### 3. The "Smart Paste"

- **Interaction:** User copies text from a PDF in Zotero (external app) and pastes it into SPARK.
- **Enhancement:** If possible, detect the clipboard source or allow a "Paste as Quote" feature that wraps the text in a blockquote.

---

## Technical Considerations

1. **Zotero API Rate Limits:** We must implement a simple caching strategy (e.g., store Zotero results in Pinia and only refresh on explicit "Sync" button press) to avoid hitting API limits.
2. **Cross-Plugin Communication:** The Writer's Studio will need to import the `useItemsStore` (Core) for Action Items and the `useZoteroStore` (Zotero Plugin) for references. This follows our "Shared Core / Independent Plugins" architecture.
3. **PDF Handling:** We rely on the `zotero://select/items/[key]` protocol. This allows the web app to trigger the user's _local_ Zotero desktop app to open the specific PDF, bypassing the need for cloud storage/rendering.
