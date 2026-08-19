"use client"

import { useEffect, useRef, useState } from "react"

let audioUnlocked = false

function VideoItem({
  content,
  onEnded,
}: {
  content: PlayerContent
  onEnded: () => void
}): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !audioUnlocked
    video.play().catch(() => {
      // browser blocked autoplay with sound; fall back to muted so playback never stalls
      video.muted = true
      video.play().catch(() => {
        // ignore; will retry on next item or user interaction
      })
    })
  }, [content.id])

  return (
    <video
      ref={videoRef}
      key={content.id}
      src={content.filePath}
      onEnded={onEnded}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  )
}

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

type MainZoneProps = {
  playlist: { id: string; items: PlayerPlaylistItem[] } | null
}

export default function MainZone({ playlist }: MainZoneProps): React.ReactElement {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const items = playlist?.items ?? []
  const item = items[index % items.length]

  useEffect(() => {
    setIndex(0)
  }, [playlist?.id])

  useEffect(() => {
    function unlockAudio(): void {
      if (audioUnlocked) return
      audioUnlocked = true
      const video = document.querySelector("video")
      if (video) {
        video.muted = false
        video.play().catch(() => {
          // ignore; audio will apply from the next item onward
        })
      }
    }

    document.addEventListener("pointerdown", unlockAudio)
    document.addEventListener("touchstart", unlockAudio)
    return () => {
      document.removeEventListener("pointerdown", unlockAudio)
      document.removeEventListener("touchstart", unlockAudio)
    }
  }, [])

  useEffect(() => {
    if (items.length === 0) return
    setVisible(true)
    if (item?.content.type === "VIDEO") return // advance handled by onEnded

    const durationMs = (item?.durationOverride ?? item?.content.duration ?? 10) * 1000
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => setIndex((i) => (i + 1) % items.length), 300)
    }, durationMs)

    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items.length, playlist?.id])

  if (!item) {
    return (
      <div style={fallbackStyle}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "#fff" }}>
          BPR Bank Gresik
        </div>
      </div>
    )
  }

  function handleVideoEnded(): void {
    setVisible(false)
    setTimeout(() => setIndex((i) => (i + 1) % items.length), 300)
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#001428", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
      >
        {item.content.type === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.content.filePath}
            alt={item.content.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <VideoItem content={item.content} onEnded={handleVideoEnded} />
        )}
      </div>
    </div>
  )
}

const fallbackStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#001428",
}
