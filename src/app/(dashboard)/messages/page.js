"use client";

import { useEffect, useState } from "react";
import { getMessages, updateMessage, deleteMessage } from "@/services/messageService";
import { useToast } from "@/context/ToastContext";
import PageHeader from "@/components/ui/PageHeader";
import Spinner from "@/components/ui/Spinner";
import Alert from "@/components/ui/Alert";
import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import MessageModal from "@/components/messages/MessageModal";
import MessageStatus, { MESSAGE_STATUSES, TOPIC_LABELS } from "@/components/messages/MessageStatus";
import { formatRelative } from "@/utils/format";

const TABS = [{ value: "", label: "All" }, ...MESSAGE_STATUSES.map((s) => ({ value: s, label: s }))];

const initialFilters = () => {
  const params = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const status = params.get("status");
  return { status: MESSAGE_STATUSES.includes(status) ? status : "", search: "", page: 1 };
};

export default function MessagesPage() {
  const toast = useToast();
  const [filters, setFilters] = useState(initialFilters);
  const [searchInput, setSearchInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const term = searchInput.trim();
    if (term === filters.search) return;
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: term, page: 1 })), 350);
    return () => clearTimeout(t);
  }, [searchInput, filters.search]);

  useEffect(() => {
    let cancelled = false;
    getMessages({ ...filters, limit: 15 })
      .then((res) => {
        if (cancelled) return;
        setResult(res);
        setError("");
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, version]);

  const setFilter = (patch) => {
    setLoading(true);
    setFilters((f) => ({ ...f, ...patch }));
  };

  const replaceRow = (updated) =>
    setResult((r) => ({ ...r, data: r.data.map((m) => (m._id === updated._id ? updated : m)) }));

  // Opening a new message marks it as read.
  const open = async (m) => {
    setSelected(m);
    if (m.status !== "new") return;
    try {
      const { data } = await updateMessage(m._id, { status: "read" });
      replaceRow(data);
      setSelected((s) => (s?._id === data._id ? data : s));
      setResult((r) => ({ ...r, unread: Math.max((r.unread || 1) - 1, 0) }));
    } catch {
      /* the message still opens; status stays "new" */
    }
  };

  const handleSaved = (updated, text) => {
    replaceRow(updated);
    setSelected(null);
    toast(text);
  };

  const handleDelete = async () => {
    try {
      await deleteMessage(toDelete._id);
      toast("Message deleted");
      setToDelete(null);
      setSelected(null);
      setVersion((v) => v + 1);
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const rows = result?.data || [];
  const pagination = result?.pagination;
  const filtered = filters.status || filters.search;

  return (
    <>
      <PageHeader
        title="Messages"
        description={
          result?.unread
            ? `${result.unread} unread ${result.unread === 1 ? "message" : "messages"} from the website contact form.`
            : "Questions sent through the website contact form."
        }
      />

      <div className="card overflow-hidden">
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
                  onClick={() => setFilter({ status: tab.value, page: 1 })}
                  className={`flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-medium capitalize transition-colors ${
                    active ? "bg-ink text-white" : "text-ink-soft hover:bg-canvas"
                  }`}
                >
                  {tab.label}
                  {tab.value === "new" && result?.unread > 0 && (
                    <span className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-white/20" : "bg-brand-600 text-white"}`}>
                      {result.unread}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="relative lg:w-72">
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Search messages"
              aria-label="Search messages"
              className="field-input pl-10"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setLoading(true);
              }}
            />
          </div>
        </div>

        {error && (
          <div className="p-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <div className={`transition-opacity ${loading && result ? "opacity-60" : ""}`} aria-busy={loading}>
          {!result ? (
            !error && <Spinner />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={filtered ? "search" : "inbox"}
              title={filtered ? "No matching messages" : "No messages yet"}
              action={
                filtered && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSearchInput("");
                      setFilter({ status: "", search: "", page: 1 });
                    }}
                  >
                    Clear filters
                  </button>
                )
              }
            >
              {filtered ? "Try a different search or status." : "Messages from the website contact page will appear here."}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((m) => {
                const unread = m.status === "new";
                return (
                  <li key={m._id}>
                    <button
                      type="button"
                      onClick={() => open(m)}
                      className={`flex w-full items-start gap-3.5 px-4 py-4 text-left transition-colors hover:bg-canvas/70 sm:px-5 ${
                        unread ? "bg-brand-50/50" : ""
                      }`}
                    >
                      <span className="relative">
                        <Avatar name={m.fullName} size="h-10 w-10" text="text-xs" />
                        {unread && (
                          <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-600" aria-hidden="true" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className={`truncate ${unread ? "font-semibold text-ink" : "font-medium text-ink-soft"}`}>
                            {m.fullName}
                            {unread && <span className="sr-only"> (unread)</span>}
                          </span>
                          <span className="shrink-0 text-xs text-muted">{formatRelative(m.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 flex items-center gap-2 text-[0.8125rem] text-muted">
                          <span className="truncate">{TOPIC_LABELS[m.topic] || "General question"}</span>
                          <span aria-hidden="true">·</span>
                          <span className="shrink-0 tabular-nums">{m.phone}</span>
                        </span>
                        <span className={`mt-1 line-clamp-2 text-sm sm:line-clamp-1 ${unread ? "text-ink-soft" : "text-muted"}`}>{m.message}</span>
                      </span>
                      <span className="hidden shrink-0 self-center sm:block">
                        <MessageStatus status={m.status} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm sm:px-5">
            <p className="text-muted">
              Page <span className="font-medium text-ink tabular-nums">{pagination.page}</span> of{" "}
              <span className="tabular-nums">{pagination.pages}</span>
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary btn-sm" disabled={pagination.page <= 1} onClick={() => setFilter({ page: filters.page - 1 })} aria-label="Previous page">
                <Icon name="chevronLeft" className="h-4 w-4" />
              </button>
              <button type="button" className="btn-secondary btn-sm" disabled={pagination.page >= pagination.pages} onClick={() => setFilter({ page: filters.page + 1 })} aria-label="Next page">
                <Icon name="chevronRight" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <MessageModal
          key={selected._id + selected.status}
          message={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
          onDelete={() => setToDelete(selected)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this message?"
        message={toDelete && `The message from ${toDelete.fullName} will be permanently removed.`}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
