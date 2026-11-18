"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message, type = "success") => {
      const id = ++nextId.current;
      setToasts((t) => [...t.slice(-2), { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-end sm:p-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className="animate-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-ink px-4 py-3 text-sm text-white shadow-lift"
          >
            <Icon
              name={t.type === "error" ? "alert" : "check"}
              className={`h-[1.125rem] w-[1.125rem] ${t.type === "error" ? "text-red-300" : "text-brand-200"}`}
              strokeWidth={2}
            />
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="-mr-1 rounded p-1 text-white/60 hover:text-white"
              aria-label="Dismiss"
            >
              <Icon name="close" className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
