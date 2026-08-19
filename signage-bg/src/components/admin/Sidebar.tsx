"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const sections: NavSection[] = [
  {
    label: "Konten",
    items: [
      { href: "/admin/contents", label: "Library Konten", icon: "ti-photo" },
      { href: "/admin/playlists", label: "Playlist", icon: "ti-playlist" },
      { href: "/admin/schedules", label: "Jadwal", icon: "ti-calendar" },
      { href: "/admin/tickers", label: "Ticker", icon: "ti-align-left" },
    ],
  },
  {
    label: "Layar",
    items: [
      { href: "/admin/screens", label: "Layar", icon: "ti-device-tv" },
      { href: "/admin/layouts", label: "Layout Zone", icon: "ti-layout-grid" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { href: "/admin/users", label: "Pengguna", icon: "ti-users" },
      { href: "/admin/logs", label: "Activity Log", icon: "ti-history" },
      { href: "/admin/settings", label: "Pengaturan", icon: "ti-settings" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 flex flex-col"
      style={{
        width: "var(--sidebar-w)",
        background: "var(--surface-2)",
        borderRight: "1px solid var(--border)",
      }}
    >
      <div
        className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--blue-700)" }}
        >
          <i className="ti ti-device-tv" style={{ color: "white", fontSize: 18 }} />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Signage BG
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            BPR Bank Gresik
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <Link href="/admin" className={`nav-item ${pathname === "/admin" ? "active" : ""}`}>
          <i className={`ti ti-layout-dashboard`} />
          Dashboard
        </Link>
        {sections.map((section) => (
          <div key={section.label}>
            <div className="nav-section-label">{section.label}</div>
            {section.items
              .filter((item) => item.href !== "/admin/users" || session?.user?.role === "ADMIN")
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname.startsWith(item.href) ? "active" : ""}`}
                >
                  <i className={`ti ${item.icon}`} />
                  {item.label}
                </Link>
              ))}
          </div>
        ))}
      </nav>

      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
          style={{ background: "var(--blue-50)", color: "var(--blue-700)" }}
        >
          {session?.user?.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 leading-tight">
          <div
            className="truncate text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {session?.user?.name ?? "..."}
          </div>
          <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
            {session?.user?.role ?? ""}
          </div>
        </div>
      </div>
    </aside>
  );
}
