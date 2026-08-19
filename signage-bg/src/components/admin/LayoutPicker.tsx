"use client";

import type { Layout, Zone } from "@/types";

function zoneColor(type: Zone["type"]): string {
  switch (type) {
    case "main":
      return "var(--blue-600)";
    case "sidebar":
      return "var(--gold-500)";
    case "clock":
      return "var(--purple-600)";
    default:
      return "var(--neutral-500)";
  }
}

function zoneWrapperStyle(zone: Zone, direction: "row" | "column"): React.CSSProperties {
  if (zone.position === "full") return { flex: 1 };
  const size = direction === "row" ? zone.width : zone.height;
  if (!size || size === "1fr") return { flex: 1 };
  return { flex: `0 0 ${size}` };
}

function LayoutPreview({ layout }: { layout: Layout }) {
  const zones = layout.zones?.zones ?? [];
  const bodyZones = zones.filter((z) => z.type !== "ticker");
  const tickerZone = zones.find((z) => z.type === "ticker");
  const direction: "row" | "column" = bodyZones.some(
    (z) => z.position === "left" || z.position === "right"
  )
    ? "row"
    : "column";

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "16 / 9",
        background: "#000",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: direction, gap: 2, padding: 2 }}>
        {bodyZones.map((zone) => (
          <div
            key={zone.id}
            style={{
              ...zoneWrapperStyle(zone, direction),
              background: zoneColor(zone.type),
              opacity: 0.35,
              borderRadius: 2,
            }}
          />
        ))}
      </div>
      {tickerZone && <div style={{ height: 4, background: "var(--blue-700)", margin: "0 2px 2px" }} />}
    </div>
  );
}

export default function LayoutPicker({
  layouts,
  value,
  onChange,
}: {
  layouts: Layout[];
  value: string;
  onChange: (layoutId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {layouts.map((layout) => (
        <button
          key={layout.id}
          type="button"
          onClick={() => onChange(layout.id)}
          className="rounded-lg p-2 text-left"
          style={{
            border: `1px solid ${value === layout.id ? "var(--blue-500)" : "var(--border)"}`,
            background: "var(--surface-2)",
          }}
        >
          <LayoutPreview layout={layout} />
          <div className="mt-2 text-xs font-medium" style={{ color: "var(--text-primary)" }}>
            {layout.name}
          </div>
        </button>
      ))}
    </div>
  );
}
