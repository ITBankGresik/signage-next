"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";
import LayoutPicker from "@/components/admin/LayoutPicker";
import { useToast } from "@/components/ui/Toast";
import type { Layout, ScreenStatus } from "@/types";

type ScreenDetail = {
  id: string;
  name: string;
  slug: string;
  location: string;
  status: ScreenStatus;
  layoutId: string;
  lastSeenAt: string | null;
  layout: Layout;
};

type ScheduleRow = {
  id: string;
  startAt: string;
  endAt: string;
  status: string;
  priority: string;
  playlist: { name: string };
};

type Tab = "info" | "jadwal" | "layout";

const STATUS_BADGE: Record<ScreenStatus, string> = { ONLINE: "badge-green", IDLE: "badge-amber", OFFLINE: "badge-red" };

export default function ScreenDetailPage() {
  const params = useParams<{ id: string }>();
  const [screen, setScreen] = useState<ScreenDetail | null>(null);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("info");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const toast = useToast();

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function load() {
    setLoading(true);
    const [screenRes, layoutsRes] = await Promise.all([
      fetch(`/api/screens/${params.id}`),
      fetch("/api/layouts"),
    ]);
    const screenJson = await screenRes.json();
    const layoutsJson = await layoutsRes.json();
    setScreen(screenJson);
    setName(screenJson.name ?? "");
    setLocation(screenJson.location ?? "");
    setLayouts(layoutsJson.data ?? []);

    const scheduleRes = await fetch(`/api/schedules?screenId=${params.id}`);
    const scheduleJson = await scheduleRes.json();
    setSchedules(scheduleJson.data ?? []);

    setLoading(false);
  }

  async function saveInfo() {
    const res = await fetch(`/api/screens/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location }),
    });
    if (res.ok) {
      toast.push("success", "Info layar diperbarui");
      void load();
    } else {
      toast.push("danger", "Gagal memperbarui info layar");
    }
  }

  async function changeLayout(layoutId: string) {
    const res = await fetch(`/api/screens/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layoutId }),
    });
    if (res.ok) {
      toast.push("success", "Layout diperbarui");
      void load();
    } else {
      toast.push("danger", "Gagal memperbarui layout");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!screen) {
    return <div style={{ color: "var(--text-secondary)" }}>Layar tidak ditemukan.</div>;
  }

  const playerUrl = `/player/${screen.slug}`;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            {screen.name}
          </h1>
          <span className={`badge ${STATUS_BADGE[screen.status]} mt-1`}>
            <span className="badge-dot" />
            {screen.status}
          </span>
        </div>
        <Link href={`/admin/preview/${screen.id}`} className="btn btn-outline-blue">
          <i className="ti ti-eye" />
          Preview
        </Link>
      </div>

      <div className="mb-5 flex gap-2">
        {([
          { key: "info", label: "Info" },
          { key: "jadwal", label: "Jadwal" },
          { key: "layout", label: "Layout" },
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

      {tab === "info" && (
        <div className="card max-w-lg">
          <div className="card-body space-y-3">
            <div className="form-group">
              <label className="form-label">Nama Layar</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Lokasi</label>
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input className="input" value={screen.slug} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">URL Player</label>
              <div className="flex items-center gap-2">
                <input className="input" value={playerUrl} disabled />
                <a href={playerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline-blue btn-sm">
                  <i className="ti ti-external-link" />
                </a>
              </div>
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              Terakhir aktif: {screen.lastSeenAt ? new Date(screen.lastSeenAt).toLocaleString("id-ID") : "Belum pernah"}
            </div>
          </div>
          <div className="card-footer flex justify-end">
            <button className="btn btn-primary" onClick={saveInfo}>Simpan</button>
          </div>
        </div>
      )}

      {tab === "jadwal" && (
        <div className="table-wrap">
          {schedules.length === 0 ? (
            <div className="p-6 text-sm" style={{ color: "var(--text-secondary)" }}>
              Belum ada jadwal untuk layar ini.{" "}
              <Link href="/admin/schedules" className="underline">
                Buat jadwal baru
              </Link>
              .
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Playlist</th>
                  <th>Waktu</th>
                  <th>Prioritas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s.id}>
                    <td>{s.playlist.name}</td>
                    <td>
                      {new Date(s.startAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                      {" – "}
                      {new Date(s.endAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td>{s.priority}</td>
                    <td>
                      <span className="badge">{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "layout" && (
        <LayoutPicker layouts={layouts} value={screen.layoutId} onChange={changeLayout} />
      )}
    </div>
  );
}
