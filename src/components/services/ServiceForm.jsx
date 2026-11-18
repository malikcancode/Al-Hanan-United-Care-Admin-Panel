"use client";

import { useState } from "react";
import Alert from "@/components/ui/Alert";
import Toggle from "@/components/ui/Toggle";
import ServiceIcon, { ICON_NAMES } from "@/components/ui/ServiceIcon";

const EMPTY = { title: "", description: "", icon: "video", order: 0, isActive: true };
const ICON_LABELS = { video: "Video", heart: "Heart", flask: "Lab", file: "Document", users: "Family", chat: "Chat" };

export default function ServiceForm({ id, initial, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const { title, description, icon, order, isActive } = form;
      await onSubmit({ title, description, icon, order: Number(order) || 0, isActive });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-5" aria-busy={saving}>
      <div>
        <label htmlFor="title" className="field-label">
          Title
        </label>
        <input id="title" required className="field-input" value={form.title} onChange={set("title")} placeholder="Video consultation" />
      </div>
      <div>
        <label htmlFor="description" className="field-label">
          Description
        </label>
        <textarea id="description" required rows={3} className="field-input" value={form.description} onChange={set("description")} />
        <p className="field-hint">One or two sentences. Shown under the title on the website.</p>
      </div>
      <fieldset>
        <legend className="field-label">Icon</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {ICON_NAMES.map((name) => {
            const active = form.icon === name;
            return (
              <label
                key={name}
                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border px-1 py-2.5 text-xs font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600 ${
                  active ? "border-brand-600 bg-brand-50 text-brand-800" : "border-line text-muted hover:bg-canvas"
                }`}
              >
                <input type="radio" name="icon" value={name} checked={active} onChange={() => setForm((f) => ({ ...f, icon: name }))} className="sr-only" />
                <ServiceIcon name={name} className="h-9 w-9" />
                {ICON_LABELS[name] || name}
              </label>
            );
          })}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor="order" className="field-label">
            Display order
          </label>
          <input id="order" type="number" inputMode="numeric" className="field-input" value={form.order} onChange={set("order")} />
        </div>
        <div className="sm:pt-[1.625rem]">
          <Toggle id="isActive" checked={form.isActive} onChange={set("isActive")} label="Visible on website" description="Hidden services can't be booked." />
        </div>
      </div>
      <Alert>{error}</Alert>
    </form>
  );
}
