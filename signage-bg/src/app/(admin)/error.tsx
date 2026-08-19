"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--red-50)" }}
      >
        <i className="ti ti-alert-triangle" style={{ fontSize: 22, color: "var(--red-700)" }} />
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Terjadi kesalahan
        </div>
        <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {error.message || "Halaman gagal dimuat. Coba lagi."}
        </div>
      </div>
      <button className="btn btn-primary btn-sm" onClick={reset}>
        <i className="ti ti-refresh" />
        Coba Lagi
      </button>
    </div>
  );
}
