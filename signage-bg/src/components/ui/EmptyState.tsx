export default function EmptyState({
  icon = "ti-inbox",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--surface-1)" }}
      >
        <i className={`ti ${icon}`} style={{ fontSize: 22, color: "var(--text-muted)" }} />
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {title}
        </div>
        {description && (
          <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {description}
          </div>
        )}
      </div>
      {action}
    </div>
  );
}
