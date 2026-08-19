"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import type { Content, ContentCategory } from "@/types";

export default function ContentEditModal({
  content,
  onClose,
  onSaved,
}: {
  content: Content | null;
  onClose: () => void;
  onSaved: (content: Content) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ContentCategory>("INFO");
  const [duration, setDuration] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (content) {
      setName(content.name);
      setCategory(content.category);
      setDuration(content.duration);
    }
  }, [content]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content) return;
    setSaving(true);
    const res = await fetch(`/api/contents/${content.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, duration }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      onSaved(updated);
      onClose();
    }
  }

  return (
    <Modal
      open={!!content}
      onClose={onClose}
      title="Edit Konten"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="content-edit-form" className="btn btn-primary" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </>
      }
    >
      <form id="content-edit-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="edit-name">Nama</label>
          <input
            id="edit-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="edit-category">Kategori</label>
          <select
            id="edit-category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as ContentCategory)}
          >
            <option value="PROMO">Promo</option>
            <option value="INFO">Informasi</option>
            <option value="EVENT">Event</option>
            <option value="IDLE">Idle</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="edit-duration">Durasi tampil (detik)</label>
          <input
            id="edit-duration"
            type="number"
            min={1}
            className="input"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
