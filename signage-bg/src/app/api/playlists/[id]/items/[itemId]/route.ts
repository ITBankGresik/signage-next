import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { serializePlaylistItem } from "@/lib/serialize"

const patchSchema = z.object({
  durationOverride: z.number().int().positive().nullable(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = patchSchema.parse(await req.json())
    const item = await prisma.playlistItem.update({
      where: { id: params.itemId },
      data: { durationOverride: body.durationOverride },
      include: { content: true },
    })
    return NextResponse.json(serializePlaylistItem(item))
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal memperbarui item" }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.playlistItem.delete({ where: { id: params.itemId } })
  await prisma.playlist.update({ where: { id: params.id }, data: { updatedAt: new Date() } })

  return NextResponse.json({ success: true })
}
