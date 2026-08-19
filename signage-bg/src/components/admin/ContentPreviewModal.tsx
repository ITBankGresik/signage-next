"use client";

import Modal from "@/components/ui/Modal";
import type { Content } from "@/types";

export default function ContentPreviewModal({
  content,
  onClose,
}: {
  content: Content | null;
  onClose: () => void;
}) {
  return (
    <Modal open={!!content} onClose={onClose} title={content?.name ?? ""} maxWidth="640px">
      {content && (
        <div>
          <div
            className="mb-4 flex items-center justify-center overflow-hidden rounded-lg"
            style={{ background: "var(--neutral-900)", maxHeight: 400 }}
          >
            {content.type === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={content.filePath} alt={content.name} className="max-h-[400px] w-full object-contain" />
            ) : (
              <video src={content.filePath} controls className="max-h-[400px] w-full" />
            )}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Tipe</dt>
              <dd style={{ color: "var(--text-primary)" }}>{content.type}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Kategori</dt>
              <dd style={{ color: "var(--text-primary)" }}>{content.category}</dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Ukuran</dt>
              <dd style={{ color: "var(--text-primary)" }}>
                {(content.sizeBytes / 1024 / 1024).toFixed(2)} MB
              </dd>
            </div>
            <div>
              <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Diunggah</dt>
              <dd style={{ color: "var(--text-primary)" }}>
                {new Date(content.createdAt).toLocaleString("id-ID")}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Modal>
  );
}
