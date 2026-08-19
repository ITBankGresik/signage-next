"use client"

import { useLayoutEffect, useRef, useState } from "react"
import type { Ticker } from "@/types"

type TickerZoneProps = {
  tickers: Ticker[]
}

export default function TickerZone({ tickers }: TickerZoneProps): React.ReactElement {
  const textRef = useRef<HTMLDivElement>(null)
  const [durationSec, setDurationSec] = useState(30)

  const combined = tickers.map((t) => t.text).join("   ·   ")
  const speed = tickers[0]?.speed ?? 60

  useLayoutEffect(() => {
    if (!textRef.current) return
    const contentWidth = textRef.current.scrollWidth / 2
    if (contentWidth > 0) {
      setDurationSec(Math.max(8, contentWidth / speed))
    }
  }, [combined, speed])

  if (!combined) {
    return <div className="player-ticker" />
  }

  return (
    <div className="player-ticker">
      <div className="player-ticker-label">INFO</div>
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
