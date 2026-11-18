import Icon from "@/components/ui/Icon";

const STYLES = {
  error: "border-red-200 bg-danger-bg text-danger",
  success: "border-brand-200 bg-brand-50 text-brand-700",
};

export default function Alert({ type = "error", children }) {
  if (!children) return null;
  return (
    <p
      role={type === "error" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm ${STYLES[type]}`}
    >
      <Icon name={type === "error" ? "alert" : "check"} className="mt-px h-4 w-4" strokeWidth={2} />
      <span>{children}</span>
    </p>
  );
}
