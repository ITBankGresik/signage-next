"use client";

import Modal from "@/components/ui/Modal";

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Hapus",
  danger = true,
  onConfirm,
  onCancel,
  loading = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      maxWidth="380px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Batal
          </button>
          <button
            type="button"
            className={danger ? "btn btn-danger" : "btn btn-primary"}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Memproses..." : confirmLabel}
          </button>
        </>
      }
    >
      {description && (
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      )}
    </Modal>
  );
}
