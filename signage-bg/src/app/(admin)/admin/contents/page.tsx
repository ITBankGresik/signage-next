"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ContentCard from "@/components/admin/ContentCard";
import ContentPreviewModal from "@/components/admin/ContentPreviewModal";
import ContentEditModal from "@/components/admin/ContentEditModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import type { Content, ContentType } from "@/types";

type Filter = "ALL" | ContentType;

export default function ContentsPage() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [previewing, setPreviewing] = useState<Content | null>(null);
  const [editing, setEditing] = useState<Content | null>(null);
  const [deleting, setDeleting] = useState<Content | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const toast = useToast();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    void loadContents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, debouncedSearch]);

  async function loadContents() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "ALL") params.set("type", filter);
    if (debouncedSearch) params.set("q", debouncedSearch);

    const res = await fetch(`/api/contents?${params.toString()}`);
    const json = await res.json();
    setContents(json.data ?? []);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const res = await fetch(`/api/contents/${deleting.id}`, { method: "DELETE" });
    setDeleteLoading(false);
    if (res.ok) {
      setContents((prev) => prev.filter((c) => c.id !== deleting.id));
      toast.push("success", "Konten dihapus");
      setDeleting(null);
    } else {
      toast.push("danger", "Gagal menghapus konten");
    }
  }

  const filterButtons: { key: Filter; label: string }[] = useMemo(
    () => [
      { key: "ALL", label: "Semua" },
      { key: "IMAGE", label: "Gambar" },
      { key: "VIDEO", label: "Video" },
    ],
    []
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Library Konten
        </h1>
        <Link href="/admin/contents/upload" className="btn btn-primary">
          <i className="ti ti-upload" />
          Upload Konten
        </Link>
      </div>

      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex gap-2">
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
        <div className="input-with-icon w-64">
          <i className="ti ti-search input-icon" />
          <input
            className="input"
            placeholder="Cari konten..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : contents.length === 0 ? (
        <EmptyState
          icon="ti-photo-off"
          title="Belum ada konten"
          description="Upload file pertama untuk mulai membangun library konten."
          action={
            <Link href="/admin/contents/upload" className="btn btn-primary btn-sm">
              <i className="ti ti-upload" />
              Upload Konten
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-2">
          {contents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onPreview={setPreviewing}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </div>
      )}

      <ContentPreviewModal content={previewing} onClose={() => setPreviewing(null)} />
      <ContentEditModal
        content={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) =>
          setContents((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        }
      />
      <ConfirmDialog
        open={!!deleting}
        title="Hapus konten?"
        description={`"${deleting?.name}" akan dihapus permanen beserta file-nya.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        loading={deleteLoading}
      />
    </div>
  );
}
