# ⚡ SPARK Developer Guide

Welcome to the **SPARK** codebase. This is a modular **Personal Knowledge Management (PKM)** application designed to help researchers and advocates move from "collecting" information to "acting" on it.

## 1. Tech Stack

- **Framework:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **State Management:** [Pinia](https://pinia.vuejs.org/)
- **Backend / Database:** [Firebase](https://firebase.google.com/) (Firestore & Auth)
- **Routing:** [Vue Router](https://router.vuejs.org/)
- **Rich Text:** [Quill](https://quilljs.com/) (wrapped in `RichEditor.vue`)
- **Icons:** Material Design Icons (via text strings, e.g., 'bolt', 'folder')

---

## 2. Architecture Overview

SPARK uses a **Core + Plugins** architecture.

1. **Core (`src/core`)**: The "App Shell." It handles authentication, layout, global data (Saved Items), and shared UI components. It knows nothing about specific domain logic.
2. **Domains (`src/domains`)**: These are "Plugins." Each folder here represents a feature set (e.g., RSS Feeds, Folder Management).
3. **Strict Unidirectional Dependency**:

- ✅ Domains can import from Core.
- ❌ Domains **cannot** import from other Domains.
- If two domains need to share data (e.g., Feeds needing to save to Areas), they must communicate via a **Core Store** or **Core Component**.

### Directory Structure

```text
src/
├── core/                  # The Foundation
│   ├── components/        # Shared UI (Modals, Toasts, RichEditor)
│   ├── layouts/           # App Shell (Sidebar, Main Content)
│   ├── services/          # External integrations (Firebase)
│   ├── stores/            # Global State (Auth, Items, Analysis)
│   └── types/             # Global Interfaces (SavedItem, PluginDefinition)
│
├── domains/               # The Features (Plugins)
│   ├── action-center/     # Kanban/Triage view
│   ├── areas-of-interest/ # Folder management view
│   ├── feed-aggregator/   # RSS/API ingestion
│   └── quick-notes/       # Rapid capture
│
├── router/                # Main router entry point
├── config.ts              # App-wide constants
└── main.ts                # App entry

```

---

## 3. Core Concepts

### A. The "Item" (`SavedItem`)

The fundamental unit of data in SPARK is the `SavedItem`.

- **Defined in:** `src/core/types/items.ts`
- **Managed by:** `src/core/stores/items.ts`
- **Storage:** Firestore collection `users/{uid}/saved_items`
- **Purpose:** Any piece of knowledge (Note, Web Clip, RSS Article) that the user has decided to _keep_.

### B. The "Resource" (`Resource`)

A raw piece of information that hasn't been saved yet (e.g., an incoming RSS feed item).

- **Defined in:** `src/core/types/domain.ts`
- **Managed by:** Domain-specific stores (like `feed-aggregator`).
- **Lifecycle:** A `Resource` becomes a `SavedItem` when the user clicks "Save."

### C. The Plugin Interface

Every feature in `src/domains` must export a `SparkPlugin` object to be recognized by the app.

```typescript
// src/core/types/plugin.ts
export interface SparkPlugin {
  manifest: {
    id: string
    name: string
    icon: string
    description: string
  }
  components: {
    mainView: Component // The full-page view
    dashboardWidget?: Component // The home screen card
  }
  routes: RouteRecordRaw[] // Routes to register
}
```

---

## 4. Plugin Deep Dive

### 📂 Areas of Interest (Knowledge Base)

- **Purpose:** Manages the folder hierarchy and displays saved items filtered by folder.
- **Key Store:** `useAreasStore` (Only manages folder structure/tree).
- **Data Flow:** Uses `useItemsStore` (Core) to fetch and display items.
- **Key Components:** `AreaTreeItem` (Recursive sidebar), `AreaFormModal`.

### 📡 Feed Aggregator (News Wire)

- **Purpose:** Ingests external data from RSS, Government APIs, and News APIs.
- **Key Store:** `useFeedStore`.
- **Architecture:** Uses the **Adapter Pattern** (`rssAdapter`, `govAdapter`, `newsAdapter`) to normalize different APIs into a standard `Resource` format.
- **Interaction:** Users "Save" resources to the Knowledge Base using the shared `SaveResourceModal` (Core).

### ⚡ Action Center

- **Purpose:** A Triage/Workflow view of your saved items.
- **Logic:** It does _not_ have its own data. It filters the global `useItemsStore` based on the `actionStatus` field (`inbox`, `to_analyze`, `to_write`, `to_share`).
- **Workflow:** Items move left-to-right (Analyze -> Write -> Share -> Archive).

---

## 5. How to Add a New Plugin

To add a new feature (e.g., "Project Manager"), follow these steps:

**Step 1: Create the Directory**
Create `src/domains/project-manager/`.

**Step 2: Create the Main View**
Create `views/ProjectMain.vue`.

**Step 3: Define the Plugin**
Create `index.ts` in your folder:

```typescript
import type { SparkPlugin } from '@/core/types/plugin'
import ProjectMain from './views/ProjectMain.vue'

const ProjectPlugin: SparkPlugin = {
  manifest: {
    id: 'project-manager',
    name: 'Projects',
    icon: 'assignment', // Material Icon name
    description: 'Manage active research projects',
  },
  components: {
    mainView: ProjectMain,
  },
  routes: [
    {
      path: 'projects', // becomes /projects
      name: 'projects-main',
      component: ProjectMain,
    },
  ],
}

export default ProjectPlugin
```

**Step 4: Register the Plugin**
Open `src/core/pluginLoader.ts` and add it to the list:

```typescript
import ProjectPlugin from '@/domains/project-manager'

export const activePlugins = [
  AreasPlugin,
  FeedAggregatorPlugin,
  ActionCenterPlugin,
  ProjectPlugin, // <--- Added here
]
```

The app will automatically generate the Sidebar link, the Route, and the Dashboard widget (if you provided one).

---

## 6. Common Developer Tasks

### How to Save Data

Do not write directly to Firestore from a View. Use the Stores.

- **To save a Note/Item:** `useItemsStore().createItem(...)`
- **To create a Folder:** `useAreasStore().createArea(...)`

### How to use the Rich Text Editor

Don't use `Quill` directly. Use the Core wrapper:

```vue
<script setup>
import RichEditor from '@/core/components/RichEditor.vue'
const content = ref('<p>Hello</p>')
</script>

<template>
  <RichEditor v-model="content" />
</template>
```

### How to add a Global Service

If you need logic shared by multiple plugins (e.g., an "Export to PDF" service):

1. Create `src/core/services/pdfService.ts`.
2. Import it into your plugins.
3. **Do not** create the service inside one domain and try to import it into another.

---

## 7. Troubleshooting

- **"Component not found":** Ensure you are importing from `@/core/...` or the specific domain. Relative imports `../` should only be used within the same domain.
- **"Store state not updating":** Check if you have broken reactivity by destructuring props. Always access store state via `store.someVar` or use `storeToRefs(store)`.
- **"Firebase Permission Denied":** Check `firestore.rules` in the Firebase console. Ensure the user is logged in (`auth.user` is defined).
