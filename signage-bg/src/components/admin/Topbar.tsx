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

export default function Topbar({
  action,
  onMenuClick,
}: {
  action?: React.ReactNode;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-2 px-4 sm:px-6"
      style={{
        height: "var(--topbar-h)",
        background: "var(--surface-2)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {onMenuClick && (
          <button
            className="btn btn-ghost btn-icon-only flex-shrink-0 lg:hidden"
            onClick={onMenuClick}
            aria-label="Buka menu"
          >
            <i className="ti ti-menu-2" />
          </button>
        )}
        <div
          className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          {segments.map((seg, i) => (
            <span key={i} className="flex flex-shrink-0 items-center gap-1">
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
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
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
