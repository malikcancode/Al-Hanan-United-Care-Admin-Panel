export const STATUS_STYLES = {
  pending: { badge: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  confirmed: { badge: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500" },
  completed: { badge: "bg-brand-50 text-brand-700 ring-brand-200", dot: "bg-brand-500" },
  cancelled: { badge: "bg-stone-100 text-stone-600 ring-stone-200", dot: "bg-stone-400" },
};

export const STATUSES = Object.keys(STATUS_STYLES);

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.cancelled;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${s.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {status}
    </span>
  );
}
