"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

type LogRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string; email: string };
};

const ENTITIES = ["Content", "Playlist", "Schedule", "Screen", "Layout", "Ticker", "User", "SystemConfig"];

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState("");
  const [loading, setLoading] = useState(true);
  const perPage = 20;

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, entity]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
    if (entity) params.set("entity", entity);
    const res = await fetch(`/api/activity-logs?${params.toString()}`);
    const json = await res.json();
    setLogs(json.data ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Activity Log
        </h1>
        <select
          className="input w-48"
          value={entity}
          onChange={(e) => {
            setPage(1);
            setEntity(e.target.value);
          }}
        >
          <option value="">Semua entitas</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <Skeleton className="h-96" />
      ) : logs.length === 0 ? (
        <EmptyState icon="ti-history" title="Belum ada aktivitas" />
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Entitas</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td>{log.user?.name ?? "—"}</td>
                    <td>
                      <span className="badge badge-gray">{log.action}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{log.entity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Sebelumnya
              </button>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Halaman {page} / {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Berikutnya
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
