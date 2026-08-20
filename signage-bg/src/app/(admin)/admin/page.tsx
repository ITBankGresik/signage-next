"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import type { Content, ScreenStatus } from "@/types";

type ScreenRow = { id: string; name: string; location: string; status: ScreenStatus; lastSeenAt: string | null };
type ScheduleRow = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  screen: { name: string };
  playlist: { name: string };
};

const STATUS_BADGE: Record<ScreenStatus, string> = { ONLINE: "badge-green", IDLE: "badge-amber", OFFLINE: "badge-red" };

export default function AdminDashboardPage() {
  const router = useRouter();
  const [screens, setScreens] = useState<ScreenRow[]>([]);
  const [contentTotal, setContentTotal] = useState(0);
  const [recentContents, setRecentContents] = useState<Content[]>([]);
  const [activeSchedules, setActiveSchedules] = useState<ScheduleRow[]>([]);
  const [todaySchedules, setTodaySchedules] = useState<ScheduleRow[]>([]);
  const [activeTickerCount, setActiveTickerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  async function load() {
    const today = new Date().toISOString().slice(0, 10);
    const [screensRes, contentsRes, activeSchedRes, todaySchedRes, tickersRes] = await Promise.all([
      fetch("/api/screens"),
      fetch("/api/contents?perPage=3"),
      fetch("/api/schedules?status=ACTIVE"),
      fetch(`/api/schedules?date=${today}`),
      fetch("/api/tickers/active"),
    ]);
    const [screensJson, contentsJson, activeSchedJson, todaySchedJson, tickersJson] = await Promise.all([
      screensRes.json(),
      contentsRes.json(),
      activeSchedRes.json(),
      todaySchedRes.json(),
      tickersRes.json(),
    ]);

    setScreens(screensJson.data ?? []);
    setContentTotal(contentsJson.total ?? 0);
    setRecentContents(contentsJson.data ?? []);
    setActiveSchedules(activeSchedJson.data ?? []);
    setTodaySchedules(todaySchedJson.data ?? []);
    setActiveTickerCount(tickersJson.data?.length ?? 0);
    setLoading(false);
  }

  const offlineScreens = screens.filter((s) => s.status === "OFFLINE");

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {today}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/screens" className="btn btn-secondary btn-sm">
            <i className="ti ti-device-tv" />
            Tambah Layar
          </Link>
          <Link href="/admin/contents/upload" className="btn btn-secondary btn-sm">
            <i className="ti ti-upload" />
            Upload Konten
          </Link>
          <Link href="/admin/schedules" className="btn btn-primary btn-sm">
            <i className="ti ti-plus" />
            Jadwal Baru
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <div className="stat-card">
          <div className="stat-card-icon">
            <i className="ti ti-device-tv" />
          </div>
          <div className="stat-card-label">Total layar</div>
          <div className="stat-card-value">{screens.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">
            <i className="ti ti-photo" />
          </div>
          <div className="stat-card-label">Konten media</div>
          <div className="stat-card-value">{contentTotal}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">
            <i className="ti ti-calendar-check" />
          </div>
          <div className="stat-card-label">Jadwal aktif</div>
          <div className="stat-card-value">{activeSchedules.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">
            <i className="ti ti-align-left" />
          </div>
          <div className="stat-card-label">Ticker aktif</div>
          <div className="stat-card-value">{activeTickerCount}</div>
        </div>
      </div>

      {offlineScreens.length > 0 && (
        <div
          className="mb-6 flex flex-col gap-2 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:gap-3"
          style={{ background: "var(--red-50)", borderLeft: "3px solid var(--red-600)" }}
        >
          <div className="flex items-center gap-2 text-sm font-medium flex-shrink-0" style={{ color: "var(--red-800)" }}>
            <i className="ti ti-alert-triangle" />
            {offlineScreens.length} layar sedang offline
          </div>
          <div className="flex flex-wrap gap-2">
            {offlineScreens.map((s) => (
              <Link key={s.id} href={`/admin/screens/${s.id}`} className="badge badge-red">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="card-header">
            <span className="card-header-title flex items-center gap-2">
              <i className="ti ti-device-tv" style={{ color: "var(--blue-600)" }} />
              Status Layar
            </span>
            <Link href="/admin/screens" className="text-xs" style={{ color: "var(--text-accent)" }}>
              Lihat semua
            </Link>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Lokasi</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {screens.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
                      Belum ada layar
                    </td>
                  </tr>
                ) : (
                  screens.map((s) => (
                    <tr key={s.id} className="cursor-pointer" onClick={() => router.push(`/admin/screens/${s.id}`)}>
                      <td>{s.name}</td>
                      <td>{s.location}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[s.status]}`}>
                          <span className="badge-dot" />
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-header-title flex items-center gap-2">
              <i className="ti ti-calendar-check" style={{ color: "var(--blue-600)" }} />
              Jadwal Hari Ini
            </span>
            <Link href="/admin/schedules" className="text-xs" style={{ color: "var(--text-accent)" }}>
              Lihat semua
            </Link>
          </div>
          <div style={{ padding: 0 }}>
            {todaySchedules.length === 0 ? (
              <div className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>
                Tidak ada jadwal hari ini.
              </div>
            ) : (
              todaySchedules.map((s, i) => (
                <Link
                  key={s.id}
                  href="/admin/schedules"
                  className="schedule-row flex items-center justify-between px-5 py-3 text-sm"
                  style={i < todaySchedules.length - 1 ? { borderBottom: "1px solid var(--border)" } : undefined}
                >
                  <div className="min-w-0">
                    <div className="truncate" style={{ color: "var(--text-primary)" }}>
                      {s.playlist.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {s.screen.name}
                    </div>
                  </div>
                  <span className="flex-shrink-0 pl-3" style={{ color: "var(--text-muted)" }}>
                    {new Date(s.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <span className="card-header-title flex items-center gap-2">
            <i className="ti ti-photo" style={{ color: "var(--blue-600)" }} />
            Konten Terbaru
          </span>
          <Link href="/admin/contents" className="text-xs" style={{ color: "var(--text-accent)" }}>
            Lihat semua
          </Link>
        </div>
        <div className="card-body grid grid-cols-1 gap-3 sm:grid-cols-3">
          {recentContents.length === 0 ? (
            <div className="col-span-3 text-sm" style={{ color: "var(--text-muted)" }}>
              Belum ada konten.
            </div>
          ) : (
            recentContents.map((c) => (
              <Link
                key={c.id}
                href="/admin/contents"
                className="dashboard-content-item flex items-center gap-3 rounded-md p-2 transition-colors"
              >
                <div
                  className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-md"
                  style={{ background: "var(--neutral-900)" }}
                >
                  {c.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.filePath} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <video
                      src={`${c.filePath}#t=0.5`}
                      muted
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm" style={{ color: "var(--text-primary)" }}>
                    {c.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {c.type === "IMAGE" ? "Gambar" : "Video"}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
