"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ToastVariant = "success" | "warning" | "danger" | "info";

type ToastItem = {
  id: number;
  variant: ToastVariant;
  title: string;
  desc?: string;
};

type ToastContextValue = {
  push: (variant: ToastVariant, title: string, desc?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICON_BY_VARIANT: Record<ToastVariant, string> = {
  success: "ti-circle-check",
  warning: "ti-alert-triangle",
  danger: "ti-alert-circle",
  info: "ti-info-circle",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((variant: ToastVariant, title: string, desc?: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, variant, title, desc }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 w-80">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.variant}`}>
            <i className={`ti ${ICON_BY_VARIANT[t.variant]}`} />
            <div>
              <div className="toast-title">{t.title}</div>
              {t.desc && <div className="toast-desc">{t.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
