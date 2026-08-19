"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import TickerRow from "@/components/admin/TickerRow";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { Ticker } from "@/types";

export default function TickersPage() {
  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const toast = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tickers");
    const json = await res.json();
    setTickers(json.data ?? []);
    setLoading(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newText.trim()) return;
    setAdding(true);
    const res = await fetch("/api/tickers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText.trim(), order: tickers.length }),
    });
    setAdding(false);
    if (res.ok) {
      const created = await res.json();
      setTickers((prev) => [...prev, created]);
      setNewText("");
      toast.push("success", "Ticker ditambahkan");
    } else {
      toast.push("danger", "Gagal menambahkan ticker");
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setTickers((prev) => prev.map((t) => (t.id === id ? { ...t, isActive } : t)));
    await fetch(`/api/tickers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
  }

  async function handleTextChange(id: string, text: string) {
    setTickers((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
    await fetch(`/api/tickers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  }

  async function handleDelete(id: string) {
    setTickers((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tickers/${id}`, { method: "DELETE" });
    toast.push("success", "Ticker dihapus");
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tickers.findIndex((t) => t.id === active.id);
    const newIndex = tickers.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(tickers, oldIndex, newIndex);
    setTickers(reordered);

    await Promise.all(
      reordered.map((t, idx) =>
        fetch(`/api/tickers/${t.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: idx }),
        })
      )
    );
  }

  const activeTickers = tickers.filter((t) => t.isActive);
  const previewText = activeTickers.map((t) => t.text).join("   ·   ");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Ticker
        </h1>
      </div>

      <form onSubmit={handleAdd} className="mb-5 flex gap-2">
        <input
          className="input flex-1"
          placeholder="Teks ticker baru..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={adding}>
          <i className="ti ti-plus" />
          Tambah
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : tickers.length === 0 ? (
        <EmptyState icon="ti-align-left" title="Belum ada ticker" description="Tambahkan teks ticker pertama di atas." />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tickers.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tickers.map((ticker) => (
                <TickerRow
                  key={ticker.id}
                  ticker={ticker}
                  onToggle={handleToggle}
                  onTextChange={handleTextChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="mt-6">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
          Preview Live
        </div>
        <div className="player-ticker" style={{ borderRadius: "var(--radius-md)" }}>
          <div className="player-ticker-label">INFO</div>
          <div className="player-ticker-viewport">
            {previewText ? (
              <div className="player-ticker-text" style={{ animationDuration: "22s" }}>
                <span>{previewText}</span>
                <span>{previewText}</span>
              </div>
            ) : (
              <span style={{ padding: "0 16px", color: "#64748B", fontSize: 12 }}>Tidak ada ticker aktif</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
