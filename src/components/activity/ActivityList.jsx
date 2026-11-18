import Icon from "@/components/ui/Icon";
import { formatDateTime, formatRelative } from "@/utils/format";

export const ENTITY_ICONS = {
  appointment: "calendar",
  service: "pulse",
  doctor: "user",
  message: "mail",
  settings: "settings",
  account: "lock",
};

export default function ActivityList({ items, compact = false }) {
  return (
    <ol className="relative">
      {items.map((a, i) => (
        <li key={a._id} className="relative flex gap-3.5 pb-5 last:pb-0">
          {i < items.length - 1 && <span className="absolute top-9 bottom-0 left-[17px] w-px bg-line" aria-hidden="true" />}
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-white text-muted">
            <Icon name={ENTITY_ICONS[a.entity] || "edit"} className="h-4 w-4" />
          </span>
          <div className="min-w-0 pt-1.5">
            <p className={`text-ink-soft ${compact ? "text-sm" : ""}`}>{a.summary}</p>
            <p className="mt-0.5 text-xs text-muted">
              {a.adminName || "Admin"} · <time dateTime={a.createdAt} title={formatDateTime(a.createdAt)}>{formatRelative(a.createdAt)}</time>
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
