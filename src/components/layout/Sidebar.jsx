"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import BrandMark from "@/components/layout/BrandMark";

export const NAV = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/appointments", label: "Appointments", icon: "calendar" },
  { href: "/messages", label: "Messages", icon: "mail" },
  { href: "/services", label: "Services", icon: "pulse" },
  { href: "/doctors", label: "Doctors", icon: "user" },
  { href: "/activity", label: "Activity", icon: "history" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export default function Sidebar({ open, onNavigate }) {
  const pathname = usePathname();
  const { admin, logout } = useAuth();
  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col bg-brand-900 text-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:w-64 lg:translate-x-0 ${
        open ? "translate-x-0 shadow-lift" : "-translate-x-full"
      }`}
      aria-label="Admin navigation"
    >
      <div className="flex h-16 items-center justify-between gap-2.5 px-5">
        <Link href="/" onClick={onNavigate} className="flex min-w-0 items-center gap-2.5 rounded-md">
          <BrandMark />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-[0.9375rem] font-semibold">Al Hanna</span>
            <span className="block text-xs text-white/55">Clinic admin</span>
          </span>
        </Link>
        <button
          type="button"
          onClick={onNavigate}
          className="icon-btn -mr-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <Icon name="close" />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5">
        {NAV.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                active ? "bg-white/[0.12] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {active && <span className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r-full bg-brand-200" aria-hidden="true" />}
              <Icon name={link.icon} className={`h-[1.125rem] w-[1.125rem] ${active ? "text-brand-200" : ""}`} />
              {link.label}
            </Link>
          );
        })}

        {process.env.NEXT_PUBLIC_SITE_URL && (
          <a
            href={process.env.NEXT_PUBLIC_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <Icon name="external" className="h-[1.125rem] w-[1.125rem]" />
            View website
          </a>
        )}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar name={admin?.name || admin?.email} size="h-9 w-9" text="text-xs" rounded="rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{admin?.name || "Admin"}</p>
            <p className="truncate text-xs text-white/55">{admin?.email}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="icon-btn text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Log out"
            title="Log out"
          >
            <Icon name="logout" className="h-[1.125rem] w-[1.125rem]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
