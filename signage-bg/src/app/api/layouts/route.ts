import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createLog } from "@/lib/activity-log"

export async function GET(): Promise<NextResponse> {
  const layouts = await prisma.layout.findMany({ orderBy: { createdAt: "asc" } })
  return NextResponse.json({ data: layouts })
}

const zoneSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["main", "sidebar", "ticker", "clock"]),
  position: z.enum(["top", "bottom", "left", "right", "full"]),
  width: z.string().optional(),
  height: z.string().optional(),
})

const createSchema = z.object({
  name: z.string().min(1),
  isDefault: z.boolean().optional(),
  zones: z.object({ zones: z.array(zoneSchema).min(1) }),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = createSchema.parse(await req.json())
    const layout = await prisma.layout.create({
      data: { name: body.name, isDefault: body.isDefault ?? false, zones: body.zones },
    })
    await createLog(session.user.id, "LAYOUT_CREATE", "Layout", layout.id, { name: layout.name })
    return NextResponse.json(layout, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Data tidak valid", code: "VALIDATION" }, { status: 400 })
    }
    console.error(err)
    return NextResponse.json({ error: "Gagal membuat layout" }, { status: 500 })
  }
}
