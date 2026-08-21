"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import type { Ticker } from "@/types"

type TickerZoneProps = {
  tickers: Ticker[]
}

type TickerLogo = { filePath: string; name: string }

export default function TickerZone({ tickers }: TickerZoneProps): React.ReactElement {
  const textRef = useRef<HTMLDivElement>(null)
  const [durationSec, setDurationSec] = useState(30)
  const [logo, setLogo] = useState<TickerLogo | null>(null)

  const combined = tickers.map((t) => t.text).join("   ·   ")
  const speed = tickers[0]?.speed ?? 60

  useLayoutEffect(() => {
    if (!textRef.current) return
    const contentWidth = textRef.current.scrollWidth / 2
    if (contentWidth > 0) {
      setDurationSec(Math.max(8, contentWidth / speed))
    }
  }, [combined, speed])

  useEffect(() => {
    async function loadLogo(): Promise<void> {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (!data.tickerLogo) return
        const parsed = JSON.parse(data.tickerLogo)
        if (parsed?.filePath) setLogo(parsed)
      } catch {
        // keep default label if fetch/parse fails
      }
    }

    loadLogo()
  }, [])

  if (!combined) {
    return <div className="player-ticker" />
  }

  return (
    <div className="player-ticker">
      <div className="player-ticker-label">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo.filePath} alt={logo.name} style={{ height: "70%", objectFit: "contain" }} />
        ) : (
          "INFO"
        )}
      </div>
      <div className="player-ticker-viewport">
        <div
          ref={textRef}
          className="player-ticker-text"
          style={{ animationDuration: `${durationSec}s` }}
        >
          <span>{combined}</span>
          <span>{combined}</span>
        </div>
      </div>
    </div>
  )
}
