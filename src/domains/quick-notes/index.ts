import type { SparkPlugin } from '@/core/types/plugin';
import NotesWidget from './components/NotesWidget.vue';
import NotesMain from './views/NotesMain.vue';

const QuickNotesPlugin: SparkPlugin = {
  manifest: {
    id: 'quick-notes',
    name: 'Quick Notes',
    description: 'Rapid fire text capture',
    icon: 'note',
  },
  components: {
    dashboardWidget: NotesWidget,
    mainView: NotesMain,
  },
  routes: [
    {
      path: 'notes', // becomes /notes via child routing
      name: 'notes-main',
      component: NotesMain,
    },
  ],
};

export default QuickNotesPlugin;