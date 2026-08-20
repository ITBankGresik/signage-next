"use client";

import { useEffect, useState } from "react";

function formatTimeParts(date: Date): { hh: string; mm: string; ss: string } {
  return {
    hh: String(date.getHours()).padStart(2, "0"),
    mm: String(date.getMinutes()).padStart(2, "0"),
    ss: String(date.getSeconds()).padStart(2, "0"),
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ClockZone(): React.ReactElement {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#001428",
        gap: 8,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(60px, 8vw, 140px)",
          fontWeight: 700,
          color: "#E2E8F0",
          letterSpacing: "0.02em",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {now ? (
          <>
            {formatTimeParts(now).hh}
            <span className="clock-colon">:</span>
            {formatTimeParts(now).mm}
            <span className="clock-colon">:</span>
            {formatTimeParts(now).ss}
          </>
        ) : (
          "--:--:--"
        )}
      </div>
      <div style={{ fontSize: 16, color: "#FFFFFF" }}>
        {now ? formatDate(now) : ""}
      </div>
    </div>
  );
}
