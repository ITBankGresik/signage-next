"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ScreenFormModal from "@/components/admin/ScreenFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import type { Screen, ScreenStatus, Layout } from "@/types";

type ScreenWithLayout = Screen & { layout: Layout };
type Filter = "ALL" | ScreenStatus;

function statusBadge(status: ScreenStatus) {
  const map: Record<ScreenStatus, string> = {
    ONLINE: "badge-green",
    IDLE: "badge-amber",
    OFFLINE: "badge-red",
  };
  const label: Record<ScreenStatus, string> = { ONLINE: "Online", IDLE: "Idle", OFFLINE: "Offline" };
  return (
    <span className={`badge ${map[status]}`} style={{ fontSize: 10 }}>
      <span className="badge-dot" />
      {label[status]}
    </span>
  );
}

export default function ScreensPage() {
  const [screens, setScreens] = useState<ScreenWithLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ScreenWithLayout | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    void load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const res = await fetch("/api/screens");
    const json = await res.json();
    setScreens(json.data ?? []);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/screens/${deleting.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    if (res.ok) {
      setScreens((prev) => prev.filter((s) => s.id !== deleting.id));
      toast.push("success", "Layar dihapus");
      setDeleting(null);
    } else {
      const json = await res.json();
      toast.push("danger", json.error ?? "Gagal menghapus layar");
    }
  }

  const filterButtons: { key: Filter; label: string }[] = useMemo(
    () => [
      { key: "ALL", label: "Semua" },
      { key: "ONLINE", label: "Online" },
      { key: "IDLE", label: "Idle" },
      { key: "OFFLINE", label: "Offline" },
    ],
    []
  );

  const filtered = filter === "ALL" ? screens : screens.filter((s) => s.status === filter);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Layar
        </h1>
        <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
          <i className="ti ti-plus" />
          Daftarkan Layar
        </button>
      </div>

      <div className="mb-5 flex gap-2">
        {filterButtons.map((f) => (
          <button
            key={f.key}
            className={filter === f.key ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="ti-device-tv-off"
          title="Belum ada layar"
          description="Daftarkan layar pertama untuk mulai menampilkan konten."
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setFormOpen(true)}>
              <i className="ti ti-plus" />
              Daftarkan Layar
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((screen) => (
            <div key={screen.id} className="screen-card">
              <Link href={`/admin/screens/${screen.id}`}>
                <div className="screen-thumb">
                  <div className="screen-thumb-body">
                    {screen.status === "OFFLINE" ? (
                      <div className="flex flex-col items-center gap-2">
                        <i className="ti ti-device-tv-off" style={{ fontSize: 28, opacity: 0.25 }} />
                        <span style={{ fontSize: 10, opacity: 0.4 }}>Tidak merespons</span>
                      </div>
                    ) : (
                      <i className="ti ti-device-tv" style={{ fontSize: 28, opacity: 0.3 }} />
                    )}
                  </div>
                  <div className="screen-thumb-ticker">
                    <span className="screen-ticker-label">INFO</span>
                    {screen.slug}
                  </div>
                </div>
                <div className="screen-info">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="screen-name">{screen.name}</div>
                    {statusBadge(screen.status)}
                  </div>
                  <div className="screen-meta">
                    <i className="ti ti-map-pin" />
                    {screen.location} · {screen.layout.name}
                  </div>
                </div>
              </Link>
              <div className="card-footer flex justify-end gap-2">
                <Link href={`/admin/preview/${screen.id}`} className="btn btn-outline-blue btn-sm">
                  <i className="ti ti-eye" />
                  Preview
                </Link>
                <button className="btn btn-ghost btn-sm" onClick={() => setDeleting(screen)}>
                  <i className="ti ti-trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ScreenFormModal open={formOpen} onClose={() => setFormOpen(false)} onCreated={load} />
      <ConfirmDialog
        open={!!deleting}
        title="Hapus layar?"
        description={`"${deleting?.name}" akan dihapus permanen.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
