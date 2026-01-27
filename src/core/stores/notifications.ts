import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

export const useNotificationStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([])

  function notify(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const id = Date.now().toString()
    toasts.value.push({ id, message, type })

    // Auto-remove after 3 seconds
    setTimeout(() => {
      remove(id)
    }, 3000)
  }

  function remove(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, notify, remove }
})
