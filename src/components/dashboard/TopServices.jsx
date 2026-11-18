import EmptyState from "@/components/ui/EmptyState";

// Horizontal bars, one hue; the label and number are text, the bar carries magnitude.
export default function TopServices({ items }) {
  if (!items.length) {
    return <EmptyState icon="pulse" title="No requests in the last 30 days" />;
  }
  const max = Math.max(...items.map((s) => s.count));

  return (
    <ol className="space-y-4">
      {items.map((s, i) => (
        <li key={s.id || s.title}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink-soft">{s.title}</span>
            <span className="shrink-0 font-semibold tabular-nums">{s.count}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-canvas" aria-hidden="true">
            <div
              className="animate-grow-right h-full rounded-full bg-chart"
              style={{ width: `${(s.count / max) * 100}%`, animationDelay: `${150 + i * 80}ms` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
