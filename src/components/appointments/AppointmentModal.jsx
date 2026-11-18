"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import { STATUSES, STATUS_STYLES } from "@/components/ui/StatusBadge";
import { updateAppointment } from "@/services/appointmentService";
import { formatDateTime, telHref, toDateInput, whatsappHref } from "@/utils/format";

export const SOURCE_LABELS = { website: "Website", phone: "Phone call", whatsapp: "WhatsApp", "walk-in": "Walk-in" };

export default function AppointmentModal({ appointment, doctors = [], onClose, onSaved, onDelete }) {
  const initial = {
    status: appointment.status,
    notes: appointment.notes || "",
    preferredDate: toDateInput(appointment.preferredDate),
    time: appointment.time || "",
    doctor: appointment.doctor?._id || "",
  };
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const changed = Object.fromEntries(Object.entries(form).filter(([k, v]) => v !== initial[k]));
  const dirty = Object.keys(changed).length > 0;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setError("");
    setFieldErrors({});
    try {
      const { data } = await updateAppointment(appointment._id, changed);
      onSaved(data);
    } catch (err) {
      setFieldErrors(Object.fromEntries((err.errors || []).map((x) => [x.field, x.message])));
      setError(err.message);
      setSaving(false);
    }
  };

  // Doctors list may not include a since-hidden doctor; keep the current one selectable.
  const doctorOptions =
    appointment.doctor && !doctors.some((d) => d._id === appointment.doctor._id) ? [appointment.doctor, ...doctors] : doctors;
  const history = [...(appointment.history || [])].reverse();

  return (
    <Modal
      open
      size="lg"
      title={appointment.fullName}
      description={`${SOURCE_LABELS[appointment.source] || "Website"} request · ${formatDateTime(appointment.createdAt)}`}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button type="button" onClick={onDelete} className="btn-danger-ghost sm:mr-auto sm:-ml-2">
              <Icon name="trash" className="h-4 w-4" /> Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" form="appointment-form" className="btn-primary" disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr]">
        <a href={whatsappHref(appointment.phone)} target="_blank" rel="noopener noreferrer" className="btn-secondary">
          <Icon name="message" className="h-[1.125rem] w-[1.125rem] text-brand-600" /> WhatsApp
        </a>
        <a href={telHref(appointment.phone)} className="btn-secondary">
          <Icon name="phone" className="h-[1.125rem] w-[1.125rem] text-brand-600" /> Call
        </a>
        <div className="flex h-10 items-center rounded-lg bg-canvas px-3 text-sm">
          <span className="truncate">
            <span className="text-muted">Service: </span>
            <span className="font-medium">{appointment.service?.title || "—"}</span>
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted tabular-nums">{appointment.phone}</p>

      <form id="appointment-form" onSubmit={handleSave} className="mt-6 space-y-6">
        <fieldset>
          <legend className="field-label">Status</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STATUSES.map((s) => {
              const active = form.status === s;
              return (
                <label
                  key={s}
                  className={`flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium capitalize transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600 ${
                    active ? "border-ink bg-ink text-white" : "border-line-strong text-ink-soft hover:bg-canvas"
                  }`}
                >
                  <input type="radio" name="status" value={s} checked={active} onChange={set("status")} className="sr-only" />
                  <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[s].dot}`} aria-hidden="true" />
                  {s}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="appt-date" className="field-label">
              Date
            </label>
            <input id="appt-date" type="date" required className="field-input" value={form.preferredDate} onChange={set("preferredDate")} />
            {fieldErrors.preferredDate && <p className="field-hint !text-danger">{fieldErrors.preferredDate}</p>}
          </div>
          <div>
            <label htmlFor="appt-time" className="field-label">
              Time <span className="font-normal text-muted">(once agreed)</span>
            </label>
            <input id="appt-time" type="time" step={300} className="field-input" value={form.time} onChange={set("time")} />
            {fieldErrors.time && <p className="field-hint !text-danger">{fieldErrors.time}</p>}
          </div>
          <div>
            <label htmlFor="appt-doctor" className="field-label">
              Doctor
            </label>
            <select id="appt-doctor" className="field-input" value={form.doctor} onChange={set("doctor")}>
              <option value="">Not assigned</option>
              {doctorOptions.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="field-label">
            Internal notes
          </label>
          <textarea
            id="notes"
            rows={3}
            className="field-input"
            value={form.notes}
            onChange={set("notes")}
            placeholder="e.g. Confirmed on WhatsApp, patient will join by video"
          />
          <p className="field-hint">Only visible to clinic staff.</p>
        </div>

        {error && Object.keys(fieldErrors).length === 0 && <Alert>{error}</Alert>}

        {history.length > 0 && (
          <div>
            <p className="field-label">History</p>
            <ol className="space-y-2.5 rounded-lg border border-line p-4">
              {history.map((h, i) => (
                <li key={i} className="flex items-center gap-2.5 text-sm">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_STYLES[h.status]?.dot || "bg-line-strong"}`} aria-hidden="true" />
                  <span className="text-ink-soft">
                    <span className="font-medium capitalize">{h.status}</span>
                    {h.by && <span className="text-muted"> by {h.by}</span>}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-muted">{formatDateTime(h.at)}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </form>
    </Modal>
  );
}
