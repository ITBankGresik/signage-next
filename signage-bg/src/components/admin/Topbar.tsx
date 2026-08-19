"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const labelMap: Record<string, string> = {
  admin: "Dashboard",
  contents: "Library Konten",
  upload: "Upload Konten",
  playlists: "Playlist",
  schedules: "Jadwal",
  tickers: "Ticker",
  screens: "Layar",
  layouts: "Layout Zone",
  users: "Pengguna",
  logs: "Activity Log",
  settings: "Pengaturan",
  preview: "Preview",
};

export default function Topbar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between px-6"
      style={{
        height: "var(--topbar-h)",
        background: "var(--surface-2)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <i className="ti ti-chevron-right" style={{ fontSize: 12 }} />}
            <span
              style={
                i === segments.length - 1
                  ? { color: "var(--text-primary)", fontWeight: 500 }
                  : undefined
              }
            >
              {labelMap[seg] ?? seg}
            </span>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {action}
        <button className="btn btn-ghost btn-icon-only" aria-label="Notifikasi">
          <i className="ti ti-bell" />
        </button>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold"
          style={{ background: "var(--blue-50)", color: "var(--blue-700)" }}
        >
          {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
      </div>
    </header>
  );
}
