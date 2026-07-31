"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastType = "success" | "error";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
  visible: boolean;
};

const EXIT_MS = 300;
const LIFETIME_MS = 3500;

const ToastContext = createContext<
  ((message: string, type?: ToastType) => void) | null
>(null);

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used within ToastProvider");
  return toast;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = idRef.current++;
    setToasts((t) => [...t, { id, message, type, visible: false }]);

    requestAnimationFrame(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, visible: true } : x)));
    });

    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, visible: false } : x)));
      setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, EXIT_MS);
    }, LIFETIME_MS);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border px-4 py-2.5 text-[13px] shadow-lg backdrop-blur-sm transition-all duration-300 ease-out ${
              t.visible
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
            } ${
              t.type === "error"
                ? "border-error-border bg-error-bg text-error-text"
                : "border-accent/30 bg-surface/95 text-foreground"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
