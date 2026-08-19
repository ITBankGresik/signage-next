"use client";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "480px",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,11,0.5)" }}
      onClick={onClose}
    >
      <div
        className="card w-full"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header">
          <span className="card-header-title">{title}</span>
          <button className="btn btn-ghost btn-sm btn-icon-only" aria-label="Tutup" onClick={onClose}>
            <i className="ti ti-x" />
          </button>
        </div>
        <div className="card-body">{children}</div>
        {footer && <div className="card-footer flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
