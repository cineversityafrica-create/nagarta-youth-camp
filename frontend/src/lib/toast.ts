/**
 * Toast notification utility
 * Simple context-based toast system for user feedback
 */

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // milliseconds, 0 = manual dismiss
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

// Generate unique IDs for toasts
export function generateToastId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Helper functions for common toast types
export const toast = {
  success: (message: string, duration = 5000) => ({
    message,
    type: 'success' as const,
    duration,
  }),
  error: (message: string, duration = 5000) => ({
    message,
    type: 'error' as const,
    duration,
  }),
  info: (message: string, duration = 5000) => ({
    message,
    type: 'info' as const,
    duration,
  }),
};
