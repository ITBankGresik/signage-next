"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import FileDropzone from "@/components/admin/FileDropzone";
import { useToast } from "@/components/ui/Toast";

type UploadItem = {
  file: File;
  previewUrl: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
};

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addFiles(files: File[]) {
    setItems((prev) => [
      ...prev,
      ...files.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        status: "pending" as const,
      })),
    ]);
  }

  async function uploadAll() {
    setUploading(true);

    for (let i = 0; i < items.length; i++) {
      if (items[i].status === "success") continue;

      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: "uploading" } : it))
      );

      const formData = new FormData();
      formData.append("file", items[i].file);

      try {
        const res = await fetch("/api/contents/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const json = await res.json();
          throw new Error(json.error ?? "Gagal upload");
        }
        setItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: "success" } : it))
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? { ...it, status: "error", error: err instanceof Error ? err.message : "Gagal upload" }
              : it
          )
        );
      }
    }

    setUploading(false);
  }

  const allDone = items.length > 0 && items.every((it) => it.status === "success");

  useEffect(() => {
    if (allDone) {
      toast.push("success", `${items.length} file berhasil diunggah`);
      router.push("/admin/contents");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  return (
    <div>
      <h1
        className="mb-6 text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Upload Konten
      </h1>

      <FileDropzone onFiles={addFiles} />

      {items.length > 0 && (
        <div className="mt-5 card">
          <div className="card-body space-y-3">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md"
                  style={{ background: "var(--neutral-900)" }}
                >
                  {it.file.type.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.previewUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <i className="ti ti-video" style={{ color: "var(--neutral-500)" }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                    {it.file.name}
                  </div>
                  {it.status === "uploading" && (
                    <div
                      className="mt-1 h-1 w-full overflow-hidden rounded-full"
                      style={{ background: "var(--surface-1)" }}
                    >
                      <div
                        className="h-full animate-pulse"
                        style={{ width: "70%", background: "var(--blue-500)" }}
                      />
                    </div>
                  )}
                  {it.status === "error" && (
                    <div className="text-xs" style={{ color: "var(--red-700)" }}>
                      {it.error}
                    </div>
                  )}
                </div>
                {it.status === "pending" && <span className="badge badge-gray">Menunggu</span>}
                {it.status === "uploading" && <span className="badge badge-blue">Mengunggah...</span>}
                {it.status === "success" && <span className="badge badge-green">Berhasil</span>}
                {it.status === "error" && <span className="badge badge-red">Gagal</span>}
              </div>
            ))}
          </div>
          <div className="card-footer flex justify-end">
            <button className="btn btn-primary" onClick={uploadAll} disabled={uploading}>
              {uploading ? "Mengunggah..." : `Upload ${items.length} File`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
