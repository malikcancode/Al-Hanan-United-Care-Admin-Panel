"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getStats } from "@/services/dashboardService";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge, { STATUSES, STATUS_STYLES } from "@/components/ui/StatusBadge";
import TrendChart from "@/components/dashboard/TrendChart";
import TopServices from "@/components/dashboard/TopServices";
import ActivityList from "@/components/activity/ActivityList";
import { formatDate, formatRelative, formatTime } from "@/utils/format";

const REFRESH_MS = 60_000;

export default function DashboardPage() {
  const { admin } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      getStats()
        .then(({ data }) => {
          setStats(data);
          setError("");
        })
        .catch((err) => setError(err.message)),
    [],
  );

  // Initial load, then refresh every minute while the tab is visible.
  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const firstName = (admin?.name || "").split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Dashboard"}
        description={
          stats
            ? `${new Date(`${stats.today}T00:00:00Z`).toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                timeZone: "UTC",
              })} · clinic time (${stats.timezone})`
            : "Appointment requests and what patients see on the website."
        }
        action={
          <Link href="/appointments?new=1" className="btn-primary">
            <Icon name="plus" className="h-4 w-4" strokeWidth={2.25} /> New appointment
          </Link>
        }
      />

      {error && !stats ? <Alert>{error}</Alert> : !stats ? <Spinner /> : <Overview stats={stats} />}
    </>
  );
}

function Kpi({ label, value, hint, href }) {
  return (
    <Link href={href} className="group bg-white p-4 transition-colors hover:bg-canvas sm:p-5">
      <p className="text-[0.8125rem] font-medium text-muted">{label}</p>
      <p className="mt-1.5 text-[1.75rem] leading-none font-semibold tabular-nums group-hover:text-brand-700">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </Link>
  );
}

function WeekDelta({ thisWeek, lastWeek }) {
  if (!lastWeek && !thisWeek) return "No requests yet";
  if (!lastWeek) return "none the week before";
  const diff = Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  if (diff === 0) return "same as the week before";
  return `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}% vs week before`;
}

function Overview({ stats }) {
  const counts = stats.statusCounts || {};
  const total = stats.totalAppointments || 0;
  const pending = counts.pending || 0;

  return (
    <div className="space-y-6">
      {pending > 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
              <Icon name="calendar" className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-amber-950">
                {pending} {pending === 1 ? "request is" : "requests are"} waiting for confirmation
              </p>
              <p className="mt-0.5 text-sm text-amber-900/80">Call or WhatsApp the patient, then mark the request as confirmed.</p>
            </div>
          </div>
          <Link href="/appointments?status=pending" className="btn-primary shrink-0">
            Review pending <Icon name="arrow" className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      )}

      {/* Key numbers */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-soft lg:grid-cols-4">
        <Kpi label="Appointments today" value={stats.todayAppointments.count} hint="Booked for today’s date" href="/appointments?view=today" />
        <Kpi
          label="Appointments, next 7 days"
          value={stats.upcomingWeek}
          hint="Booked from tomorrow on"
          href="/appointments?view=upcoming&sort=date_asc"
        />
        <Kpi
          label="Requests received, 7 days"
          value={stats.requests.thisWeek}
          hint={
            <>
              {stats.requests.today ?? 0} today · <WeekDelta {...stats.requests} />
            </>
          }
          href="/appointments"
        />
        <Kpi
          label="Unread messages"
          value={stats.unreadMessages}
          hint={stats.unreadMessages ? "From the contact form" : "All read"}
          href="/messages?status=new"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="card p-5 sm:p-6">
          <TrendChart data={stats.trend} />
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-semibold">By status</h2>
            <p className="text-sm text-muted">
              <span className="font-semibold text-ink tabular-nums">{total}</span> all time
            </p>
          </div>
          <div className="mt-5 flex h-2.5 gap-[2px] overflow-hidden rounded-full bg-canvas" aria-hidden="true">
            {total > 0 &&
              STATUSES.map((s) =>
                counts[s] ? <span key={s} className={`${STATUS_STYLES[s].dot} h-full`} style={{ width: `${(counts[s] / total) * 100}%` }} /> : null,
              )}
          </div>
          <ul className="mt-4 divide-y divide-line">
            {STATUSES.map((s) => (
              <li key={s}>
                <Link href={`/appointments?status=${s}`} className="group flex items-center gap-2.5 py-2.5 text-sm">
                  <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[s].dot}`} aria-hidden="true" />
                  <span className="flex-1 text-ink-soft capitalize group-hover:text-ink">{s}</span>
                  <span className="font-semibold tabular-nums">{counts[s] || 0}</span>
                  <span className="w-10 text-right text-xs text-muted tabular-nums">{total ? Math.round(((counts[s] || 0) / total) * 100) : 0}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <h2 className="font-semibold">Today’s appointments</h2>
            <Link href="/appointments?view=today" className="text-sm font-semibold text-brand-700 hover:underline">
              Open list
            </Link>
          </div>
          {stats.todayAppointments.items.length === 0 ? (
            <EmptyState icon="calendar" title="Nothing booked for today">
              {stats.nextAppointment ? (
                <>
                  Next appointment: <span className="font-medium text-ink">{stats.nextAppointment.fullName}</span> on{" "}
                  {formatDate(stats.nextAppointment.preferredDate)}
                  {stats.nextAppointment.time && ` at ${formatTime(stats.nextAppointment.time)}`}
                  {stats.nextAppointment.service?.title && ` · ${stats.nextAppointment.service.title}`}
                </>
              ) : (
                "Appointments show here on the day they are booked for."
              )}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {stats.todayAppointments.items.map((a) => (
                <li key={a._id} className="flex items-center gap-4 px-5 py-3.5 sm:px-6">
                  <span className={`w-14 shrink-0 text-sm font-semibold tabular-nums ${a.time ? "text-ink" : "text-muted"}`}>
                    {a.time ? formatTime(a.time) : "No time"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.fullName}</p>
                    <p className="truncate text-[0.8125rem] text-muted">
                      {a.service?.title || "—"}
                      {a.doctor ? ` · ${a.doctor.name}` : " · No doctor assigned"}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-semibold">Most requested, 30 days</h2>
          <div className="mt-5">
            <TopServices items={stats.topServices} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
            <h2 className="font-semibold">Latest requests</h2>
            <Link href="/appointments" className="text-sm font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          {stats.recent.length === 0 ? (
            <EmptyState title="No appointment requests yet">Requests from the website booking form will appear here.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recent.map((a) => (
                <li key={a._id}>
                  <Link
                    href={`/appointments?search=${encodeURIComponent(a.phone)}`}
                    className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-canvas/70 sm:px-6"
                  >
                    <Avatar name={a.fullName} size="h-9 w-9" text="text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.fullName}</p>
                      <p className="truncate text-[0.8125rem] text-muted">
                        {a.service?.title || "—"} · for {formatDate(a.preferredDate)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={a.status} />
                      <span className="text-xs text-muted">{formatRelative(a.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent activity</h2>
            <Link href="/activity" className="text-sm font-semibold text-brand-700 hover:underline">
              All
            </Link>
          </div>
          <div className="mt-5">
            {stats.activity.length ? (
              <ActivityList items={stats.activity} compact />
            ) : (
              <p className="text-sm text-muted">Changes made in the admin will be listed here.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
