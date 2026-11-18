"use client";

import { useEffect, useId, useRef } from "react";
import Icon from "@/components/ui/Icon";

// Centered dialog on desktop, bottom sheet on phones.
export default function Modal({ title, description, open, onClose, children, footer, size = "md" }) {
  const titleId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Focus the first field, or the panel itself.
    const first = panelRef.current?.querySelector("input:not([type=hidden]), select, textarea");
    (first || panelRef.current)?.focus();

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const width = size === "sm" ? "sm:max-w-md" : size === "lg" ? "sm:max-w-2xl" : "sm:max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="animate-fade absolute inset-0 bg-ink/45" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`animate-dialog relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-lift outline-none sm:rounded-2xl ${width}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-line bg-canvas/60 px-5 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:rounded-b-2xl sm:px-6 sm:pb-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
