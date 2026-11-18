import Icon from "@/components/ui/Icon";

export default function VisibilityBadge({ visible }) {
  return visible ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 ring-inset">
      <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" /> Visible
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-muted ring-1 ring-line ring-inset">
      <Icon name="eyeOff" className="h-3 w-3" strokeWidth={2} /> Hidden
    </span>
  );
}
