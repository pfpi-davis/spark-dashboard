// src/core/types/plugin.ts
import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import type { StoreDefinition } from 'pinia';

export interface SparkPlugin {
  manifest: {
    id: string;
    name: string;
    description?: string;
    icon?: string; // Material Design icon string
  };

  // The visual pieces the App Shell needs to render
  components: {
    dashboardWidget?: Component; // Small card for Home View
    mainView: Component;         // Full screen tool view
    settingsView?: Component;    // Optional settings panel
  };

  // Router logic specific to this domain
  routes: RouteRecordRaw[];

  // State management
  store?: StoreDefinition;
}