import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const layout = await prisma.layout.findUnique({ where: { id: params.id } })
  if (!layout) {
    return NextResponse.json({ error: "Layout tidak ditemukan" }, { status: 404 })
  }
  return NextResponse.json(layout)
}

const zoneSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["main", "sidebar", "ticker", "clock"]),
  position: z.enum(["top", "bottom", "left", "right", "full"]),
  width: z.string().optional(),
  height: z.string().optional(),
})

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
  zones: z.object({ zones: z.array(zoneSchema).min(1) }).optional(),
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
    const layout = await prisma.layout.update({ where: { id: params.id }, data: body })
    await createLog(session.user.id, "LAYOUT_UPDATE", "Layout", layout.id, body)

    if (body.zones) {
      const screens = await prisma.screen.findMany({ where: { layoutId: layout.id }, select: { id: true } })
      const { broadcast } = await import("@/lib/sse")
      for (const screen of screens) {
        broadcast(screen.id, { type: "screen_config_update" })
      }
    }

    return NextResponse.json(layout)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal memperbarui layout" }, { status: 500 })
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
    const inUse = await prisma.screen.findFirst({ where: { layoutId: params.id } })
    if (inUse) {
      return NextResponse.json(
        { error: "Layout masih dipakai oleh salah satu layar", code: "LAYOUT_IN_USE" },
        { status: 409 }
      )
    }

    const layout = await prisma.layout.delete({ where: { id: params.id } })
    await createLog(session.user.id, "LAYOUT_DELETE", "Layout", layout.id, { name: layout.name })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Gagal menghapus layout" }, { status: 500 })
  }
}
