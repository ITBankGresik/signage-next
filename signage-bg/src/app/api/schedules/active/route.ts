import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { serializePlaylistItem } from "@/lib/serialize"
import { isScheduleActiveNow } from "@/lib/schedule-time"

const PRIORITY_RANK: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 }

const querySchema = z.object({
  screenId: z.string().min(1),
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

  if (!parsed.success) {
    return NextResponse.json({ error: "screenId wajib diisi", code: "VALIDATION" }, { status: 400 })
  }

  const { screenId } = parsed.data
  const now = new Date()

  const candidates = await prisma.schedule.findMany({
    where: { screenId, status: "ACTIVE" },
    include: {
      playlist: {
        include: { items: { orderBy: { order: "asc" }, include: { content: true } } },
      },
    },
  })

  const activeSchedules = candidates.filter((s) => isScheduleActiveNow(s, now))

  if (activeSchedules.length > 0) {
    const best = activeSchedules.reduce((top, curr) =>
      PRIORITY_RANK[curr.priority] > PRIORITY_RANK[top.priority] ? curr : top
    )
    const playlist = { ...best.playlist, items: best.playlist.items.map(serializePlaylistItem) }
    return NextResponse.json({ source: "schedule", schedule: { ...best, playlist: undefined }, playlist })
  }

  const fallbackConfig = await prisma.systemConfig.findUnique({
    where: { key: "fallbackPlaylistId" },
  })

  if (fallbackConfig?.value) {
    const playlist = await prisma.playlist.findUnique({
      where: { id: fallbackConfig.value },
      include: { items: { orderBy: { order: "asc" }, include: { content: true } } },
    })
    if (playlist) {
      return NextResponse.json({
        source: "fallback",
        schedule: null,
        playlist: { ...playlist, items: playlist.items.map(serializePlaylistItem) },
      })
    }
  }

  return NextResponse.json({ source: "none", schedule: null, playlist: null })
}
