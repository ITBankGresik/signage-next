"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

type Option = { id: string; name: string };

function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ScheduleFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [screens, setScreens] = useState<Option[]>([]);
  const [playlists, setPlaylists] = useState<Option[]>([]);
  const [screenId, setScreenId] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [startAt, setStartAt] = useState(toLocalInput(new Date()));
  const [endAt, setEndAt] = useState(toLocalInput(new Date(Date.now() + 3600_000)));
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    void fetch("/api/screens").then((r) => r.json()).then((j) => setScreens(j.data ?? []));
    void fetch("/api/playlists").then((r) => r.json()).then((j) => setPlaylists(j.data ?? []));
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screenId,
        playlistId,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        priority,
        status,
      }),
    });

    setSaving(false);

    if (res.ok) {
      toast.push("success", "Jadwal dibuat");
      onCreated();
      onClose();
    } else {
      const json = await res.json();
      setError(json.error ?? "Gagal membuat jadwal");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Jadwal Baru"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="schedule-form" className="btn btn-primary" disabled={saving}>
            {saving ? "Menyimpan..." : "Buat Jadwal"}
          </button>
        </>
      }
    >
      <form id="schedule-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="sch-screen">Layar</label>
          <select
            id="sch-screen"
            className="input"
            value={screenId}
            onChange={(e) => setScreenId(e.target.value)}
            required
          >
            <option value="">Pilih layar</option>
            {screens.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="sch-playlist">Playlist</label>
          <select
            id="sch-playlist"
            className="input"
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
            required
          >
            <option value="">Pilih playlist</option>
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label" htmlFor="sch-start">Mulai</label>
            <input
              id="sch-start"
              type="datetime-local"
              className="input"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="sch-end">Selesai</label>
            <input
              id="sch-end"
              type="datetime-local"
              className="input"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="form-label" htmlFor="sch-priority">Prioritas</label>
            <select
              id="sch-priority"
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value as typeof priority)}
            >
              <option value="LOW">Rendah</option>
              <option value="MEDIUM">Sedang</option>
              <option value="HIGH">Tinggi</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="sch-status">Status</label>
            <select
              id="sch-status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  );
}
