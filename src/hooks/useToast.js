import { create } from 'zustand'

export const useToastStore = create((set) => ({
  toasts: [],
  show: (message, type = 'default', duration = 3000, url = null) => {
    const id = Date.now()
    set((s) => ({ toasts: [...s.toasts, { id, message, type, url }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, duration)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Select primitives separately to avoid new object references on every render
export const useToast = () => useToastStore((s) => s.show)
export const useToastList = () => useToastStore((s) => s.toasts)
export const useToastDismiss = () => useToastStore((s) => s.dismiss)
