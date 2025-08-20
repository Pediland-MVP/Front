// components/theme/ui/toast.tsx
"use client";

export type ToastType = "default" | "success" | "error" | "warning";

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
}

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  description?: string;
  action?: ToastAction;
  duration?: number;
  dismissible?: boolean;
}

export interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

// Toast utility functions similar to sonner
export const toast = {
  default: (message: string, options?: Partial<Omit<Toast, "id" | "type">>) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("add-toast", {
          detail: { type: "default", description: message, ...options },
        }),
      );
    }
  },
  success: (message: string, options?: Partial<Omit<Toast, "id" | "type">>) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("add-toast", {
          detail: { type: "success", description: message, ...options },
        }),
      );
    }
  },
  error: (message: string, options?: Partial<Omit<Toast, "id" | "type">>) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("add-toast", {
          detail: { type: "error", description: message, ...options },
        }),
      );
    }
  },
  warning: (message: string, options?: Partial<Omit<Toast, "id" | "type">>) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("add-toast", {
          detail: { type: "warning", description: message, ...options },
        }),
      );
    }
  },
  dismiss: (id?: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("dismiss-toast", { detail: { id } }),
      );
    }
  },
};
