import Icon from "@/components/ui/Icon";

export default function EmptyState({ icon = "inbox", title, children, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas text-muted">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
