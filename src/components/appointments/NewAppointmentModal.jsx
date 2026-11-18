"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Alert from "@/components/ui/Alert";
import { STATUSES } from "@/components/ui/StatusBadge";
import { createAppointment } from "@/services/appointmentService";

const SOURCES = [
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "walk-in", label: "Walk-in" },
];

const today = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

// For bookings staff take by phone, WhatsApp or at the front desk.
export default function NewAppointmentModal({ services = [], doctors = [], onClose, onCreated }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    service: services.find((s) => s.isActive)?._id || services[0]?._id || "",
    preferredDate: today(),
    time: "",
    doctor: "",
    source: "phone",
    status: "confirmed",
    notes: "",
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setErrors({});
    try {
      const { data } = await createAppointment(form);
      onCreated(data);
    } catch (err) {
      setErrors(Object.fromEntries((err.errors || []).map((x) => [x.field, x.message])));
      setError(err.message);
      setSaving(false);
    }
  };

  const input = (key) => ({
    id: `new-${key}`,
    value: form[key],
    onChange: set(key),
    "aria-invalid": errors[key] ? true : undefined,
    className: `field-input ${errors[key] ? "!border-danger" : ""}`,
  });
  const err = (key) => errors[key] && <p className="field-hint !text-danger">{errors[key]}</p>;

  return (
    <Modal
      open
      size="lg"
      title="New appointment"
      description="For bookings taken by phone, WhatsApp or at the clinic."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" form="new-appointment-form" className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Add appointment"}
          </button>
        </>
      }
    >
      <form id="new-appointment-form" onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div>
          <label htmlFor="new-fullName" className="field-label">
            Patient name
          </label>
          <input {...input("fullName")} autoComplete="off" required />
          {err("fullName")}
        </div>
        <div>
          <label htmlFor="new-phone" className="field-label">
            Phone / WhatsApp
          </label>
          <input {...input("phone")} type="tel" inputMode="tel" placeholder="+971 50 123 4567" required />
          {err("phone")}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="new-service" className="field-label">
            Service
          </label>
          <select {...input("service")} required>
            {services.length === 0 && <option value="">Add a service first</option>}
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title}
                {s.isActive ? "" : " (hidden)"}
              </option>
            ))}
          </select>
          {err("service")}
        </div>
        <div>
          <label htmlFor="new-preferredDate" className="field-label">
            Date
          </label>
          <input {...input("preferredDate")} type="date" required />
          {err("preferredDate")}
        </div>
        <div>
          <label htmlFor="new-time" className="field-label">
            Time <span className="font-normal text-muted">(optional)</span>
          </label>
          <input {...input("time")} type="time" step={300} />
          {err("time")}
        </div>
        <div>
          <label htmlFor="new-doctor" className="field-label">
            Doctor <span className="font-normal text-muted">(optional)</span>
          </label>
          <select {...input("doctor")}>
            <option value="">Not assigned</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          {err("doctor")}
        </div>
        <div>
          <label htmlFor="new-source" className="field-label">
            Booked by
          </label>
          <select {...input("source")}>
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="new-status" className="field-label">
            Status
          </label>
          <select {...input("status")} className="field-input capitalize">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="new-notes" className="field-label">
            Internal notes <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea {...input("notes")} rows={2} />
        </div>
        {error && Object.keys(errors).length === 0 && (
          <div className="sm:col-span-2">
            <Alert>{error}</Alert>
          </div>
        )}
      </form>
    </Modal>
  );
}
