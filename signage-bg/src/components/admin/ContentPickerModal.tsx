"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Content } from "@/types";

export default function ContentPickerModal({
  open,
  onClose,
  onSelect,
  filterType,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (contents: Content[]) => void;
  filterType?: "IMAGE" | "VIDEO";
}) {
  const [contents, setContents] = useState<Content[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (filterType) params.set("type", filterType);
    const res = await fetch(`/api/contents?${params.toString()}`);
    const json = await res.json();
    setContents(json.data ?? []);
    setLoading(false);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleConfirm() {
    onSelect(contents.filter((c) => selected.has(c.id)));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pilih Konten"
      maxWidth="600px"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={selected.size === 0}>
            Tambahkan ({selected.size})
          </button>
        </>
      }
    >
      <input
        className="input mb-4"
        placeholder="Cari konten..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Memuat...</p>
      ) : (
        <div className="grid max-h-96 grid-cols-4 gap-2 overflow-y-auto">
          {contents.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle(c.id)}
              className="relative overflow-hidden rounded-md border-2"
              style={{
                aspectRatio: "1",
                borderColor: selected.has(c.id) ? "var(--blue-500)" : "transparent",
                background: "var(--neutral-900)",
              }}
            >
              {c.type === "IMAGE" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.filePath} alt={c.name} className="h-full w-full object-cover" />
              ) : (
                <>
                  <video
                    src={`${c.filePath}#t=0.5`}
                    muted
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <div
                    className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ background: "rgba(0,0,0,0.6)" }}
                  >
                    <i className="ti ti-player-play-filled" style={{ color: "white", fontSize: 10 }} />
                  </div>
                </>
              )}
              {selected.has(c.id) && (
                <div
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ background: "var(--blue-600)" }}
                >
                  <i className="ti ti-check" style={{ color: "white", fontSize: 12 }} />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
