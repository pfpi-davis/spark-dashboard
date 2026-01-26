export const APP_CONFIG = {
  // 1. Define the icon separately
  appIcon: '⚡', 
  
  // 2. The name comes from .env or defaults to 'SPARK'
  appName: import.meta.env.VITE_APP_TITLE || 'SPARK',
  
  greeting: 'Morning, Researcher.',
  defaultSidebarWidth: 250
};