"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Alert from "@/components/ui/Alert";
import BrandMark from "@/components/layout/BrandMark";

export default function LoginPage() {
  const { admin, loading, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && admin) router.replace("/");
  }, [loading, admin, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-12 text-white lg:flex">
        <svg className="absolute inset-0 h-full w-full text-white/[0.05]" aria-hidden="true">
          <defs>
            <pattern id="login-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M14 9v10M9 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
        </svg>
        <div className="relative flex items-center gap-3">
          <BrandMark className="h-14 w-14" />
          <span className="font-display text-lg font-semibold">Al Hanna United Care</span>
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-[2.5rem] leading-[1.12] font-semibold">
            Appointments, services and doctors, in one place.
          </p>
          <p className="mt-4 text-white/65">Manage what patients see on the website and confirm their requests.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 lg:hidden">
            <BrandMark className="h-12 w-12" tone="dark" />
            <span className="font-display text-lg font-semibold">Al Hanna United Care</span>
          </div>
          <h1 className="mt-10 font-display text-3xl font-semibold lg:mt-0">Sign in</h1>
          <p className="mt-1.5 text-muted">Use your clinic admin account.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="field-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="field-input h-11"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="field-input h-11 pr-16"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-2 py-1 text-[0.8125rem] font-semibold text-brand-700 hover:bg-brand-50"
                  aria-pressed={showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <Alert>{error}</Alert>
            <button type="submit" className="btn-primary h-11 w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
