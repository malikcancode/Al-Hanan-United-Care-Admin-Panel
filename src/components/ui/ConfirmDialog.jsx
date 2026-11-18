"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

// Replaces window.confirm. tone="danger" for destructive actions, "primary" otherwise.
export default function ConfirmDialog({ open, title, message, confirmLabel = "Delete", tone = "danger", onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={busy ? () => {} : onClose}
      size="sm"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={tone === "danger" ? "btn-danger" : "btn-primary"} onClick={handleConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-ink-soft">{message}</p>
    </Modal>
  );
}
