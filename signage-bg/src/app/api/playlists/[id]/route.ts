import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"
import { serializePlaylistItem } from "@/lib/serialize"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const playlist = await prisma.playlist.findUnique({
    where: { id: params.id },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { content: true },
      },
    },
  })

  if (!playlist) {
    return NextResponse.json({ error: "Playlist tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json({ ...playlist, items: playlist.items.map(serializePlaylistItem) })
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = patchSchema.parse(await req.json())
    const playlist = await prisma.playlist.update({ where: { id: params.id }, data: body })
    await createLog(session.user.id, "PLAYLIST_UPDATE", "Playlist", playlist.id, body)
    return NextResponse.json(playlist)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal memperbarui playlist" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const activeSchedule = await prisma.schedule.findFirst({
    where: { playlistId: params.id, status: "ACTIVE" },
  })

  if (activeSchedule) {
    return NextResponse.json(
      { error: "Playlist masih dipakai di jadwal aktif, tidak bisa dihapus", code: "IN_USE" },
      { status: 409 }
    )
  }

  const playlist = await prisma.playlist.findUnique({ where: { id: params.id } })
  if (!playlist) {
    return NextResponse.json({ error: "Playlist tidak ditemukan" }, { status: 404 })
  }

  await prisma.playlist.delete({ where: { id: params.id } })
  await createLog(session.user.id, "PLAYLIST_DELETE", "Playlist", params.id, { name: playlist.name })

  return NextResponse.json({ success: true })
}
