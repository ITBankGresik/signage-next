import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const screen = await prisma.screen.findUnique({
    where: { id: params.id },
    include: {
      layout: true,
      schedules: {
        where: { status: "ACTIVE", startAt: { lte: new Date() }, endAt: { gte: new Date() } },
        include: { playlist: true },
      },
    },
  })

  if (!screen) {
    return NextResponse.json({ error: "Layar tidak ditemukan" }, { status: 404 })
  }

  return NextResponse.json(screen)
}

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  layoutId: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
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
    const screen = await prisma.screen.update({ where: { id: params.id }, data: body })
    await createLog(session.user.id, "SCREEN_UPDATE", "Screen", screen.id, body)

    if (body.layoutId) {
      const { broadcast } = await import("@/lib/sse")
      broadcast(screen.id, { type: "screen_config_update" })
    }

    return NextResponse.json(screen)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal memperbarui layar" }, { status: 500 })
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

  try {
    const activeSchedule = await prisma.schedule.findFirst({
      where: { screenId: params.id, status: "ACTIVE" },
    })
    if (activeSchedule) {
      return NextResponse.json(
        { error: "Layar masih memiliki jadwal aktif, tidak bisa dihapus", code: "SCREEN_HAS_ACTIVE_SCHEDULE" },
        { status: 409 }
      )
    }

    const screen = await prisma.screen.delete({ where: { id: params.id } })
    await createLog(session.user.id, "SCREEN_DELETE", "Screen", screen.id, { name: screen.name })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Gagal menghapus layar" }, { status: 500 })
  }
}
