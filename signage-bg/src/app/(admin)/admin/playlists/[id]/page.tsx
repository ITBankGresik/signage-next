"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import ContentPickerModal from "@/components/admin/ContentPickerModal";
import PlaylistItemRow, { type PlaylistItemWithContent } from "@/components/admin/PlaylistItemRow";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import type { Content } from "@/types";

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const [name, setName] = useState("");
  const [items, setItems] = useState<PlaylistItemWithContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const toast = useToast();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/playlists/${params.id}`);
    const json = await res.json();
    setName(json.name ?? "");
    setItems(json.items ?? []);
    setLoading(false);
  }

  async function handleNameSave() {
    setEditingName(false);
    await fetch(`/api/playlists/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  }

  async function handleAddContents(contents: Content[]) {
    for (const content of contents) {
      const res = await fetch(`/api/playlists/${params.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: content.id }),
      });
      if (res.ok) {
        const item = await res.json();
        setItems((prev) => [...prev, item]);
      }
    }
    toast.push("success", `${contents.length} konten ditambahkan`);
  }

  async function handleRemove(itemId: string) {
    await fetch(`/api/playlists/${params.id}/items/${itemId}`, { method: "DELETE" });
    setItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  async function handleDurationChange(itemId: string, duration: number) {
    const res = await fetch(`/api/playlists/${params.id}/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ durationOverride: duration }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((it) => (it.id === itemId ? updated : it)));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    await fetch(`/api/playlists/${params.id}/items`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: reordered.map((it, idx) => ({ id: it.id, order: idx })),
      }),
    });
  }

  const totalDuration = items.reduce((sum, it) => sum + (it.durationOverride ?? it.content.duration), 0);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        {editingName ? (
          <input
            className="input w-64 text-xl font-bold"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameSave}
            onKeyDown={(e) => e.key === "Enter" && handleNameSave()}
            autoFocus
          />
        ) : (
          <h1
            className="cursor-pointer text-2xl font-bold"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            onClick={() => setEditingName(true)}
          >
            {name}
          </h1>
        )}
        <button className="btn btn-primary" onClick={() => setPickerOpen(true)}>
          <i className="ti ti-plus" />
          Tambah Konten
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="ti-playlist-x"
          title="Playlist masih kosong"
          description="Tambahkan konten dari library untuk mulai menyusun playlist."
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setPickerOpen(true)}>
              <i className="ti ti-plus" />
              Tambah Konten
            </button>
          }
        />
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((it) => it.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item) => (
                  <PlaylistItemRow
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onDurationChange={handleDurationChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="card-footer mt-4 flex justify-end rounded-lg text-sm" style={{ color: "var(--text-secondary)" }}>
            Total durasi: {totalDuration} detik ({items.length} item)
          </div>
        </>
      )}

      <ContentPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleAddContents} />
    </div>
  );
}
