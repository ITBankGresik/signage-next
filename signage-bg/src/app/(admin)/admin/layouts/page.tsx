"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import LayoutPicker from "@/components/admin/LayoutPicker";
import type { Layout } from "@/types";

export default function LayoutsPage() {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [screenCounts, setScreenCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [layoutsRes, screensRes] = await Promise.all([
      fetch("/api/layouts"),
      fetch("/api/screens"),
    ]);
    const layoutsJson = await layoutsRes.json();
    const screensJson = await screensRes.json();

    const counts: Record<string, number> = {};
    for (const s of screensJson.data ?? []) {
      counts[s.layoutId] = (counts[s.layoutId] ?? 0) + 1;
    }

    setLayouts(layoutsJson.data ?? []);
    setScreenCounts(counts);
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Layout Zone
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Preset susunan zone yang bisa dipakai layar. Layout kustom via editor visual belum tersedia (lihat backlog).
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : (
        <>
          <LayoutPicker layouts={layouts} value="" onChange={() => {}} />
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
            {layouts.map((l) => (
              <div key={l.id}>
                {l.name}: dipakai {screenCounts[l.id] ?? 0} layar{l.isDefault ? " · default" : ""}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
