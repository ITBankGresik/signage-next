import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { serializePlaylistItem } from "@/lib/serialize"
import { isScheduleActiveNow } from "@/lib/schedule-time"
import PlayerShell from "@/components/player/PlayerShell"
import type { ZoneConfig } from "@/types"

async function getScreen(slugOrId: string) {
  const screen = await prisma.screen.findFirst({
    where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
    include: { layout: true },
  })
  return screen
}

async function getActivePlaylist(screenId: string) {
  const now = new Date()
  const candidates = await prisma.schedule.findMany({
    where: { screenId, status: "ACTIVE" },
    include: { playlist: { include: { items: { orderBy: { order: "asc" }, include: { content: true } } } } },
  })
  const activeSchedules = candidates.filter((s) => isScheduleActiveNow(s, now))

  const priorityRank: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 }
  if (activeSchedules.length > 0) {
    const best = activeSchedules.reduce((top, curr) =>
      priorityRank[curr.priority] > priorityRank[top.priority] ? curr : top
    )
    return { ...best.playlist, items: best.playlist.items.map(serializePlaylistItem) }
  }

  const fallbackConfig = await prisma.systemConfig.findUnique({ where: { key: "fallbackPlaylistId" } })
  if (fallbackConfig?.value) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: fallbackConfig.value },
      include: { items: { orderBy: { order: "asc" }, include: { content: true } } },
    })
    if (playlist) {
      return { ...playlist, items: playlist.items.map(serializePlaylistItem) }
    }
  }

  return null
}

export async function generateMetadata({
  params,
}: {
  params: { screenId: string }
}): Promise<Metadata> {
  const screen = await getScreen(params.screenId)
  return { title: screen ? `${screen.name} — Signage BPR Bank Gresik` : "Layar tidak ditemukan" }
}

export default async function PlayerPage({
  params,
}: {
  params: { screenId: string }
}): Promise<React.ReactElement> {
  const screen = await getScreen(params.screenId)
  if (!screen) notFound()

  const [playlist, tickers, systemNameConfig] = await Promise.all([
    getActivePlaylist(screen.id),
    prisma.ticker.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    prisma.systemConfig.findUnique({ where: { key: "systemName" } }),
  ])

  return (
    <PlayerShell
      screenId={screen.id}
      zones={screen.layout.zones as unknown as ZoneConfig}
      initialPlaylist={playlist}
      initialTickers={tickers.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))}
      systemName={systemNameConfig?.value ?? "BPR Bank Gresik"}
    />
  )
}
