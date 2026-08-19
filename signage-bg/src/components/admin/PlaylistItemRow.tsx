"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Content } from "@/types";

export type PlaylistItemWithContent = {
  id: string;
  order: number;
  durationOverride: number | null;
  content: Content;
};

export default function PlaylistItemRow({
  item,
  onRemove,
  onDurationChange,
}: {
  item: PlaylistItemWithContent;
  onRemove: (id: string) => void;
  onDurationChange: (id: string, duration: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [editingDuration, setEditingDuration] = useState(false);
  const duration = item.durationOverride ?? item.content.duration;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="card flex items-center gap-3 p-3"
    >
      <button
        className="cursor-grab touch-none"
        aria-label="Seret untuk mengurutkan"
        {...attributes}
        {...listeners}
      >
        <i className="ti ti-grip-vertical" style={{ color: "var(--text-muted)" }} />
      </button>

      <div
        className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md"
        style={{ background: "var(--neutral-900)" }}
      >
        {item.content.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.content.filePath} alt="" className="h-full w-full object-cover" />
        ) : (
          <i className="ti ti-video" style={{ color: "var(--neutral-500)" }} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          {item.content.name}
        </div>
      </div>

      {editingDuration ? (
        <input
          type="number"
          min={1}
          className="input w-20"
          defaultValue={duration}
          autoFocus
          onBlur={(e) => {
            onDurationChange(item.id, Number(e.target.value));
            setEditingDuration(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      ) : (
        <button
          className="badge badge-gray"
          onClick={() => setEditingDuration(true)}
          aria-label="Edit durasi"
        >
          {duration}s
        </button>
      )}

      <button
        className="btn btn-ghost btn-sm btn-icon-only"
        aria-label="Hapus dari playlist"
        onClick={() => onRemove(item.id)}
      >
        <i className="ti ti-trash" style={{ color: "var(--red-700)" }} />
      </button>
    </div>
  );
}
