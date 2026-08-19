"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
        Dashboard
      </h1>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-card-label">Total Layar</div>
          <div className="stat-card-value">{screens.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Konten Media</div>
          <div className="stat-card-value">{contentTotal}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Jadwal Aktif</div>
          <div className="stat-card-value">{activeSchedules.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Ticker Aktif</div>
          <div className="stat-card-value">{activeTickerCount}</div>
        </div>
      </div>

      {offlineScreens.length > 0 && (
        <div className="mb-6 rounded-lg p-4" style={{ background: "var(--red-50)", border: "1px solid var(--red-200)" }}>
          <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--red-800)" }}>
            <i className="ti ti-alert-triangle" />
            {offlineScreens.length} layar sedang offline
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {offlineScreens.map((s) => (
              <Link key={s.id} href={`/admin/screens/${s.id}`} className="badge badge-red">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <div className="card-header">
            <span className="card-header-title">Status Layar</span>
            <Link href="/admin/screens" className="text-xs" style={{ color: "var(--text-accent)" }}>
              Lihat semua
            </Link>
          </div>
          <div className="table-wrap">
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
                    <tr key={s.id}>
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
            <span className="card-header-title">Jadwal Hari Ini</span>
            <Link href="/admin/schedules" className="text-xs" style={{ color: "var(--text-accent)" }}>
              Lihat semua
            </Link>
          </div>
          <div className="card-body space-y-2">
            {todaySchedules.length === 0 ? (
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                Tidak ada jadwal hari ini.
              </div>
            ) : (
              todaySchedules.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span style={{ color: "var(--text-primary)" }}>{s.playlist.name}</span>
                    <span className="ml-2" style={{ color: "var(--text-muted)" }}>
                      {s.screen.name}
                    </span>
                  </div>
                  <span style={{ color: "var(--text-muted)" }}>
                    {new Date(s.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <span className="card-header-title">Konten Terbaru</span>
          <Link href="/admin/contents" className="text-xs" style={{ color: "var(--text-accent)" }}>
            Lihat semua
          </Link>
        </div>
        <div className="card-body grid grid-cols-3 gap-3">
          {recentContents.length === 0 ? (
            <div className="col-span-3 text-sm" style={{ color: "var(--text-muted)" }}>
              Belum ada konten.
            </div>
          ) : (
            recentContents.map((c) => (
              <div key={c.id} className="flex items-center gap-2 rounded-md p-2" style={{ background: "var(--surface-1)" }}>
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-md"
                  style={{ background: "var(--neutral-900)" }}
                >
                  {c.type === "IMAGE" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.filePath} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <i className="ti ti-video" style={{ color: "var(--neutral-500)" }} />
                  )}
                </div>
                <div className="min-w-0 truncate text-xs" style={{ color: "var(--text-primary)" }}>
                  {c.name}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
