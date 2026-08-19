"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import type { Ticker } from "@/types";

export default function TickerRow({
  ticker,
  onToggle,
  onTextChange,
  onDelete,
}: {
  ticker: Ticker;
  onToggle: (id: string, isActive: boolean) => void;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticker.id,
  });
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(ticker.text);

  function saveText() {
    setEditing(false);
    if (text.trim() && text !== ticker.text) {
      onTextChange(ticker.id, text.trim());
    } else {
      setText(ticker.text);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="card flex items-center gap-3 p-3"
    >
      <button className="cursor-grab touch-none" aria-label="Seret untuk mengurutkan" {...attributes} {...listeners}>
        <i className="ti ti-grip-vertical" style={{ color: "var(--text-muted)" }} />
      </button>

      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            className="input"
            value={text}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onBlur={saveText}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
        ) : (
          <div
            className="cursor-pointer truncate text-sm"
            style={{ color: "var(--text-primary)" }}
            onClick={() => setEditing(true)}
          >
            {ticker.text}
          </div>
        )}
      </div>

      <div
        className="toggle-wrap"
        onClick={() => onToggle(ticker.id, !ticker.isActive)}
        aria-label={ticker.isActive ? "Nonaktifkan ticker" : "Aktifkan ticker"}
      >
        <div className={`toggle ${ticker.isActive ? "on" : ""}`} />
      </div>

      <button className="btn btn-ghost btn-sm btn-icon-only" aria-label="Hapus ticker" onClick={() => onDelete(ticker.id)}>
        <i className="ti ti-trash" style={{ color: "var(--red-700)" }} />
      </button>
    </div>
  );
}
