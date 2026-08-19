"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function UserFormModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "OPERATOR">("OPERATOR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    setSaving(false);

    if (res.ok) {
      toast.push("success", "Pengguna dibuat");
      setName("");
      setEmail("");
      setPassword("");
      setRole("OPERATOR");
      onCreated();
      onClose();
    } else {
      const json = await res.json();
      setError(json.error ?? "Gagal membuat pengguna");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pengguna Baru"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="user-form" className="btn btn-primary" disabled={saving}>
            {saving ? "Menyimpan..." : "Buat Pengguna"}
          </button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="usr-name">Nama</label>
          <input id="usr-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="usr-email">Email</label>
          <input
            id="usr-email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="usr-password">Password</label>
          <input
            id="usr-password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <div className="form-hint">Minimal 8 karakter</div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="usr-role">Role</label>
          <select
            id="usr-role"
            className="input"
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
          >
            <option value="OPERATOR">Operator</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    </Modal>
  );
}
