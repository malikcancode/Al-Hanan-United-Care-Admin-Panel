export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// "5 min ago", "3 h ago", "2 days ago", then a plain date.
export const formatRelative = (value) => {
  if (!value) return "—";
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  if (diff < 86400 * 7) {
    const d = Math.floor(diff / 86400);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }
  return formatDate(value);
};

// "14:30" -> "2:30 PM" in the viewer's locale
export const formatTime = (hhmm) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(2000, 0, 1, h, m)).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
};

// Date value -> "YYYY-MM-DD" for <input type="date">
export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

export const whatsappHref = (phone = "") => `https://wa.me/${phone.replace(/\D/g, "")}`;
export const telHref = (phone = "") => `tel:${phone.replace(/[^\d+]/g, "")}`;
