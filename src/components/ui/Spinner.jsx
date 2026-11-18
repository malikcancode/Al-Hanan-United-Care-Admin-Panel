export default function Spinner({ label = "Loading…", className = "py-16" }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-sm text-muted ${className}`} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
      {label}
    </div>
  );
}
