"use client";

import { useEffect, useState } from "react";
import { getActivity } from "@/services/activityService";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import EmptyState from "@/components/ui/EmptyState";
import ActivityList from "@/components/activity/ActivityList";

const FILTERS = [
  { value: "", label: "Everything" },
  { value: "appointment", label: "Appointments" },
  { value: "message", label: "Messages" },
  { value: "service", label: "Services" },
  { value: "doctor", label: "Doctors" },
  { value: "settings", label: "Settings" },
  { value: "account", label: "Account" },
];

export default function ActivityPage() {
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getActivity({ entity, page, limit: 30 })
      .then((res) => !cancelled && (setResult(res), setError("")))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [entity, page]);

  const pagination = result?.pagination;

  return (
    <>
      <PageHeader title="Activity" description="Every change made in the admin, newest first. Kept for 180 days." />

      <div className="card overflow-hidden">
        <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-line p-3 [scrollbar-width:none] sm:p-4" role="tablist" aria-label="Filter activity">
          {FILTERS.map((f) => (
            <button
              key={f.value || "all"}
              type="button"
              role="tab"
              aria-selected={entity === f.value}
              onClick={() => {
                setLoading(true);
                setEntity(f.value);
                setPage(1);
              }}
              className={`h-9 shrink-0 rounded-lg px-3.5 text-sm font-medium transition-colors ${
                entity === f.value ? "bg-ink text-white" : "text-ink-soft hover:bg-canvas"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className={`p-5 transition-opacity sm:p-6 ${loading && result ? "opacity-60" : ""}`}>
          {!result ? (
            !error && <Spinner />
          ) : result.data.length === 0 ? (
            <EmptyState icon="history" title="No activity yet">
              Changes to appointments, services, doctors and settings will be listed here.
            </EmptyState>
          ) : (
            <ActivityList items={result.data} />
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm sm:px-5">
            <p className="text-muted">
              Page <span className="font-medium text-ink tabular-nums">{pagination.page}</span> of <span className="tabular-nums">{pagination.pages}</span>
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => (setLoading(true), setPage(page - 1))} aria-label="Previous page">
                <Icon name="chevronLeft" className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                disabled={page >= pagination.pages}
                onClick={() => (setLoading(true), setPage(page + 1))}
                aria-label="Next page"
              >
                <Icon name="chevronRight" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
