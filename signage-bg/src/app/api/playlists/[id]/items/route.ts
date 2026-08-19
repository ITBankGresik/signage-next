import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { serializePlaylistItem } from "@/lib/serialize"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const items = await prisma.playlistItem.findMany({
    where: { playlistId: params.id },
    orderBy: { order: "asc" },
    include: { content: true },
  })
  return NextResponse.json({ data: items.map(serializePlaylistItem) })
}

const createSchema = z.object({
  contentId: z.string().min(1),
  order: z.number().int().nonnegative().optional(),
  durationOverride: z.number().int().positive().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = createSchema.parse(await req.json())

    let order = body.order
    if (order === undefined) {
      const last = await prisma.playlistItem.findFirst({
        where: { playlistId: params.id },
        orderBy: { order: "desc" },
      })
      order = last ? last.order + 1 : 0
    }

    const item = await prisma.playlistItem.create({
      data: {
        playlistId: params.id,
        contentId: body.contentId,
        order,
        durationOverride: body.durationOverride,
      },
      include: { content: true },
    })

    await prisma.playlist.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(serializePlaylistItem(item), { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal menambah item playlist" }, { status: 500 })
  }
}

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), order: z.number().int().nonnegative() })),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = reorderSchema.parse(await req.json())

    await prisma.$transaction(
      body.items.map((item) =>
        prisma.playlistItem.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    )

    await prisma.playlist.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal mengurutkan item" }, { status: 500 })
  }
}
