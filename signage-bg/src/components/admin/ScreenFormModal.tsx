"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import type { Layout } from "@/types";

export default function ScreenFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [layoutId, setLayoutId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setName("");
    setLocation("");
    setError(null);
    void fetch("/api/layouts")
      .then((r) => r.json())
      .then((j) => {
        setLayouts(j.data ?? []);
        setLayoutId(j.data?.[0]?.id ?? "");
      });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/screens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location, layoutId }),
    });

    setSaving(false);

    if (res.ok) {
      toast.push("success", "Layar berhasil didaftarkan");
      onCreated();
      onClose();
    } else {
      const json = await res.json();
      setError(json.error ?? "Gagal mendaftarkan layar");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Daftarkan Layar Baru"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="screen-form" className="btn btn-primary" disabled={saving}>
            {saving ? "Menyimpan..." : "Daftarkan"}
          </button>
        </>
      }
    >
      <form id="screen-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="scr-name">Nama Layar</label>
          <input
            id="scr-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Banking Hall 1"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="scr-location">Lokasi</label>
          <input
            id="scr-location"
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Lantai 1"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="scr-layout">Layout</label>
          <select
            id="scr-layout"
            className="input"
            value={layoutId}
            onChange={(e) => setLayoutId(e.target.value)}
            required
          >
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  );
}
