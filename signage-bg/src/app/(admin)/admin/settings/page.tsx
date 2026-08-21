"use client";

import { useEffect, useState } from "react";
import Skeleton from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import ContentPickerModal from "@/components/admin/ContentPickerModal";
import type { Playlist, Content } from "@/types";

type OfficeHourRow = { label: string; hours: string };
type PromoBannerRow = { contentId: string; filePath: string; name: string };
type LogoRow = { contentId: string; filePath: string; name: string };

const DEFAULT_OFFICE_HOURS: OfficeHourRow[] = [
  { label: "Senin – Jumat", hours: "08.00 – 15.00" },
  { label: "Sabtu", hours: "08.00 – 12.00" },
];

export default function SettingsPage() {
  const [systemName, setSystemName] = useState("");
  const [defaultTickerSpeed, setDefaultTickerSpeed] = useState("60");
  const [heartbeatIntervalSeconds, setHeartbeatIntervalSeconds] = useState("120");
  const [fallbackPlaylistId, setFallbackPlaylistId] = useState("");
  const [officeHours, setOfficeHours] = useState<OfficeHourRow[]>(DEFAULT_OFFICE_HOURS);
  const [promoBanners, setPromoBanners] = useState<PromoBannerRow[]>([]);
  const [tickerLogo, setTickerLogo] = useState<LogoRow | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setLoading(true);
    const [settingsRes, playlistsRes] = await Promise.all([
      fetch("/api/settings"),
      fetch("/api/playlists"),
    ]);
    const settings = await settingsRes.json();
    const playlistsJson = await playlistsRes.json();

    setSystemName(settings.systemName ?? "BPR Bank Gresik");
    setDefaultTickerSpeed(settings.defaultTickerSpeed ?? "60");
    setHeartbeatIntervalSeconds(settings.heartbeatIntervalSeconds ?? "120");
    setFallbackPlaylistId(settings.fallbackPlaylistId ?? "");
    if (settings.officeHours) {
      try {
        const parsed = JSON.parse(settings.officeHours);
        if (Array.isArray(parsed) && parsed.length > 0) setOfficeHours(parsed);
      } catch {
        // keep default rows if stored value is malformed
      }
    }
    if (settings.promoBanners) {
      try {
        const parsed = JSON.parse(settings.promoBanners);
        if (Array.isArray(parsed)) setPromoBanners(parsed);
      } catch {
        // keep empty list if stored value is malformed
      }
    }
    if (settings.tickerLogo) {
      try {
        const parsed = JSON.parse(settings.tickerLogo);
        if (parsed && parsed.contentId) setTickerLogo(parsed);
      } catch {
        // keep null if stored value is malformed
      }
    }
    setPlaylists(playlistsJson.data ?? []);
    setLoading(false);
  }

  function updateOfficeHourRow(index: number, field: keyof OfficeHourRow, value: string) {
    setOfficeHours((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addOfficeHourRow() {
    setOfficeHours((rows) => [...rows, { label: "", hours: "" }]);
  }

  function removeOfficeHourRow(index: number) {
    setOfficeHours((rows) => rows.filter((_, i) => i !== index));
  }

  function addPromoBanners(contents: Content[]) {
    setPromoBanners((rows) => [
      ...rows,
      ...contents
        .filter((c) => !rows.some((r) => r.contentId === c.id))
        .map((c) => ({ contentId: c.id, filePath: c.filePath, name: c.name })),
    ]);
  }

  function removePromoBannerRow(index: number) {
    setPromoBanners((rows) => rows.filter((_, i) => i !== index));
  }

  function selectLogo(contents: Content[]) {
    const c = contents[0];
    if (c) setTickerLogo({ contentId: c.id, filePath: c.filePath, name: c.name });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemName,
        defaultTickerSpeed: Number(defaultTickerSpeed),
        heartbeatIntervalSeconds: Number(heartbeatIntervalSeconds),
        fallbackPlaylistId: fallbackPlaylistId || undefined,
        officeHours: officeHours.filter((row) => row.label.trim() && row.hours.trim()),
        promoBanners: promoBanners.map((row) => ({ contentId: row.contentId })),
        tickerLogo: tickerLogo ? { contentId: tickerLogo.contentId } : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.push("success", "Pengaturan disimpan");
    } else {
      toast.push("danger", "Gagal menyimpan pengaturan");
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 max-w-lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
          Pengaturan Sistem
        </h1>
      </div>

      <form onSubmit={handleSave} className="card max-w-lg">
        <div className="card-body space-y-4">
          <div className="form-group">
            <label className="form-label" htmlFor="set-name">Nama Sistem / Branding</label>
            <input
              id="set-name"
              className="input"
              value={systemName}
              onChange={(e) => setSystemName(e.target.value)}
            />
            <div className="form-hint">Ditampilkan di header/sidebar admin.</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="set-speed">Kecepatan Ticker Default (px/s)</label>
            <input
              id="set-speed"
              type="number"
              min={1}
              className="input"
              value={defaultTickerSpeed}
              onChange={(e) => setDefaultTickerSpeed(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="set-heartbeat">Heartbeat Timeout (detik)</label>
            <input
              id="set-heartbeat"
              type="number"
              min={30}
              className="input"
              value={heartbeatIntervalSeconds}
              onChange={(e) => setHeartbeatIntervalSeconds(e.target.value)}
            />
            <div className="form-hint">
              Layar ditandai Offline jika tidak mengirim heartbeat selama durasi ini.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="set-fallback">Playlist Fallback</label>
            <select
              id="set-fallback"
              className="input"
              value={fallbackPlaylistId}
              onChange={(e) => setFallbackPlaylistId(e.target.value)}
            >
              <option value="">Tidak ada</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="form-hint">Ditayangkan di layar yang tidak punya jadwal aktif.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Jam Layanan</label>
            <div className="space-y-2">
              {officeHours.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="input"
                    placeholder="Senin – Jumat"
                    value={row.label}
                    onChange={(e) => updateOfficeHourRow(i, "label", e.target.value)}
                  />
                  <input
                    className="input"
                    placeholder="08.00 – 15.00"
                    value={row.hours}
                    onChange={(e) => updateOfficeHourRow(i, "hours", e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => removeOfficeHourRow(i)}
                    aria-label="Hapus baris"
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-secondary mt-2" onClick={addOfficeHourRow}>
              + Tambah Baris
            </button>
            <div className="form-hint">Ditampilkan di sidebar layar signage, ganti sesuai kondisi (mis. libur nasional).</div>
          </div>

          <div className="form-group">
            <label className="form-label">Mini Banner Promo</label>
            {promoBanners.length > 0 && (
              <div className="mb-2 grid grid-cols-4 gap-2">
                {promoBanners.map((row, i) => (
                  <div
                    key={row.contentId}
                    className="relative overflow-hidden rounded-md border"
                    style={{ aspectRatio: "1", borderColor: "var(--neutral-200)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.filePath} alt={row.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePromoBannerRow(i)}
                      aria-label="Hapus banner"
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      <i className="ti ti-x" style={{ color: "white", fontSize: 12 }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" className="btn btn-secondary" onClick={() => setPickerOpen(true)}>
              + Pilih Gambar dari Library
            </button>
            <div className="form-hint">Bergantian otomatis di sidebar layar signage. Kosongkan semua untuk menyembunyikan.</div>
          </div>

          <div className="form-group">
            <label className="form-label">Logo di Ticker</label>
            {tickerLogo ? (
              <div className="mb-2 flex items-center gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border"
                  style={{ background: "#050F1A", borderColor: "var(--neutral-200)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={tickerLogo.filePath} alt={tickerLogo.name} className="h-full w-full object-contain p-1" />
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTickerLogo(null)}>
                  <i className="ti ti-trash" />
                  Hapus
                </button>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => setLogoPickerOpen(true)}>
                + Pilih Logo dari Library
              </button>
            )}
            <div className="form-hint">
              Tampil di kotak label ticker (gantikan teks &quot;INFO&quot;). Kosongkan untuk pakai teks default.
            </div>
          </div>
        </div>
        <div className="card-footer flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </form>

      <ContentPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addPromoBanners}
        filterType="IMAGE"
      />
      <ContentPickerModal
        open={logoPickerOpen}
        onClose={() => setLogoPickerOpen(false)}
        onSelect={selectLogo}
        filterType="IMAGE"
      />
    </div>
  );
}
