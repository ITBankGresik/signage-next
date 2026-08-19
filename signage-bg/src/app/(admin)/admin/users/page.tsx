"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import UserFormModal from "@/components/admin/UserFormModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

type UserRow = { id: string; name: string; email: string; role: "ADMIN" | "OPERATOR"; createdAt: string };

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (session && session.user.role !== "ADMIN") {
      setLoading(false);
      return;
    }
    if (session) void load();
  }, [session]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) {
      const json = await res.json();
      setUsers(json.data ?? []);
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/users/${deleting.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== deleting.id));
      toast.push("success", "Pengguna dihapus");
      setDeleting(null);
    } else {
      const json = await res.json();
      toast.push("danger", json.error ?? "Gagal menghapus pengguna");
    }
  }

  if (session && session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <i className="ti ti-lock" style={{ fontSize: 28, color: "var(--text-muted)" }} />
        <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Halaman ini hanya bisa diakses oleh Admin.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Pengguna
        </h1>
        <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
          <i className="ti ti-plus" />
          Tambah Pengguna
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Bergabung</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
                      style={{ background: "var(--blue-50)", color: "var(--blue-700)" }}
                    >
                      {u.name[0]?.toUpperCase()}
                    </div>
                  </td>
                  <td>{u.name}</td>
                  <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === "ADMIN" ? "badge-blue" : "badge-gray"}`}>{u.role}</span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>
                    {new Date(u.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                  </td>
                  <td>
                    {u.id !== session?.user.id && (
                      <button
                        className="btn btn-ghost btn-sm btn-icon-only"
                        aria-label="Hapus pengguna"
                        onClick={() => setDeleting(u)}
                      >
                        <i className="ti ti-trash" style={{ color: "var(--red-700)" }} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormModal open={formOpen} onClose={() => setFormOpen(false)} onCreated={load} />
      <ConfirmDialog
        open={!!deleting}
        title="Hapus pengguna?"
        description={`"${deleting?.name}" tidak akan bisa login lagi.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
