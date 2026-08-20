"use client";

import { useState } from "react";
import type { Content } from "@/types";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ContentCard({
  content,
  onEdit,
  onPreview,
  onDelete,
}: {
  content: Content;
  onEdit: (content: Content) => void;
  onPreview: (content: Content) => void;
  onDelete: (content: Content) => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="card overflow-hidden"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className="relative cursor-pointer"
        style={{ aspectRatio: "16/9", background: "var(--neutral-900)" }}
        onClick={() => onPreview(content)}
      >
        {content.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={content.filePath}
            alt={content.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <video
              src={`${content.filePath}#t=0.5`}
              muted
              preload="metadata"
              className="h-full w-full object-cover"
            />
            <div
              className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <i className="ti ti-player-play-filled" style={{ color: "white", fontSize: 12 }} />
            </div>
          </>
        )}

        {hover && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50">
            <button
              className="btn btn-secondary btn-sm btn-icon-only"
              aria-label="Preview"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(content);
              }}
            >
              <i className="ti ti-eye" />
            </button>
            <button
              className="btn btn-secondary btn-sm btn-icon-only"
              aria-label="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(content);
              }}
            >
              <i className="ti ti-edit" />
            </button>
            <button
              className="btn btn-danger btn-sm btn-icon-only"
              aria-label="Hapus"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(content);
              }}
            >
              <i className="ti ti-trash" />
            </button>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {content.name}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`badge ${content.type === "IMAGE" ? "badge-blue" : "badge-purple"}`}>
            {content.type === "IMAGE" ? "Gambar" : "Video"}
          </span>
          <span className="badge badge-gray">{formatSize(content.sizeBytes)}</span>
          <span className="badge badge-gray">{content.duration}s</span>
        </div>
      </div>
    </div>
  );
}
