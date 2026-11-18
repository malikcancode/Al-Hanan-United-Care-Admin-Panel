"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@/components/ui/Alert";
import Avatar from "@/components/ui/Avatar";
import Icon from "@/components/ui/Icon";
import Toggle from "@/components/ui/Toggle";
import { assetUrl } from "@/services/apiClient";

const EMPTY = { name: "", specialty: "", qualifications: "", order: 0, isActive: true };
const MAX_SIZE = 2 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export default function DoctorForm({ id, initial, onSubmit }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(assetUrl(initial?.photoUrl) || "");
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef(null);

  useEffect(() => {
    return () => {
      if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError("Only JPG, PNG or WEBP images are allowed.");
    if (file.size > MAX_SIZE) return setError("The image must be 2 MB or smaller.");

    setError("");
    setPhoto(file);
    setRemovePhoto(false);
    setPreview(URL.createObjectURL(file));
  };

  const handleRemove = () => {
    setPhoto(null);
    setPreview("");
    setRemovePhoto(Boolean(initial?.photoUrl));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const { name, specialty, qualifications, order, isActive } = form;
      await onSubmit({ name, specialty, qualifications, order: Number(order) || 0, isActive, photo, removePhoto });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-5" aria-busy={saving}>
      <div className="flex items-center gap-4">
        <Avatar src={preview} alt="Photo preview" name={form.name} size="h-24 w-20" rounded="rounded-lg" text="text-xl" />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary btn-sm" onClick={() => fileInput.current?.click()}>
              <Icon name="image" className="h-4 w-4" />
              {preview ? "Change photo" : "Upload photo"}
            </button>
            {preview && (
              <button type="button" className="btn-danger-ghost btn-sm" onClick={handleRemove}>
                Remove
              </button>
            )}
          </div>
          <p className="text-[0.8125rem] text-muted">Optional. Portrait JPG, PNG or WEBP, up to 2 MB.</p>
          <input ref={fileInput} type="file" accept={ACCEPTED.join(",")} className="hidden" onChange={handleFile} />
        </div>
      </div>
      <div>
        <label htmlFor="name" className="field-label">
          Full name
        </label>
        <input id="name" required className="field-input" value={form.name} onChange={set("name")} placeholder="Dr. Sara Ahmed" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="specialty" className="field-label">
            Specialty
          </label>
          <input id="specialty" required className="field-input" value={form.specialty} onChange={set("specialty")} placeholder="General Practitioner" />
        </div>
        <div>
          <label htmlFor="qualifications" className="field-label">
            Qualifications <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="qualifications" className="field-input" value={form.qualifications} onChange={set("qualifications")} placeholder="MBBS, FCPS" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <div>
          <label htmlFor="order" className="field-label">
            Display order
          </label>
          <input id="order" type="number" inputMode="numeric" className="field-input" value={form.order} onChange={set("order")} />
        </div>
        <div className="sm:pt-[1.625rem]">
          <Toggle id="isActive" checked={form.isActive} onChange={set("isActive")} label="Visible on website" />
        </div>
      </div>
      <Alert>{error}</Alert>
    </form>
  );
}
