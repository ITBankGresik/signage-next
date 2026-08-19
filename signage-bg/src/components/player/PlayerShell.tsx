"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { Ticker, ZoneConfig, Zone } from "@/types"
import MainZone from "./zones/MainZone"
import TickerZone from "./zones/TickerZone"
import SidebarZone from "./zones/SidebarZone"
import ClockZone from "./zones/ClockZone"

type PlayerContent = {
  id: string
  name: string
  type: "IMAGE" | "VIDEO"
  filePath: string
  duration: number
}

type PlayerPlaylistItem = {
  id: string
  order: number
  durationOverride: number | null
  content: PlayerContent
}

type PlayerPlaylist = {
  id: string
  name: string
  items: PlayerPlaylistItem[]
} | null

type PlayerShellProps = {
  screenId: string
  zones: ZoneConfig
  initialPlaylist: PlayerPlaylist
  initialTickers: Ticker[]
}

const HEARTBEAT_INTERVAL_MS = 30000

export default function PlayerShell({
  screenId,
  zones,
  initialPlaylist,
  initialTickers,
}: PlayerShellProps): React.ReactElement {
  const [playlist, setPlaylist] = useState<PlayerPlaylist>(initialPlaylist)
  const [tickers, setTickers] = useState<Ticker[]>(initialTickers)
  const reconnectDelay = useRef(1000)

  const refetchPlaylist = useCallback(async () => {
    try {
      const res = await fetch(`/api/schedules/active?screenId=${screenId}`, { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setPlaylist(data.playlist ?? null)
    } catch {
      // keep showing current playlist until next successful update
    }
  }, [screenId])

  const refetchTickers = useCallback(async () => {
    try {
      const res = await fetch("/api/tickers/active", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setTickers(data.data ?? [])
    } catch {
      // keep showing current tickers until next successful update
    }
  }, [])

  useEffect(() => {
    let es: EventSource | null = null
    let closed = false
    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect(): void {
      es = new EventSource(`/api/sse/${screenId}`)

      es.onopen = () => {
        reconnectDelay.current = 1000
      }

      es.onmessage = (evt) => {
        try {
          const event = JSON.parse(evt.data) as { type: string }
          if (event.type === "schedule_update" || event.type === "screen_config_update") {
            refetchPlaylist()
          } else if (event.type === "ticker_update") {
            refetchTickers()
          }
        } catch {
          // ignore malformed events
        }
      }

      es.onerror = () => {
        es?.close()
        if (closed) return
        reconnectTimer = setTimeout(connect, reconnectDelay.current)
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000)
      }
    }

    connect()

    return () => {
      closed = true
      clearTimeout(reconnectTimer)
      es?.close()
    }
  }, [screenId, refetchPlaylist, refetchTickers])

  useEffect(() => {
    function sendHeartbeat(): void {
      fetch(`/api/screens/${screenId}/heartbeat`, { method: "POST" }).catch(() => {
        // heartbeat failure is silent; scheduler will mark offline after timeout
      })
    }

    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [screenId])

  const bodyZones = zones.zones.filter((z) => z.type !== "ticker")
  const tickerZone = zones.zones.find((z) => z.type === "ticker")
  const direction = bodyZones.some((z) => z.position === "left" || z.position === "right")
    ? "row"
    : "column"

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#000", overflow: "hidden" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: direction, minHeight: 0 }}>
        {bodyZones.map((zone) => (
          <div key={zone.id} style={zoneWrapperStyle(zone, direction)}>
            {renderZone(zone, playlist)}
          </div>
        ))}
      </div>
      {tickerZone && (
        <div style={{ height: tickerZone.height ?? "40px", flexShrink: 0 }}>
          <TickerZone tickers={tickers} />
        </div>
      )}
    </div>
  )
}

function zoneWrapperStyle(zone: Zone, direction: "row" | "column"): React.CSSProperties {
  if (zone.position === "full") return { flex: 1, minWidth: 0, minHeight: 0 }

  const size = direction === "row" ? zone.width : zone.height
  if (!size) return { flex: 1, minWidth: 0, minHeight: 0 }
  if (size === "1fr") return { flex: 1, minWidth: 0, minHeight: 0 }
  return { flex: `0 0 ${size}`, minWidth: 0, minHeight: 0 }
}

function renderZone(zone: Zone, playlist: PlayerPlaylist): React.ReactElement {
  switch (zone.type) {
    case "main":
      return <MainZone playlist={playlist} />
    case "sidebar":
      return <SidebarZone />
    case "clock":
      return <ClockZone />
    default:
      return <></>
  }
}
