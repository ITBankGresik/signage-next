"use client";

import { useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import ScheduleFormModal from "@/components/admin/ScheduleFormModal";

type ScheduleRow = {
  id: string;
  startAt: string;
  endAt: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "DRAFT" | "ACTIVE" | "EXPIRED";
  recurrence: "ONCE" | "DAILY";
  recurrenceUntil: string | null;
  screen: { id: string; name: string };
  playlist: { id: string; name: string };
};

function formatScheduleTime(s: ScheduleRow): string {
  if (s.recurrence === "ONCE") {
    return (
      new Date(s.startAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) +
      " – " +
      new Date(s.endAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })
    );
  }
  const time = (d: string) => new Date(d).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const until = s.recurrenceUntil
    ? `sampai ${new Date(s.recurrenceUntil).toLocaleDateString("id-ID", { dateStyle: "short" })}`
    : "tanpa batas";
  return `Harian ${time(s.startAt)}–${time(s.endAt)} (${until})`;
}

type Tab = "today" | "week" | "all";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-gray",
  ACTIVE: "badge-green",
  EXPIRED: "badge-red",
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: "var(--neutral-400)",
  MEDIUM: "var(--blue-500)",
  HIGH: "var(--gold-500)",
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [screens, setScreens] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("today");
  const [screenFilter, setScreenFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    void fetch("/api/screens").then((r) => r.json()).then((j) => setScreens(j.data ?? []));
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, screenFilter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (screenFilter) params.set("screenId", screenFilter);
    if (tab === "today") params.set("date", new Date().toISOString().slice(0, 10));

    const res = await fetch(`/api/schedules?${params.toString()}`);
    const json = await res.json();
    let data: ScheduleRow[] = json.data ?? [];

    if (tab === "week") {
      const now = new Date();
      const weekEnd = new Date(now.getTime() + 7 * 24 * 3600_000);
      data = data.filter((s) => {
        if (s.recurrence === "DAILY") {
          return !s.recurrenceUntil || new Date(s.recurrenceUntil) >= now;
        }
        return new Date(s.startAt) <= weekEnd && new Date(s.endAt) >= now;
      });
    }

    setSchedules(data);
    setLoading(false);
  }

  const timelineItems = useMemo(
    () => [...schedules].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [schedules]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          Jadwal
        </h1>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <i className="ti ti-plus" />
          Jadwal Baru
        </button>
      </div>

      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {([
            { key: "today", label: "Hari ini" },
            { key: "week", label: "Minggu ini" },
            { key: "all", label: "Semua" },
          ] as { key: Tab; label: string }[]).map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          className="input w-56"
          value={screenFilter}
          onChange={(e) => setScreenFilter(e.target.value)}
        >
          <option value="">Semua layar</option>
          {screens.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon="ti-calendar-off"
          title="Belum ada jadwal"
          description="Buat jadwal untuk menayangkan playlist di layar tertentu."
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
              <i className="ti ti-plus" />
              Jadwal Baru
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-[280px_1fr] gap-4 max-[900px]:grid-cols-1">
          <div className="card">
            <div className="card-header">
              <span className="card-header-title">Timeline</span>
            </div>
            <div className="card-body space-y-2">
              {timelineItems.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ background: PRIORITY_COLOR[s.priority] }}
                  />
                  <span style={{ color: "var(--text-muted)" }}>
                    {new Date(s.startAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="truncate" style={{ color: "var(--text-primary)" }}>
                    {s.playlist.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Playlist</th>
                  <th>Layar</th>
                  <th>Waktu</th>
                  <th>Prioritas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td>{s.playlist.name}</td>
                    <td>{s.screen.name}</td>
                    <td>{formatScheduleTime(s)}</td>
                    <td>{s.priority}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[s.status]}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ScheduleFormModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
    </div>
  );
}
