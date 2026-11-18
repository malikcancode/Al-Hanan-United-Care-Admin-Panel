export const MESSAGE_STATUSES = ["new", "read", "replied"];

export const TOPIC_LABELS = {
  general: "General question",
  appointment: "Existing appointment",
  prescription: "Prescription or refill",
  reports: "Lab results or reports",
  other: "Something else",
};

const STYLES = {
  new: "bg-brand-600 text-white ring-brand-600",
  read: "bg-canvas text-muted ring-line",
  replied: "bg-brand-50 text-brand-700 ring-brand-100",
};

export default function MessageStatus({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset ${STYLES[status] || STYLES.read}`}>
      {status}
    </span>
  );
}
