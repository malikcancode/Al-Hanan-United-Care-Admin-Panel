"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import { updateMessage } from "@/services/messageService";
import { formatDateTime, telHref, whatsappHref } from "@/utils/format";
import { TOPIC_LABELS } from "@/components/messages/MessageStatus";

export default function MessageModal({ message, onClose, onSaved, onDelete }) {
  const [notes, setNotes] = useState(message.notes || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (patch) => {
    setSaving(true);
    setError("");
    try {
      const { data } = await updateMessage(message._id, { notes, ...patch });
      onSaved(data, patch.status === "replied" ? "Marked as replied" : "Message updated");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  const replied = message.status === "replied";

  return (
    <Modal
      open
      size="lg"
      title={message.fullName}
      description={`${TOPIC_LABELS[message.topic] || "General question"} · ${formatDateTime(message.createdAt)}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onDelete} className="btn-danger-ghost sm:mr-auto sm:-ml-2">
            <Icon name="trash" className="h-4 w-4" /> Delete
          </button>
          {replied ? (
            <button type="button" className="btn-secondary" disabled={saving} onClick={() => save({ status: "read" })}>
              Mark as not replied
            </button>
          ) : (
            <button type="button" className="btn-secondary" disabled={saving} onClick={() => save({ status: "replied" })}>
              <Icon name="check" className="h-4 w-4" strokeWidth={2} /> Mark as replied
            </button>
          )}
          <button
            type="button"
            className="btn-primary"
            disabled={saving || notes === (message.notes || "")}
            onClick={() => save({})}
          >
            {saving ? "Saving…" : "Save note"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <a href={whatsappHref(message.phone)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          <Icon name="message" className="h-[1.125rem] w-[1.125rem] text-brand-600" /> WhatsApp
        </a>
        <a href={telHref(message.phone)} className="btn-secondary">
          <Icon name="phone" className="h-[1.125rem] w-[1.125rem] text-brand-600" /> Call
        </a>
        {message.email && (
          <a href={`mailto:${message.email}`} className="btn-secondary col-span-2 sm:col-span-1">
            <Icon name="mail" className="h-[1.125rem] w-[1.125rem] text-brand-600" /> Email
          </a>
        )}
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[0.8125rem] text-muted">Phone / WhatsApp</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{message.phone}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[0.8125rem] text-muted">Email</dt>
          <dd className="mt-0.5 truncate font-medium">{message.email || "—"}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-lg bg-canvas p-4">
        <p className="text-[0.8125rem] text-muted">Message</p>
        <p className="mt-1.5 whitespace-pre-line text-ink [overflow-wrap:anywhere]">{message.message}</p>
      </div>

      <div className="mt-5">
        <label htmlFor="message-notes" className="field-label">
          Internal notes
        </label>
        <textarea
          id="message-notes"
          rows={2}
          className="field-input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Called back, sent lab report on WhatsApp"
        />
        <p className="field-hint">Only visible to clinic staff.</p>
      </div>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}
    </Modal>
  );
}
