"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAppointments,
  deleteAppointment,
  bulkUpdateAppointments,
  exportAppointments,
} from "@/services/appointmentService";
import { getServices } from "@/services/serviceService";
import { getDoctors } from "@/services/doctorService";
import { useToast } from "@/context/ToastContext";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge, { STATUSES } from "@/components/ui/StatusBadge";
import AppointmentModal, { SOURCE_LABELS } from "@/components/appointments/AppointmentModal";
import NewAppointmentModal from "@/components/appointments/NewAppointmentModal";
import { formatDate, formatRelative, formatTime, whatsappHref } from "@/utils/format";

const TABS = [{ value: "", label: "All" }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const VIEWS = [
  { value: "", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "range", label: "Date range…" },
];
const SORTS = [
  { value: "newest", label: "Newest requests" },
  { value: "oldest", label: "Oldest requests" },
  { value: "date_asc", label: "Appointment date ↑" },
  { value: "date_desc", label: "Appointment date ↓" },
];
const URL_KEYS = ["status", "search", "view", "service", "doctor", "sort", "from", "to"];
const EMPTY_FILTERS = { status: "", search: "", view: "", service: "", doctor: "", sort: "newest", from: "", to: "", page: 1 };

// The page only mounts in the browser (the layout waits for auth), so reading the URL here is safe.
const readUrl = () => {
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const f = { ...EMPTY_FILTERS };
  for (const k of URL_KEYS) if (params.get(k)) f[k] = params.get(k);
  if (!STATUSES.includes(f.status)) f.status = "";
  if (f.from || f.to) f.view = "range";
  return f;
};

const toQuery = (f) => {
  const { view, ...rest } = f;
  return { ...rest, view: view === "range" ? "" : view, from: view === "range" ? f.from : "", to: view === "range" ? f.to : "" };
};

export default function AppointmentsPage() {
  const toast = useToast();
  const [filters, setFilters] = useState(readUrl);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [services, setServices] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("new"));
  const [toDelete, setToDelete] = useState(null);
  const [checked, setChecked] = useState([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [version, setVersion] = useState(0);
  const reload = () => {
    setLoading(true);
    setVersion((v) => v + 1);
  };

  // Lookup lists for the filters and forms
  useEffect(() => {
    getServices().then(({ data }) => setServices(data)).catch(() => {});
    getDoctors().then(({ data }) => setDoctors(data)).catch(() => {});
  }, []);

  // Keep the URL in sync so filters survive a refresh and can be shared.
  useEffect(() => {
    const params = new URLSearchParams();
    const q = toQuery(filters);
    for (const k of URL_KEYS) if (q[k] && !(k === "sort" && q[k] === "newest")) params.set(k, q[k]);
    if (filters.view && filters.view !== "range") params.set("view", filters.view);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters]);

  // Search as you type, with a short delay.
  useEffect(() => {
    const term = searchInput.trim();
    if (term === filters.search) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: term, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchInput, filters.search]);

  useEffect(() => {
    if (filters.view === "range" && !filters.from && !filters.to) return; // wait for a date
    let cancelled = false;
    getAppointments({ ...toQuery(filters), limit: 15 })
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setError("");
        setChecked((c) => c.filter((id) => res.data.some((a) => a._id === id)));
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, version]);

  const setFilter = (patch) => {
    setLoading(true);
    setFilters((f) => ({ ...f, page: 1, ...patch }));
  };

  const clearFilters = () => {
    setSearchInput("");
    setFilter({ ...EMPTY_FILTERS });
  };

  const handleDelete = async () => {
    try {
      await deleteAppointment(toDelete._id);
      toast("Appointment deleted");
      setToDelete(null);
      setSelected(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleSaved = (updated) => {
    setSelected(null);
    toast("Appointment updated");
    reload();
    setResult((r) => ({ ...r, data: r.data.map((a) => (a._id === updated._id ? updated : a)) }));
  };

  const handleBulk = async (status) => {
    setBulkBusy(true);
    try {
      const { data } = await bulkUpdateAppointments(checked, status);
      toast(`${data.updated} appointment${data.updated === 1 ? "" : "s"} marked ${status}`);
      setChecked([]);
      reload();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportAppointments(toQuery(filters));
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const rows = useMemo(() => result?.data || [], [result]);
  const pagination = result?.pagination;
  const filtered = filters.status || filters.search || filters.view || filters.service || filters.doctor;
  const allChecked = rows.length > 0 && rows.every((a) => checked.includes(a._id));
  const toggle = (id) => setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const toggleAll = () => setChecked(allChecked ? [] : rows.map((a) => a._id));

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Confirm requests, assign doctors and keep every booking in one list."
        action={
          <>
            <button type="button" className="btn-secondary" onClick={handleExport} disabled={exporting || !pagination?.total}>
              <Icon name="download" className="h-4 w-4" /> {exporting ? "Exporting…" : "Export CSV"}
            </button>
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
              <Icon name="plus" className="h-4 w-4" strokeWidth={2.25} /> New
            </button>
          </>
        }
      />

      <div className="card overflow-hidden">
        {/* Status tabs + search */}
        <div className="flex flex-col gap-3 border-b border-line p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]" role="tablist" aria-label="Filter by status">
            {TABS.map((tab) => {
              const active = filters.status === tab.value;
              return (
                <button
                  key={tab.value || "all"}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter({ status: tab.value })}
                  className={`h-9 shrink-0 rounded-lg px-3.5 text-sm font-medium capitalize transition-colors ${
                    active ? "bg-ink text-white" : "text-ink-soft hover:bg-canvas"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="relative lg:w-72">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Search name or phone"
              aria-label="Search appointments by name or phone"
              className="field-input pl-10"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setLoading(true);
              }}
            />
          </div>
        </div>

        {/* Secondary filters */}
        <div className="grid grid-cols-2 gap-2 border-b border-line bg-canvas/50 p-3 sm:p-4 md:flex md:flex-wrap md:items-center">
          <select
            aria-label="Appointment date"
            className="field-input md:w-40"
            value={filters.view}
            onChange={(e) => setFilter({ view: e.target.value, ...(e.target.value !== "range" && { from: "", to: "" }) })}
          >
            {VIEWS.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
          {filters.view === "range" && (
            <div className="col-span-2 flex items-center gap-2 md:col-span-1">
              <input type="date" aria-label="From date" className="field-input md:w-40" value={filters.from} onChange={(e) => setFilter({ from: e.target.value })} />
              <span className="text-sm text-muted">to</span>
              <input type="date" aria-label="To date" className="field-input md:w-40" value={filters.to} min={filters.from || undefined} onChange={(e) => setFilter({ to: e.target.value })} />
            </div>
          )}
          <select aria-label="Service" className="field-input md:w-48" value={filters.service} onChange={(e) => setFilter({ service: e.target.value })}>
            <option value="">All services</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.title}
              </option>
            ))}
          </select>
          <select aria-label="Doctor" className="field-input md:w-44" value={filters.doctor} onChange={(e) => setFilter({ doctor: e.target.value })}>
            <option value="">All doctors</option>
            <option value="none">Not assigned</option>
            {doctors.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <select aria-label="Sort" className="field-input md:ml-auto md:w-52" value={filters.sort} onChange={(e) => setFilter({ sort: e.target.value })}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk actions */}
        {checked.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-50 px-4 py-2.5 sm:px-5">
            <p className="mr-auto text-sm font-medium text-brand-900">{checked.length} selected</p>
            {["confirmed", "completed", "cancelled"].map((s) => (
              <button key={s} type="button" className="btn-secondary btn-sm capitalize" disabled={bulkBusy} onClick={() => handleBulk(s)}>
                Mark {s}
              </button>
            ))}
            <button type="button" className="btn-ghost btn-sm" onClick={() => setChecked([])}>
              Clear
            </button>
          </div>
        )}

        {error && (
          <div className="p-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className={`transition-opacity ${loading && result ? "opacity-60" : ""}`} aria-busy={loading}>
          {filters.view === "range" && !filters.from && !filters.to ? (
            <EmptyState icon="calendar" title="Choose a date range">Pick a start date, an end date, or both.</EmptyState>
          ) : !result ? (
            !error && <Spinner />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={filtered ? "search" : "inbox"}
              title={filtered ? "No matching appointments" : "No appointments yet"}
              action={
                filtered ? (
                  <button type="button" className="btn-secondary" onClick={clearFilters}>
                    Clear filters
                  </button>
                ) : (
                  <button type="button" className="btn-primary" onClick={() => setCreating(true)}>
                    Add an appointment
                  </button>
                )
              }
            >
              {filtered ? "Try a different search, date or filter." : "Website requests and bookings you add will appear here."}
            </EmptyState>
          ) : (
            <>
              {/* Desktop table */}
              <table className="hidden w-full text-left text-sm md:table">
                <thead className="border-b border-line bg-canvas/70 text-[0.8125rem] text-muted">
                  <tr>
                    <th className="w-10 py-2.5 pr-0 pl-5">
                      <input type="checkbox" className="h-4 w-4 accent-brand-600" checked={allChecked} onChange={toggleAll} aria-label="Select all on this page" />
                    </th>
                    <th className="px-4 py-2.5 font-medium">Patient</th>
                    <th className="px-4 py-2.5 font-medium">Service &amp; doctor</th>
                    <th className="px-4 py-2.5 font-medium">Appointment</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((a) => (
                    <tr
                      key={a._id}
                      className={`group cursor-pointer transition-colors hover:bg-canvas/60 ${checked.includes(a._id) ? "bg-brand-50/60" : ""}`}
                      onClick={() => setSelected(a)}
                    >
                      <td className="py-3 pr-0 pl-5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-brand-600"
                          checked={checked.includes(a._id)}
                          onChange={() => toggle(a._id)}
                          aria-label={`Select ${a.fullName}`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={a.fullName} size="h-9 w-9" text="text-xs" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{a.fullName}</p>
                            <p className="text-[0.8125rem] text-muted tabular-nums">{a.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-56 px-4 py-3">
                        <p className="truncate text-ink-soft">{a.service?.title || "—"}</p>
                        <p className={`truncate text-[0.8125rem] ${a.doctor ? "text-muted" : "text-amber-700"}`}>
                          {a.doctor?.name || "No doctor assigned"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-ink-soft tabular-nums">
                          {formatDate(a.preferredDate)}
                          {a.time && <span className="text-muted"> · {formatTime(a.time)}</span>}
                        </p>
                        <p className="text-xs text-muted">
                          {SOURCE_LABELS[a.source] || "Website"} · {formatRelative(a.createdAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={whatsappHref(a.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="icon-btn hover:text-brand-700"
                            aria-label={`WhatsApp ${a.fullName}`}
                            title="WhatsApp"
                          >
                            <Icon name="message" className="h-[1.125rem] w-[1.125rem]" />
                          </a>
                          <button type="button" onClick={() => setSelected(a)} className="btn-secondary btn-sm">
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile list */}
              <ul className="divide-y divide-line md:hidden">
                {rows.map((a) => (
                  <li key={a._id} className={`flex items-start gap-3 px-4 py-4 ${checked.includes(a._id) ? "bg-brand-50/60" : ""}`}>
                    <input
                      type="checkbox"
                      className="mt-3 h-4 w-4 shrink-0 accent-brand-600"
                      checked={checked.includes(a._id)}
                      onChange={() => toggle(a._id)}
                      aria-label={`Select ${a.fullName}`}
                    />
                    <button type="button" onClick={() => setSelected(a)} className="min-w-0 flex-1 text-left">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate font-medium">{a.fullName}</span>
                        <StatusBadge status={a.status} />
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-ink-soft">
                        {a.service?.title || "—"}
                        {a.doctor && <span className="text-muted"> · {a.doctor.name}</span>}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] text-muted tabular-nums">
                        {formatDate(a.preferredDate)}
                        {a.time && ` · ${formatTime(a.time)}`} · {a.phone}
                      </span>
                    </button>
                    <a
                      href={whatsappHref(a.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-btn h-10 w-10 border border-line text-brand-700"
                      aria-label={`WhatsApp ${a.fullName}`}
                    >
                      <Icon name="message" className="h-5 w-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {pagination && pagination.total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm sm:px-5">
            <p className="text-muted">
              <span className="hidden sm:inline">
                Page <span className="font-medium text-ink tabular-nums">{pagination.page}</span> of <span className="tabular-nums">{pagination.pages}</span> ·{" "}
              </span>
              <span className="tabular-nums">{pagination.total}</span> {pagination.total === 1 ? "appointment" : "appointments"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => setFilter({ page: filters.page - 1 })}
                aria-label="Previous page"
              >
                <Icon name="chevronLeft" className="h-4 w-4" /> <span className="hidden sm:inline">Previous</span>
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setFilter({ page: filters.page + 1 })}
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span> <Icon name="chevronRight" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <AppointmentModal
          key={selected._id}
          appointment={selected}
          doctors={doctors.filter((d) => d.isActive)}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
          onDelete={() => setToDelete(selected)}
        />
      )}

      {creating && (
        <NewAppointmentModal
          services={services}
          doctors={doctors.filter((d) => d.isActive)}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            toast("Appointment added");
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this appointment?"
        message={toDelete && `The appointment for ${toDelete.fullName} will be permanently removed.`}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
