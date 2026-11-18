"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSettings } from "@/services/settingService";
import { changePassword } from "@/services/authService";
import { tokenStorage } from "@/services/apiClient";
import { useToast } from "@/context/ToastContext";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";

const FIELDS = [
  { key: "clinicName", label: "Clinic name", span: true, autoComplete: "organization" },
  { key: "phone", label: "Phone", type: "tel", placeholder: "+971 4 123 4567" },
  { key: "whatsapp", label: "WhatsApp", type: "tel", placeholder: "+971 50 123 4567", hint: "Include the country code." },
  { key: "email", label: "Email", type: "email", span: true },
  { key: "address", label: "Clinic address", textarea: true },
  { key: "hours", label: "Opening hours", textarea: true, placeholder: "Sat–Thu: 9:00 AM – 9:00 PM\nFri: Closed" },
  { key: "timezone", label: "Clinic timezone", select: true, hint: "Used to decide what counts as “today” in the dashboard and appointment lists." },
];

const COMMON_ZONES = ["Asia/Dubai", "Asia/Riyadh", "Asia/Qatar", "Asia/Kuwait", "Asia/Bahrain", "Asia/Muscat", "Asia/Karachi", "Europe/London"];
const timezoneOptions = (current) => {
  let all = [];
  try {
    all = Intl.supportedValuesOf("timeZone");
  } catch {
    all = COMMON_ZONES;
  }
  const rest = all.filter((z) => !COMMON_ZONES.includes(z));
  const list = [...COMMON_ZONES, ...rest];
  return current && !list.includes(current) ? [current, ...list] : list;
};

function Section({ title, description, children }) {
  return (
    <section className="grid gap-5 border-t border-line pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[17rem_1fr] lg:gap-12">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="card p-5 sm:p-6">{children}</div>
    </section>
  );
}

function ClinicInfoForm() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then(({ data }) => {
        const values = Object.fromEntries(FIELDS.map((f) => [f.key, data?.[f.key] || (f.key === "timezone" ? "Asia/Dubai" : "")]));
        setForm(values);
        setSaved(values);
      })
      .catch((err) => setError(err.message));
  }, []);

  const dirty = form && saved && FIELDS.some((f) => form[f.key] !== saved[f.key]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await updateSettings(form);
      setSaved(form);
      toast("Clinic information saved. The website updates within a few minutes.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!form) return error ? <Alert>{error}</Alert> : <Spinner className="py-10" />;

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <div key={field.key} className={field.span || field.textarea || field.select ? "sm:col-span-2" : ""}>
          <label htmlFor={field.key} className="field-label">
            {field.label}
          </label>
          {field.select ? (
            <select
              id={field.key}
              className="field-input"
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            >
              {timezoneOptions(form[field.key]).map((z) => (
                <option key={z} value={z}>
                  {z.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          ) : field.textarea ? (
            <textarea
              id={field.key}
              rows={3}
              className="field-input"
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            />
          ) : (
            <input
              id={field.key}
              type={field.type || "text"}
              autoComplete={field.autoComplete || "off"}
              className="field-input"
              placeholder={field.placeholder}
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
            />
          )}
          {field.hint && <p className="field-hint">{field.hint}</p>}
        </div>
      ))}
      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:flex-1">
          <Alert>{error}</Alert>
          {!error && <p className="text-sm text-muted">{dirty ? "You have unsaved changes." : "All changes saved."}</p>}
        </div>
        <div className="flex gap-2">
          {dirty && (
            <button type="button" className="btn-ghost" onClick={() => setForm(saved)} disabled={saving}>
              Discard
            </button>
          )}
          <button type="submit" className="btn-primary flex-1 sm:flex-none" disabled={saving || !dirty}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

function PasswordForm() {
  const toast = useToast();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState({});

  const mismatch = form.confirm && form.newPassword !== form.confirm;
  const tooShort = form.newPassword && form.newPassword.length < 8;
  const weak = form.newPassword && !tooShort && !(/[A-Za-z]/.test(form.newPassword) && /\d/.test(form.newPassword));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (mismatch || tooShort || weak) return;
    setSaving(true);
    setError("");
    try {
      // Other devices are signed out; this one continues with the fresh token.
      const { data } = await changePassword(form.currentPassword, form.newPassword);
      if (data?.token) tokenStorage.set(data.token);
      setForm({ currentPassword: "", newPassword: "", confirm: "" });
      setVisible({});
      toast("Password updated. Other devices have been signed out.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const input = (key, label, autoComplete, hint, invalid) => (
    <div>
      <label htmlFor={key} className="field-label">
        {label}
      </label>
      <div className="relative">
        <input
          id={key}
          type={visible[key] ? "text" : "password"}
          required
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          className={`field-input pr-12 ${invalid ? "!border-danger focus:!ring-danger/15" : ""}`}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => ({ ...v, [key]: !v[key] }))}
          aria-label={visible[key] ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={!!visible[key]}
          aria-controls={key}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-[10px] text-muted transition-colors hover:text-ink"
        >
          <Icon name={visible[key] ? "eyeOff" : "eye"} className="h-5 w-5" />
        </button>
      </div>
      {hint && <p className={`field-hint ${invalid ? "!text-danger" : ""}`}>{hint}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:max-w-md">
      {input("currentPassword", "Current password", "current-password")}
      {input("newPassword", "New password", "new-password", "At least 8 characters, with a letter and a number.", tooShort || weak)}
      {input("confirm", "Confirm new password", "new-password", mismatch ? "Passwords don't match." : null, mismatch)}
      <Alert>{error}</Alert>
      <div>
        <button type="submit" className="btn-primary" disabled={saving || mismatch || tooShort || weak}>
          {saving ? "Updating…" : "Update password"}
        </button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Clinic contact details and your admin account." />
      <div className="space-y-8">
        <Section title="Clinic information" description="Shown in the website header, footer and contact page. Leave a field empty to hide it.">
          <ClinicInfoForm />
        </Section>
        <Section title="Password" description="Use a strong password you don't use anywhere else. Changing it signs out every other device.">
          <PasswordForm />
        </Section>
      </div>
    </>
  );
}
