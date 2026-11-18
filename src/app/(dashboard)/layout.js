"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar, { NAV } from "@/components/layout/Sidebar";
import BrandMark from "@/components/layout/BrandMark";
import Icon from "@/components/ui/Icon";
import Spinner from "@/components/ui/Spinner";

export default function DashboardLayout({ children }) {
  const { admin, loading, offline, retry } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Only send to login when the session is really gone, never because the API was briefly unreachable.
  useEffect(() => {
    if (!loading && !offline && !admin) router.replace("/login");
  }, [loading, offline, admin, router]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  if (offline && !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
            <Icon name="alert" className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-lg font-semibold">Can’t reach the server</h1>
          <p className="mt-1.5 text-sm text-muted">
            You’re still signed in. We’ll reconnect automatically as soon as the server is back.
          </p>
          <button type="button" className="btn-primary mt-6" onClick={retry}>
            Try again now
          </button>
        </div>
      </div>
    );
  }

  if (loading || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Checking your session…" />
      </div>
    );
  }

  const current = NAV.find((n) => (n.href === "/" ? pathname === "/" : pathname.startsWith(n.href)));

  return (
    <div className="min-h-screen">
      <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && (
        <div className="animate-fade fixed inset-0 z-30 bg-ink/45 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-white/95 px-2 backdrop-blur-sm lg:hidden">
          <button type="button" onClick={() => setMenuOpen(true)} className="icon-btn h-10 w-10 text-ink" aria-label="Open menu" aria-expanded={menuOpen}>
            <Icon name="menu" className="h-6 w-6" strokeWidth={2} />
          </button>
          <BrandMark className="h-9 w-9" tone="dark" />
          <span className="truncate font-semibold">{current?.label || "Admin"}</span>
        </header>
        <main className="mx-auto w-full max-w-[72rem] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
