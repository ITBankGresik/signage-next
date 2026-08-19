"use client";

import { useCallback, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"];

export default function FileDropzone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const files = Array.from(fileList).filter((f) => ACCEPTED_TYPES.includes(f.type));
      if (files.length > 0) onFiles(files);
    },
    [onFiles]
  );

  return (
    <div
      className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-12 text-center"
      style={{
        borderColor: dragActive ? "var(--blue-500)" : "var(--border-strong)",
        background: dragActive ? "var(--blue-50)" : "var(--surface-2)",
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <i className="ti ti-cloud-upload" style={{ fontSize: 32, color: "var(--blue-600)" }} />
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Klik atau seret file ke sini
        </div>
        <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          JPG, PNG, WebP, MP4, WebM — maks 100 MB per file
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
