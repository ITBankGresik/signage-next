"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type PlaylistSummary = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  updatedAt: string;
};

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<PlaylistSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/playlists");
    const json = await res.json();
    setPlaylists(json.data ?? []);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    setSaving(false);
    if (res.ok) {
      setModalOpen(false);
      setName("");
      setDescription("");
      toast.push("success", "Playlist dibuat");
      void load();
    } else {
      toast.push("danger", "Gagal membuat playlist");
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Playlist
        </h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <i className="ti ti-plus" />
          Playlist Baru
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : playlists.length === 0 ? (
        <EmptyState
          icon="ti-playlist"
          title="Belum ada playlist"
          description="Buat playlist pertama untuk mulai menyusun urutan konten."
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
              <i className="ti ti-plus" />
              Playlist Baru
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2">
          {playlists.map((p) => (
            <Link key={p.id} href={`/admin/playlists/${p.id}`} className="card">
              <div className="card-body">
                <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {p.name}
                </div>
                {p.description && (
                  <div className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    {p.description}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-2">
                  <span className="badge badge-blue">{p.itemCount} item</span>
                </div>
              </div>
              <div className="card-footer text-xs" style={{ color: "var(--text-muted)" }}>
                Diubah {new Date(p.updatedAt).toLocaleDateString("id-ID")}
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Playlist Baru"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Batal
            </button>
            <button type="submit" form="playlist-create-form" className="btn btn-primary" disabled={saving}>
              {saving ? "Menyimpan..." : "Buat"}
            </button>
          </>
        }
      >
        <form id="playlist-create-form" onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label" htmlFor="playlist-name">Nama</label>
            <input
              id="playlist-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="playlist-desc">Deskripsi (opsional)</label>
            <textarea
              id="playlist-desc"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
