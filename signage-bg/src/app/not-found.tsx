import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 text-center"
      style={{ background: "var(--surface-page)" }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--surface-1)" }}
      >
        <i className="ti ti-map-off" style={{ fontSize: 22, color: "var(--text-muted)" }} />
      </div>
      <div>
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
          Halaman tidak ditemukan
        </div>
        <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          URL yang diakses tidak ada atau sudah dipindahkan.
        </div>
      </div>
      <Link href="/admin" className="btn btn-primary btn-sm">
        <i className="ti ti-home" />
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
