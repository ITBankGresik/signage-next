"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Skeleton from "@/components/ui/Skeleton";
import type { Screen } from "@/types";

export default function ScreenPreviewPage() {
  const params = useParams<{ screenId: string }>();
  const [screen, setScreen] = useState<Screen | null>(null);
  const [loading, setLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.screenId]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/screens/${params.screenId}`);
    const json = await res.json();
    setScreen(json);
    setLoading(false);
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
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/admin/screens/${screen.id}`} className="btn btn-outline-blue btn-sm">
            <i className="ti ti-arrow-left" />
            Kembali
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
              {screen.name}
            </h1>
            <span
              className={`badge ${screen.status === "ONLINE" ? "badge-green" : screen.status === "IDLE" ? "badge-amber" : "badge-red"}`}
            >
              {screen.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline-blue btn-sm" onClick={() => setFrameKey((k) => k + 1)}>
            <i className="ti ti-refresh" />
            Reload
          </button>
          <a href={playerUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
            <i className="ti ti-external-link" />
            Buka di tab baru
          </a>
        </div>
      </div>

      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          border: "1px solid var(--border)",
          background: "#000",
        }}
      >
        <iframe
          key={frameKey}
          ref={iframeRef}
          src={playerUrl}
          title={`Preview ${screen.name}`}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
    </div>
  );
}
