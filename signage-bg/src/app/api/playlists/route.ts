import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

export async function GET(): Promise<NextResponse> {
  const playlists = await prisma.playlist.findMany({
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { items: true } } },
  })

  return NextResponse.json({
    data: playlists.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      itemCount: p._count.items,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })),
  })
}

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = createSchema.parse(await req.json())
    const playlist = await prisma.playlist.create({ data: body })
    await createLog(session.user.id, "PLAYLIST_CREATE", "Playlist", playlist.id, { name: playlist.name })
    return NextResponse.json(playlist, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal membuat playlist" }, { status: 500 })
  }
}
